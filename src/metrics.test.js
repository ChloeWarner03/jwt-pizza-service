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
});