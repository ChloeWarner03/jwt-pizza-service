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

  // Middleware to track HTTP requests
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
  }

  pizzaPurchase(success, latency, price) {
    if (success) {
      this.purchaseMetrics.sold++;
      this.purchaseMetrics.revenue += price;
    } else {
      this.purchaseMetrics.failures++;
    }
    this.purchaseMetrics.creationLatency = latency;
  }

  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return (cpuUsage * 100).toFixed(2);
  }

  getMemoryUsagePercentage() {
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
    this.sendMetric('http_requests_get', this.httpMetrics.get, 'sum', '1');
    this.sendMetric('http_requests_post', this.httpMetrics.post, 'sum', '1');
    this.sendMetric('http_requests_put', this.httpMetrics.put, 'sum', '1');
    this.sendMetric('http_requests_delete', this.httpMetrics.delete, 'sum', '1');

    // Auth metrics
    this.sendMetric('auth_successful', this.authMetrics.successful, 'sum', '1');
    this.sendMetric('auth_failed', this.authMetrics.failed, 'sum', '1');

    // User metrics
    this.sendMetric('active_users', this.userMetrics.activeUsers, 'gauge', '1');

    // System metrics
    this.sendMetric('cpu_usage', this.getCpuUsagePercentage(), 'gauge', '%');
    this.sendMetric('memory_usage', this.getMemoryUsagePercentage(), 'gauge', '%');

    // Pizza metrics
    this.sendMetric('pizzas_sold', this.purchaseMetrics.sold, 'sum', '1');
    this.sendMetric('pizza_failures', this.purchaseMetrics.failures, 'sum', '1');
    this.sendMetric('pizza_revenue', this.purchaseMetrics.revenue, 'sum', '1');
    this.sendMetric('pizza_creation_latency', this.purchaseMetrics.creationLatency, 'gauge', 'ms');

    // Latency
    this.sendMetric('service_latency', this.serviceLatency, 'gauge', 'ms');
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
                asInt: Math.round(metricValue),
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