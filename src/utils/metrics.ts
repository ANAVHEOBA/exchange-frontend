/**
 * API Performance Metrics Utilities
 * Tools for analyzing and displaying API performance data
 */

import { apiClient, type RequestMetrics } from '../api/client';

export interface EndpointStats {
  endpoint: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
}

/**
 * Get performance statistics for all endpoints
 */
export function getEndpointStats(): EndpointStats[] {
  const metrics = apiClient.getMetrics();
  const grouped = new Map<string, RequestMetrics[]>();

  // Group by endpoint
  metrics.forEach(metric => {
    const key = `${metric.method} ${metric.endpoint}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(metric);
  });

  // Calculate stats for each endpoint
  const stats: EndpointStats[] = [];
  
  grouped.forEach((requests, endpoint) => {
    const durations = requests.map(r => r.duration);
    const successCount = requests.filter(r => r.status >= 200 && r.status < 300).length;

    stats.push({
      endpoint,
      count: requests.length,
      avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: Math.round((successCount / requests.length) * 100),
    });
  });

  return stats.sort((a, b) => b.count - a.count);
}

/**
 * Print performance metrics to console
 */
export function printMetrics(): void {
  const stats = getEndpointStats();
  
  if (stats.length === 0) {
    console.log('No metrics available');
    return;
  }

  console.log('\n' + '='.repeat(80));
  console.log('API PERFORMANCE METRICS');
  console.log('='.repeat(80));
  console.log(
    'Endpoint'.padEnd(40) +
    'Calls'.padEnd(8) +
    'Avg'.padEnd(8) +
    'Min'.padEnd(8) +
    'Max'.padEnd(8) +
    'Success'
  );
  console.log('-'.repeat(80));

  stats.forEach(stat => {
    const color = stat.avgDuration < 100 ? '\x1b[32m' : stat.avgDuration < 500 ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(
      stat.endpoint.padEnd(40) +
      stat.count.toString().padEnd(8) +
      `${color}${stat.avgDuration}ms${reset}`.padEnd(16) +
      `${stat.minDuration}ms`.padEnd(8) +
      `${stat.maxDuration}ms`.padEnd(8) +
      `${stat.successRate}%`
    );
  });

  console.log('='.repeat(80) + '\n');
}

/**
 * Get slow endpoints (avg > threshold ms)
 */
export function getSlowEndpoints(threshold: number = 500): EndpointStats[] {
  return getEndpointStats().filter(stat => stat.avgDuration > threshold);
}

/**
 * Get endpoints with low success rate (< threshold %)
 */
export function getUnreliableEndpoints(threshold: number = 95): EndpointStats[] {
  return getEndpointStats().filter(stat => stat.successRate < threshold);
}

/**
 * Export metrics as JSON
 */
export function exportMetrics(): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    stats: getEndpointStats(),
    raw: apiClient.getMetrics(),
  }, null, 2);
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).apiMetrics = {
    print: printMetrics,
    getStats: getEndpointStats,
    getSlow: getSlowEndpoints,
    getUnreliable: getUnreliableEndpoints,
    export: exportMetrics,
    clear: () => apiClient.clearMetrics(),
  };
}
