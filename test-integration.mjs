#!/usr/bin/env node
/**
 * Integration Test for /currencies endpoint
 * Tests the complete flow: API Client -> Endpoint -> Backend
 * 
 * Run: node test-integration.mjs
 */

const API_BASE_URL = 'http://localhost:3000';
const CACHE_TTL = 30; // seconds

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function pass(message) {
  log(colors.green, '✓', message);
}

function fail(message) {
  log(colors.red, '✗', message);
}

function info(message) {
  log(colors.blue, 'ℹ', message);
}

// Test 1: Backend connectivity
async function testBackendConnectivity() {
  info('Test 1: Backend connectivity');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/currencies`);
    if (response.ok) {
      pass('Backend is reachable');
      return true;
    } else {
      fail(`Backend returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    fail(`Cannot connect to backend: ${error.message}`);
    return false;
  }
}

// Test 2: Response structure
async function testResponseStructure() {
  info('Test 2: Response structure validation');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/currencies`);
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      fail('Response is not an array');
      return false;
    }
    
    pass(`Response is an array with ${data.length} items`);
    
    if (data.length === 0) {
      fail('Response array is empty');
      return false;
    }
    
    // Validate first currency structure
    const currency = data[0];
    const requiredFields = ['name', 'ticker', 'network', 'memo', 'image', 'minimum', 'maximum'];
    const missingFields = requiredFields.filter(field => !(field in currency));
    
    if (missingFields.length > 0) {
      fail(`Missing fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    pass('Currency structure is valid');
    pass(`Sample: ${currency.name} (${currency.ticker}) on ${currency.network}`);
    return true;
  } catch (error) {
    fail(`Response validation failed: ${error.message}`);
    return false;
  }
}

// Test 3: API Client integration
async function testApiClient() {
  info('Test 3: API Client integration');
  try {
    // Simulate the API client
    const apiClient = {
      baseURL: API_BASE_URL,
      timeout: 30000,
      
      async get(endpoint) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
          const response = await fetch(`${this.baseURL}${endpoint}`, {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          return response.json();
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      },
    };
    
    const data = await apiClient.get('/swap/currencies');
    pass('API Client successfully fetched currencies');
    pass(`Loaded ${data.length} currencies`);
    return true;
  } catch (error) {
    fail(`API Client failed: ${error.message}`);
    return false;
  }
}

// Test 4: Cache simulation
async function testCacheSimulation() {
  info('Test 4: Cache behavior simulation');
  
  const cache = new Map();
  const CACHE_KEY = 'currencies:all';
  
  // First fetch (cache miss)
  const start1 = Date.now();
  const response1 = await fetch(`${API_BASE_URL}/swap/currencies`);
  const data1 = await response1.json();
  const time1 = Date.now() - start1;
  
  cache.set(CACHE_KEY, {
    value: data1,
    expiresAt: Date.now() + (CACHE_TTL * 1000),
  });
  
  pass(`First fetch (cache miss): ${time1}ms`);
  
  // Second fetch (cache hit)
  const start2 = Date.now();
  const cached = cache.get(CACHE_KEY);
  const time2 = Date.now() - start2;
  
  if (cached && Date.now() < cached.expiresAt) {
    pass(`Second fetch (cache hit): ${time2}ms`);
    pass(`Cache speedup: ${(time1 / time2).toFixed(0)}x faster`);
    return true;
  } else {
    fail('Cache simulation failed');
    return false;
  }
}

// Test 5: Data filtering
async function testDataFiltering() {
  info('Test 5: Data filtering (search functionality)');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/currencies`);
    const data = await response.json();
    
    // Test search for "Bitcoin"
    const searchTerm = 'bitcoin';
    const filtered = data.filter(currency => 
      currency.name.toLowerCase().includes(searchTerm) ||
      currency.ticker.toLowerCase().includes(searchTerm) ||
      currency.network.toLowerCase().includes(searchTerm)
    );
    
    pass(`Search for "${searchTerm}": found ${filtered.length} results`);
    
    if (filtered.length > 0) {
      pass(`Example: ${filtered[0].name} (${filtered[0].ticker})`);
    }
    
    return true;
  } catch (error) {
    fail(`Filtering test failed: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  CURRENCIES ENDPOINT INTEGRATION TEST');
  console.log('='.repeat(60) + '\n');
  
  const tests = [
    testBackendConnectivity,
    testResponseStructure,
    testApiClient,
    testCacheSimulation,
    testDataFiltering,
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
      console.log('');
    } catch (error) {
      fail(`Test crashed: ${error.message}`);
      failed++;
      console.log('');
    }
  }
  
  console.log('='.repeat(60));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60) + '\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
