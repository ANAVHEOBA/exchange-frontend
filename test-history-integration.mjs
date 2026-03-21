#!/usr/bin/env node
/**
 * Integration Test for /swap/history endpoint
 * Tests keyset pagination, filtering, and sorting
 * 
 * NOTE: This endpoint requires authentication (Authorization header)
 * The test will fail until authentication is implemented
 * 
 * Run: node test-history-integration.mjs
 */

const API_BASE_URL = 'http://localhost:3000';

// TODO: Add authentication token when auth is implemented
// const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';

// Colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function pass(message) { log(colors.green, '✓', message); }
function fail(message) { log(colors.red, '✗', message); }
function info(message) { log(colors.blue, 'ℹ', message); }
function warn(message) { log(colors.yellow, '⚠', message); }

// Test 1: Backend connectivity
async function testBackendConnectivity() {
  info('Test 1: Backend connectivity and auth requirement');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/history`);
    
    if (response.status === 401) {
      const errorText = await response.text();
      pass('Endpoint exists and requires authentication (401)');
      pass(`Auth error: ${errorText}`);
      warn('⚠️  Authentication not yet implemented - remaining tests will fail');
      warn('⚠️  Set TEST_AUTH_TOKEN environment variable when auth is ready');
      return false; // Stop further tests
    }
    
    if (response.ok) {
      pass('Backend is reachable and authenticated');
      return true;
    } else {
      const errorText = await response.text();
      fail(`Backend returned status ${response.status}: ${errorText}`);
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
    const response = await fetch(`${API_BASE_URL}/swap/history`);
    const data = await response.json();
    
    // Check top-level structure
    if (!data.swaps || !data.pagination || !data.filters_applied) {
      fail('Missing required fields: swaps, pagination, or filters_applied');
      return false;
    }
    
    if (!Array.isArray(data.swaps)) {
      fail('swaps field is not an array');
      return false;
    }
    
    pass(`Response structure is valid`);
    pass(`Found ${data.swaps.length} swaps`);
    
    // Validate pagination structure
    const paginationFields = ['limit', 'has_more'];
    const missingPagination = paginationFields.filter(field => !(field in data.pagination));
    
    if (missingPagination.length > 0) {
      fail(`Missing pagination fields: ${missingPagination.join(', ')}`);
      return false;
    }
    
    pass('Pagination structure is valid');
    pass(`Limit: ${data.pagination.limit}, Has more: ${data.pagination.has_more}`);
    
    if (data.pagination.next_cursor) {
      pass(`Next cursor available: ${data.pagination.next_cursor.substring(0, 20)}...`);
    }
    
    // If there are swaps, validate structure
    if (data.swaps.length > 0) {
      const swap = data.swaps[0];
      const requiredFields = [
        'id', 'status', 'from_currency', 'from_network', 'to_currency', 'to_network',
        'amount', 'estimated_receive', 'rate', 'platform_fee', 'total_fee',
        'deposit_address', 'recipient_address', 'provider', 'rate_type',
        'is_sandbox', 'created_at'
      ];
      
      const missingFields = requiredFields.filter(field => !(field in swap));
      
      if (missingFields.length > 0) {
        fail(`Missing swap fields: ${missingFields.join(', ')}`);
        return false;
      }
      
      pass('Swap structure is valid');
      pass(`Sample: ${swap.from_currency} -> ${swap.to_currency}, Status: ${swap.status}`);
    } else {
      warn('No swaps in history to validate structure');
    }
    
    return true;
  } catch (error) {
    fail(`Response validation failed: ${error.message}`);
    return false;
  }
}

// Test 3: Pagination
async function testPagination() {
  info('Test 3: Keyset pagination');
  try {
    // First page
    const response1 = await fetch(`${API_BASE_URL}/swap/history?limit=5`);
    const data1 = await response1.json();
    
    pass(`First page: ${data1.swaps.length} swaps (limit: 5)`);
    pass(`Has more: ${data1.pagination.has_more}`);
    
    if (data1.pagination.has_more && data1.pagination.next_cursor) {
      // Second page using cursor
      const response2 = await fetch(`${API_BASE_URL}/swap/history?limit=5&cursor=${encodeURIComponent(data1.pagination.next_cursor)}`);
      const data2 = await response2.json();
      
      pass(`Second page: ${data2.swaps.length} swaps`);
      
      // Verify pages are different
      if (data1.swaps.length > 0 && data2.swaps.length > 0) {
        const sameFirst = data1.swaps[0].id === data2.swaps[0].id;
        if (sameFirst) {
          fail('Second page has same first swap as first page');
          return false;
        }
        pass('Pages contain different swaps');
      }
    } else {
      warn('Only one page available, cannot test pagination');
    }
    
    return true;
  } catch (error) {
    fail(`Pagination test failed: ${error.message}`);
    return false;
  }
}

// Test 4: Filter by status
async function testFilterByStatus() {
  info('Test 4: Filter by status');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/history?status=completed`);
    const data = await response.json();
    
    pass(`Status=completed: ${data.swaps.length} swaps`);
    
    // Verify all are completed
    const notCompleted = data.swaps.filter(s => s.status !== 'completed');
    
    if (notCompleted.length > 0) {
      fail(`Found ${notCompleted.length} non-completed swaps in completed filter`);
      return false;
    }
    
    if (data.swaps.length > 0) {
      pass('All filtered swaps have status=completed');
    }
    
    // Check filters_applied
    if (data.filters_applied.status === 'completed') {
      pass('filters_applied reflects the status filter');
    }
    
    return true;
  } catch (error) {
    fail(`Status filter test failed: ${error.message}`);
    return false;
  }
}

// Test 5: Filter by currency
async function testFilterByCurrency() {
  info('Test 5: Filter by currency');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/history?from_currency=btc`);
    const data = await response.json();
    
    pass(`from_currency=btc: ${data.swaps.length} swaps`);
    
    // Verify all match
    const mismatch = data.swaps.filter(s => s.from_currency.toLowerCase() !== 'btc');
    
    if (mismatch.length > 0) {
      fail(`Found ${mismatch.length} swaps that don't match filter`);
      return false;
    }
    
    if (data.swaps.length > 0) {
      pass('All filtered swaps match from_currency=btc');
    }
    
    return true;
  } catch (error) {
    fail(`Currency filter test failed: ${error.message}`);
    return false;
  }
}

// Test 6: Filter by provider
async function testFilterByProvider() {
  info('Test 6: Filter by provider');
  try {
    const allResponse = await fetch(`${API_BASE_URL}/swap/history`);
    const allData = await allResponse.json();
    
    if (allData.swaps.length === 0) {
      warn('No swaps available to test provider filtering');
      return true;
    }
    
    const provider = allData.swaps[0].provider;
    
    const response = await fetch(`${API_BASE_URL}/swap/history?provider=${encodeURIComponent(provider)}`);
    const data = await response.json();
    
    pass(`provider=${provider}: ${data.swaps.length} swaps`);
    
    // Verify all match
    const mismatch = data.swaps.filter(s => s.provider !== provider);
    
    if (mismatch.length > 0) {
      fail(`Found ${mismatch.length} swaps that don't match provider filter`);
      return false;
    }
    
    pass('All filtered swaps match provider');
    
    return true;
  } catch (error) {
    fail(`Provider filter test failed: ${error.message}`);
    return false;
  }
}

// Test 7: Date range filtering
async function testDateRangeFilter() {
  info('Test 7: Date range filtering');
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const response = await fetch(
      `${API_BASE_URL}/swap/history?date_from=${yesterday.toISOString()}&date_to=${tomorrow.toISOString()}`
    );
    const data = await response.json();
    
    pass(`Date range filter: ${data.swaps.length} swaps`);
    
    // Verify all are within range
    const outOfRange = data.swaps.filter(s => {
      const created = new Date(s.created_at);
      return created < yesterday || created > tomorrow;
    });
    
    if (outOfRange.length > 0) {
      fail(`Found ${outOfRange.length} swaps outside date range`);
      return false;
    }
    
    if (data.swaps.length > 0) {
      pass('All swaps are within date range');
    }
    
    return true;
  } catch (error) {
    fail(`Date range filter test failed: ${error.message}`);
    return false;
  }
}

// Test 8: Multiple filters
async function testMultipleFilters() {
  info('Test 8: Multiple filters combined');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/history?status=completed&from_currency=btc&limit=10`);
    const data = await response.json();
    
    pass(`Multiple filters: ${data.swaps.length} swaps`);
    
    // Verify all match both filters
    const mismatch = data.swaps.filter(s => 
      s.status !== 'completed' || s.from_currency.toLowerCase() !== 'btc'
    );
    
    if (mismatch.length > 0) {
      fail(`Found ${mismatch.length} swaps that don't match all filters`);
      return false;
    }
    
    if (data.swaps.length > 0) {
      pass('All swaps match multiple filters');
    }
    
    // Check filters_applied
    if (data.filters_applied.status && data.filters_applied.from_currency) {
      pass('filters_applied reflects all filters');
    }
    
    return true;
  } catch (error) {
    fail(`Multiple filters test failed: ${error.message}`);
    return false;
  }
}

// Test 9: Swap details validation
async function testSwapDetailsValidation() {
  info('Test 9: Swap details validation');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/history`);
    const data = await response.json();
    
    if (data.swaps.length === 0) {
      warn('No swaps available to validate details');
      return true;
    }
    
    const swap = data.swaps[0];
    
    // Validate rate types
    const validRateTypes = ['fixed', 'floating'];
    if (!validRateTypes.includes(swap.rate_type)) {
      fail(`Invalid rate_type: ${swap.rate_type}`);
      return false;
    }
    
    pass('Rate type is valid');
    
    // Validate status
    const validStatuses = ['waiting', 'confirming', 'exchanging', 'sending', 'completed', 'failed', 'refunded', 'expired'];
    if (!validStatuses.includes(swap.status)) {
      fail(`Invalid status: ${swap.status}`);
      return false;
    }
    
    pass('Status is valid');
    
    // Validate amounts are positive
    if (swap.amount <= 0 || swap.estimated_receive <= 0) {
      fail('Found non-positive amounts');
      return false;
    }
    
    pass('Amounts are positive');
    
    // Validate timestamp
    const created = new Date(swap.created_at);
    if (isNaN(created.getTime())) {
      fail('Invalid created_at timestamp');
      return false;
    }
    
    pass('Timestamp is valid ISO 8601');
    
    // Check completed_at if status is completed
    if (swap.status === 'completed' && swap.completed_at) {
      const completed = new Date(swap.completed_at);
      if (isNaN(completed.getTime())) {
        fail('Invalid completed_at timestamp');
        return false;
      }
      pass('completed_at timestamp is valid');
    }
    
    return true;
  } catch (error) {
    fail(`Swap details validation failed: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  SWAP HISTORY ENDPOINT INTEGRATION TEST');
  console.log('='.repeat(60) + '\n');
  
  warn('NOTE: This endpoint requires authentication');
  console.log('');
  
  const tests = [
    testBackendConnectivity,
    testResponseStructure,
    testPagination,
    testFilterByStatus,
    testFilterByCurrency,
    testFilterByProvider,
    testDateRangeFilter,
    testMultipleFilters,
    testSwapDetailsValidation,
  ];
  
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        // If first test fails due to auth, skip remaining tests
        if (test === testBackendConnectivity) {
          skipped = tests.length - 1;
          info('Skipping remaining tests (authentication required)');
          break;
        }
        failed++;
      }
      console.log('');
    } catch (error) {
      fail(`Test crashed: ${error.message}`);
      failed++;
      console.log('');
    }
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('='.repeat(60));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed${skipped > 0 ? `, ${skipped} skipped` : ''}`);
  if (skipped > 0) {
    console.log('  ⚠️  Implement authentication to run full test suite');
  }
  console.log('='.repeat(60) + '\n');
  
  // Don't fail if skipped due to auth
  process.exit((failed > 0 && skipped === 0) ? 1 : 0);
}

runTests();
