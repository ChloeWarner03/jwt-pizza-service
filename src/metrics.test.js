const metrics = require('./metrics');

describe('metrics', () => {
  test('trackAuth success', () => {
    metrics.trackAuth(true);
    expect(metrics.authMetrics.successful).toBeGreaterThan(0);
  });

  test('trackAuth failure', () => {
    metrics.trackAuth(false);
    expect(metrics.authMetrics.failed).toBeGreaterThan(0);
  });

  test('trackActiveUser increment', () => {
    const before = metrics.userMetrics.activeUsers;
    metrics.trackActiveUser(1);
    expect(metrics.userMetrics.activeUsers).toBe(before + 1);
  });

    test('trackActiveUser decrement', () => {
    const before = metrics.userMetrics.activeUsers;
    metrics.trackActiveUser(-1);
    expect(metrics.userMetrics.activeUsers).toBe(before - 1);
  });

  test('pizzaPurchase success', () => {
    metrics.pizzaPurchase(true, 100, 0.05);
    expect(metrics.purchaseMetrics.sold).toBeGreaterThan(0);
    expect(metrics.purchaseMetrics.revenue).toBeGreaterThan(0);
  });

  test('pizzaPurchase failure', () => {
    metrics.pizzaPurchase(false, 100, 0);
    expect(metrics.purchaseMetrics.failures).toBeGreaterThan(0);
  });

  test('getCpuUsagePercentage', () => {
    const cpu = metrics.getCpuUsagePercentage();
    expect(cpu).toBeDefined();
  });

  test('getMemoryUsagePercentage', () => {
    const mem = metrics.getMemoryUsagePercentage();
    expect(mem).toBeDefined();
  });

test('sendAllMetrics does not throw', () => {
    expect(() => metrics.sendAllMetrics()).not.toThrow();
  });

  test('sendMetric gauge does not throw', () => {
    expect(() => metrics.sendMetric('test_gauge', 42, 'gauge', '%')).not.toThrow();
  });

  test('sendMetric sum does not throw', () => {
    expect(() => metrics.sendMetric('test_sum', 10, 'sum', '1')).not.toThrow();
  });

  test('requestTracker middleware', () => {
    const req = { method: 'GET' };
    const res = { on: jest.fn() };
    const next = jest.fn();
    metrics.requestTracker(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(metrics.httpMetrics.get).toBeGreaterThan(0);
  });

  test('requestTracker POST', () => {
    const req = { method: 'POST' };
    const res = { on: jest.fn() };
    const next = jest.fn();
    metrics.requestTracker(req, res, next);
    expect(metrics.httpMetrics.post).toBeGreaterThan(0);
  });

  test('requestTracker DELETE', () => {
    const req = { method: 'DELETE' };
    const res = { on: jest.fn() };
    const next = jest.fn();
    metrics.requestTracker(req, res, next);
    expect(metrics.httpMetrics.delete).toBeGreaterThan(0);
  });
});