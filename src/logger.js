const config = require('./config');

const SENSITIVE_KEYS = /^(password|token|apiKey|api_key|authorization|secret|creditCard|ssn)$/i;

class Logger {
  httpLogger = (req, res, next) => {
    const originalSend = res.send.bind(res);

    res.send = (resBody) => {
      res.send = originalSend;

      const logData = {
        authorized: !!req.headers.authorization,
        path: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        reqBody: req.body,
        resBody: this.tryParseJson(resBody),
      };

      this.log(this.statusToLogLevel(res.statusCode), 'http', logData);

      return originalSend(resBody);
    };

    next();
  };

  log(level, type, logData) {
    const labels = {
      component: config.logging.source,
      level,
      type,
    };
     
    const values = [[this.nowString(), JSON.stringify(this.sanitize(logData))]];
    const logEvent = { streams: [{ stream: { ...labels, ...this.flattenForLabels(logData) }, values }] };
    this.sendLogToGrafana(logEvent);
  }

  flattenForLabels(obj) {
    const labels = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        labels[k] = String(v);
      }
    }
    return labels;
  }
  // Helpers

  statusToLogLevel(statusCode) {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'info';
  }

  nowString() {
    return (BigInt(Date.now()) * 1_000_000n).toString();
  }

  tryParseJson(value) {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  sanitize(obj) {
    const redact = (val) => {
      if (typeof val === 'string') return val;
      if (Array.isArray(val)) return val.map(redact);
      if (val && typeof val === 'object') {
        return Object.fromEntries(
          Object.entries(val).map(([k, v]) =>
            SENSITIVE_KEYS.test(k) ? [k, '*****'] : [k, redact(v)]
          )
        );
      }
      return val;
    };
    return JSON.stringify(redact(obj));
  }

  sendLogToGrafana(event) {
    fetch(config.logging.endpointUrl, {
      method: 'post',
      body: JSON.stringify(event),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.logging.accountId}:${config.logging.apiKey}`,
      },
    }).then((res) => {
      if (!res.ok) res.text().then((t) => console.error('Grafana log failed:', res.status, t));
    }).catch((err) => console.error('Grafana log error:', err));
  }
}

module.exports = new Logger();