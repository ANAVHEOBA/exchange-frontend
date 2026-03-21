#!/usr/bin/env node
/**
 * API Performance Metrics Test
 * Demonstrates endpoint performance tracking
 * 
 * Run: node test-metrics.mjs
 */

const API_BASE_URL = 'http://localhost:3000';

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const metrics = [];

async function measureEndpoint(name, method, url, body = null) {
  const startTime = performance.now();
  
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const duration = Math.round(performance.now() - startTime);
    
    metrics.push({
      name,
      method,
      duration,
      status: response.status,
      success: response.ok,
    });
    
    return { duration, status: response.status, ok: response.ok };
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    metrics.push({
      name,
      method,
      duration,
      status: 0,
      success: false,
      error: error.message,
    });
    return { duration, status: 0, ok: false, error: error.message };
  }
}

function getColor(duration) {
  if (duration < 100) return colors.green;
  if (duration < 500) return colors.yellow;
  return colors.red;
}

function printMetrics() {
  console.log('\n' + '='.repeat(80));
  console.log('  API ENDPOINT PERFORMANCE METRICS');
  console.log('='.repeat(80));
  console.log(
    'Endpoint'.padEnd(35) +
    'Method'.padEnd(8) +
    'Duration'.padEnd(12) +
    'Status'.padEnd(10) +
    'Result'
  );
  console.log('-'.repeat(80));
  
  metrics.forEach(m => {
    const color = getColor(m.duration);
    const statusColor = m.success ? colors.green : colors.red;
    const result = m.success ? '✓ OK' : `✗ ${m.error || 'FAIL'}`;
    
    console.log(
      m.name.padEnd(35) +
      m.method.padEnd(8) +
      `${color}${m.duration}ms${colors.reset}`.padEnd(20) +
      `${statusColor}${m.status}${colors.reset}`.padEnd(18) +
      result
    );
  });
  
  console.log('='.repeat(80));
  
  // Calculate summary stats
  const successful = metrics.filter(m => m.success);
  const avgDuration = Math.round(
    metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
  );
  const successRate = Math.round((successful.length / metrics.length) * 100);
  
  console.log('\n' + colors.blue + 'SUMMARY:' + colors.reset);
  console.log(`Total Requests: ${metrics.length}`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Average Duration: ${getColor(avgDuration)}${avgDuration}ms${colors.reset}`);
  console.log(`Fastest: ${colors.green}${Math.min(...metrics.map(m => m.duration))}ms${colors.reset}`);
  console.log(`Slowest: ${colors.red}${Math.max(...metrics.map(m => m.duration))}ms${colors.reset}`);
  console.log('');
}

async function runTests() {
  console.log('\n' + colors.blue + 'Testing API endpoint performance...' + colors.reset + '\n');
  
  // Test various endpoints
  await measureEndpoint('GET /swap/currencies', 'GET', `${API_BASE_URL}/swap/currencies`);
  await new Promise(r => setTimeout(r, 100));
  
  await measureEndpoint('GET /swap/providers', 'GET', `${API_BASE_URL}/swap/providers`);
  await new Promise(r => setTimeout(r, 100));
  
  await measureEndpoint('GET /swap/pairs', 'GET', `${API_BASE_URL}/swap/pairs?page=1&size=10`);
  await new Promise(r => setTimeout(r, 100));
  
  await measureEndpoint('GET /swap/rates', 'GET', `${API_BASE_URL}/swap/rates?from=btc&network_from=Mainnet&to=usdt&network_to=TRC20&amount=0.001`);
  await new Promise(r => setTimeout(r, 100));
  
  await measureEndpoint('GET /swap/estimate', 'GET', `${API_BASE_URL}/swap/estimate?from=btc&to=usdt&amount=0.001&network_from=Mainnet&network_to=TRC20`);
  await new Promise(r => setTimeout(r, 100));
  
  await measureEndpoint('POST /swap/validate-address', 'POST', `${API_BASE_URL}/swap/validate-address`, {
    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    ticker: 'btc',
    network: 'Mainnet',
  });
  await new Promise(r => setTimeout(r, 100));
  
  await measureEndpoint('POST /auth/register', 'POST', `${API_BASE_URL}/auth/register`, {
    username: `perftest${Date.now()}`,
    email: `perftest${Date.now()}@example.com`,
    password: 'TestPass123!',
    password_confirm: 'TestPass123!',
  });
  await new Promise(r => setTimeout(r, 100));
  
  await measureEndpoint('POST /auth/login (invalid)', 'POST', `${API_BASE_URL}/auth/login`, {
    email: 'nonexistent@example.com',
    password: 'wrong',
  });
  
  // Print results
  printMetrics();
  
  // Identify slow endpoints
  const slow = metrics.filter(m => m.duration > 500);
  if (slow.length > 0) {
    console.log(colors.yellow + '⚠ SLOW ENDPOINTS (>500ms):' + colors.reset);
    slow.forEach(m => {
      console.log(`  - ${m.name}: ${m.duration}ms`);
    });
    console.log('');
  }
  
  // Identify failed endpoints
  const failed = metrics.filter(m => !m.success);
  if (failed.length > 0) {
    console.log(colors.red + '✗ FAILED ENDPOINTS:' + colors.reset);
    failed.forEach(m => {
      console.log(`  - ${m.name}: ${m.error || 'Unknown error'}`);
    });
    console.log('');
  }
}

runTests();
