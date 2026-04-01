const config = require('./config');
const os = require('os');

class Metrics {
  constructor() {
    this.httpMetrics = { total: 0, get: 0, post: 0, put: 0, delete: 0 };
    this.authMetrics = { successful: 0, failed: 0 };
    this.userMetrics = { activeUsers: 0 };
    this.purchaseMetrics = { sold: 0, failures: 0, revenue: 0, creationLatency: 0 };
    this.serviceLatency = 0;

    this.sendMetricsPeriodically(10000);
  }

  //Track HTTP requests
  requestTracker = (req, res, next) => {
    this.httpMetrics.total++;
    const method = req.method.toLowerCase();
    if (this.httpMetrics[method] !== undefined) {
      this.httpMetrics[method]++;
    }

    const start = Date.now();
    res.on('finish', () => {
      this.serviceLatency = Date.now() - start;
    });

    next();
  };

  trackAuth(success) {
    if (success) this.authMetrics.successful++;
    else this.authMetrics.failed++;
  }

  trackActiveUser(delta) {
    this.userMetrics.activeUsers += delta;
    if (this.userMetrics.activeUsers < 0) {
      this.userMetrics.activeUsers = 0;
    }
  }



  pizzaPurchase(success, latency, price) { //pizza purchase metric tracking
    if (success) {
      this.purchaseMetrics.sold++;
      this.purchaseMetrics.revenue += price;
    } else {
      this.purchaseMetrics.failures++;
    }
    this.purchaseMetrics.creationLatency = latency;
  }

  getCpuUsagePercentage() { //This is for the CPU usage metric
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return (cpuUsage * 100).toFixed(2);
  }
  getMemoryUsagePercentage() { //This is for the Memory usage metric
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    return (((totalMemory - freeMemory) / totalMemory) * 100).toFixed(2);
  }

  sendMetricsPeriodically(period) {
    setInterval(() => {
      try {
        this.sendAllMetrics();
      } catch (error) {
        console.error('Error sending metrics', error);
      }
    }, period);
  }

  sendAllMetrics() {
    // HTTP metrics
    this.sendMetric('http_requests_total', this.httpMetrics.total, 'sum', '1');
    this.sendMetric('http_requests_get_total', this.httpMetrics.get, 'sum', '1');
    this.sendMetric('http_requests_post_total', this.httpMetrics.post, 'sum', '1');
    this.sendMetric('http_requests_put_total', this.httpMetrics.put, 'sum', '1');
    this.sendMetric('http_requests_delete_total', this.httpMetrics.delete, 'sum', '1');

    // Auth metrics
    this.sendMetric('auth_successful_total', this.authMetrics.successful, 'sum', '1');
    this.sendMetric('auth_failed_total', this.authMetrics.failed, 'sum', '1');

    // User metrics
    this.sendMetric('active_users', this.userMetrics.activeUsers, 'gauge', '1');

    // System metrics
    this.sendMetric('cpu_usage_percent', this.getCpuUsagePercentage(), 'gauge', '%');
    this.sendMetric('memory_usage_percent', this.getMemoryUsagePercentage(), 'gauge', '%');

    // Pizza metrics
    this.sendMetric('pizzas_sold_total', this.purchaseMetrics.sold, 'sum', '1');
    this.sendMetric('pizza_failures_total', this.purchaseMetrics.failures, 'sum', '1');
    this.sendMetric('pizza_revenue_total', this.purchaseMetrics.revenue, 'sum', '1');
    this.sendMetric('pizza_creation_latency_milliseconds', this.purchaseMetrics.creationLatency, 'gauge', 'ms');

    // Latency
    this.sendMetric('service_latency_milliseconds', this.serviceLatency, 'gauge', 'ms');
  }

  sendMetric(metricName, metricValue, type, unit) {
    const metric = {
      resourceMetrics: [{
        scopeMetrics: [{
          metrics: [{
            name: metricName,
            unit: unit,
            [type]: {
              dataPoints: [{
                asDouble: parseFloat(metricValue),  // changed from asInt
                timeUnixNano: Date.now() * 1000000,
                attributes: [{
                  key: 'source',
                  value: { stringValue: config.metrics.source }
                }]
              }]
            }
          }]
        }]
      }]
    };

    if (type === 'sum') {
      metric.resourceMetrics[0].scopeMetrics[0].metrics[0][type].aggregationTemporality =
        'AGGREGATION_TEMPORALITY_CUMULATIVE';
      metric.resourceMetrics[0].scopeMetrics[0].metrics[0][type].isMonotonic = true;
    }

    fetch(config.metrics.endpointUrl, {
      method: 'POST',
      body: JSON.stringify(metric),
      headers: {
        Authorization: `Bearer ${config.metrics.accountId}:${config.metrics.apiKey}`,
        'Content-Type': 'application/json',
      },
    }).catch((error) => {
      console.error('Error pushing metric:', metricName, error);
    });
  }
}

const metrics = new Metrics();
module.exports = metrics;
