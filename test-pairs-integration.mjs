#!/usr/bin/env node
/**
 * Integration Test for /pairs endpoint
 * Tests the complete flow: API Client -> Endpoint -> Backend
 * 
 * Run: node test-pairs-integration.mjs
 */

const API_BASE_URL = 'http://localhost:3000';

// Colors for terminal output
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

function pass(message) {
  log(colors.green, '✓', message);
}

function fail(message) {
  log(colors.red, '✗', message);
}

function info(message) {
  log(colors.blue, 'ℹ', message);
}

function warn(message) {
  log(colors.yellow, '⚠', message);
}

// Test 1: Backend connectivity
async function testBackendConnectivity() {
  info('Test 1: Backend connectivity');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/pairs`);
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
    const response = await fetch(`${API_BASE_URL}/swap/pairs`);
    const data = await response.json();
    
    // Check top-level structure
    if (!data.pairs || !data.pagination) {
      fail('Response missing required fields: pairs or pagination');
      return false;
    }
    
    if (!Array.isArray(data.pairs)) {
      fail('pairs field is not an array');
      return false;
    }
    
    pass(`Response structure is valid`);
    pass(`Found ${data.pairs.length} pairs`);
    
    // Validate pagination structure
    const paginationFields = ['page', 'size', 'total_elements', 'total_pages', 'has_next', 'has_prev'];
    const missingPagination = paginationFields.filter(field => !(field in data.pagination));
    
    if (missingPagination.length > 0) {
      fail(`Missing pagination fields: ${missingPagination.join(', ')}`);
      return false;
    }
    
    pass('Pagination structure is valid');
    pass(`Page ${data.pagination.page}, Size ${data.pagination.size}, Total ${data.pagination.total_elements}`);
    
    // If there are pairs, validate structure
    if (data.pairs.length > 0) {
      const pair = data.pairs[0];
      const requiredFields = ['name', 'base_currency', 'quote_currency', 'base_network', 'quote_network', 'status', 'last_updated'];
      const optionalFields = ['min_amount', 'max_amount'];
      const missingFields = requiredFields.filter(field => !(field in pair));
      
      if (missingFields.length > 0) {
        fail(`Missing required fields in pair: ${missingFields.join(', ')}`);
        return false;
      }
      
      pass('Pair structure is valid');
      
      // Show which optional fields are present
      const presentOptional = optionalFields.filter(field => field in pair && pair[field] !== null);
      if (presentOptional.length > 0) {
        pass(`Optional fields present: ${presentOptional.join(', ')}`);
      }
      
      pass(`Sample: ${pair.name} (${pair.status})`);
    } else {
      warn('No pairs in database to validate structure');
    }
    
    return true;
  } catch (error) {
    fail(`Response validation failed: ${error.message}`);
    return false;
  }
}

// Test 3: Pagination
async function testPagination() {
  info('Test 3: Pagination functionality');
  try {
    // Test page 0 with size 5
    const response1 = await fetch(`${API_BASE_URL}/swap/pairs?page=0&size=5`);
    const data1 = await response1.json();
    
    pass(`Page 0: ${data1.pairs.length} pairs (requested size: 5)`);
    pass(`Total elements: ${data1.pagination.total_elements}`);
    pass(`Total pages: ${data1.pagination.total_pages}`);
    pass(`Has next: ${data1.pagination.has_next}, Has prev: ${data1.pagination.has_prev}`);
    
    // Test page 1 if available
    if (data1.pagination.has_next) {
      const response2 = await fetch(`${API_BASE_URL}/swap/pairs?page=1&size=5`);
      const data2 = await response2.json();
      pass(`Page 1: ${data2.pairs.length} pairs`);
      
      // Verify pages are different
      if (data1.pairs.length > 0 && data2.pairs.length > 0) {
        const sameFirst = data1.pairs[0].name === data2.pairs[0].name;
        if (sameFirst) {
          fail('Page 1 has same first pair as page 0');
          return false;
        }
        pass('Pages contain different pairs');
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

// Test 4: Filter by base currency
async function testFilterBaseCurrency() {
  info('Test 4: Filter by base_currency');
  try {
    // First get all pairs to find a base currency
    const allResponse = await fetch(`${API_BASE_URL}/swap/pairs`);
    const allData = await allResponse.json();
    
    if (allData.pairs.length === 0) {
      warn('No pairs available to test filtering');
      return true;
    }
    
    const baseCurrency = allData.pairs[0].base_currency;
    
    // Filter by that base currency
    const filterResponse = await fetch(`${API_BASE_URL}/swap/pairs?base_currency=${baseCurrency}`);
    const filterData = await filterResponse.json();
    
    pass(`Filtering by base_currency=${baseCurrency}`);
    pass(`Found ${filterData.pairs.length} pairs`);
    
    // Verify all results match the filter
    const mismatch = filterData.pairs.filter(p => p.base_currency !== baseCurrency);
    if (mismatch.length > 0) {
      fail(`Found ${mismatch.length} pairs that don't match filter`);
      return false;
    }
    
    pass('All filtered pairs match base_currency');
    
    return true;
  } catch (error) {
    fail(`Filter test failed: ${error.message}`);
    return false;
  }
}

// Test 5: Filter by status
async function testFilterStatus() {
  info('Test 5: Filter by status');
  try {
    // Test filtering by status=active
    const activeResponse = await fetch(`${API_BASE_URL}/swap/pairs?status=active`);
    const activeData = await activeResponse.json();
    
    pass(`Status=active: ${activeData.pairs.length} pairs`);
    
    // Verify all are active
    const notActive = activeData.pairs.filter(p => p.status !== 'active');
    if (notActive.length > 0) {
      fail(`Found ${notActive.length} non-active pairs in active filter`);
      return false;
    }
    
    if (activeData.pairs.length > 0) {
      pass('All filtered pairs have status=active');
    }
    
    // Test status=all
    const allResponse = await fetch(`${API_BASE_URL}/swap/pairs?status=all`);
    const allData = await allResponse.json();
    
    pass(`Status=all: ${allData.pairs.length} pairs`);
    
    return true;
  } catch (error) {
    fail(`Status filter test failed: ${error.message}`);
    return false;
  }
}

// Test 6: Filter by quote currency
async function testFilterQuoteCurrency() {
  info('Test 6: Filter by quote_currency');
  try {
    const allResponse = await fetch(`${API_BASE_URL}/swap/pairs`);
    const allData = await allResponse.json();
    
    if (allData.pairs.length === 0) {
      warn('No pairs available to test quote currency filtering');
      return true;
    }
    
    const quoteCurrency = allData.pairs[0].quote_currency;
    
    const filterResponse = await fetch(`${API_BASE_URL}/swap/pairs?quote_currency=${quoteCurrency}`);
    const filterData = await filterResponse.json();
    
    pass(`Filtering by quote_currency=${quoteCurrency}`);
    pass(`Found ${filterData.pairs.length} pairs`);
    
    // Verify all results match
    const mismatch = filterData.pairs.filter(p => p.quote_currency !== quoteCurrency);
    if (mismatch.length > 0) {
      fail(`Found ${mismatch.length} pairs that don't match filter`);
      return false;
    }
    
    pass('All filtered pairs match quote_currency');
    
    return true;
  } catch (error) {
    fail(`Quote currency filter test failed: ${error.message}`);
    return false;
  }
}

// Test 7: Network filtering
async function testNetworkFiltering() {
  info('Test 7: Network filtering');
  try {
    const allResponse = await fetch(`${API_BASE_URL}/swap/pairs`);
    const allData = await allResponse.json();
    
    if (allData.pairs.length === 0) {
      warn('No pairs available to test network filtering');
      return true;
    }
    
    const baseNetwork = allData.pairs[0].base_network;
    
    const filterResponse = await fetch(`${API_BASE_URL}/swap/pairs?base_network=${baseNetwork}`);
    const filterData = await filterResponse.json();
    
    pass(`Filtering by base_network=${baseNetwork}`);
    pass(`Found ${filterData.pairs.length} pairs`);
    
    // Verify all results match
    const mismatch = filterData.pairs.filter(p => p.base_network !== baseNetwork);
    if (mismatch.length > 0) {
      fail(`Found ${mismatch.length} pairs that don't match filter`);
      return false;
    }
    
    pass('All filtered pairs match base_network');
    
    return true;
  } catch (error) {
    fail(`Network filter test failed: ${error.message}`);
    return false;
  }
}

// Test 8: Amount validation
async function testAmountValidation() {
  info('Test 8: Amount fields validation');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/pairs`);
    const data = await response.json();
    
    if (data.pairs.length === 0) {
      warn('No pairs available to test amounts');
      return true;
    }
    
    const pairsWithAmounts = data.pairs.filter(p => p.min_amount !== null || p.max_amount !== null);
    
    if (pairsWithAmounts.length === 0) {
      warn('No pairs have min/max amounts set');
      return true;
    }
    
    pass(`${pairsWithAmounts.length} pairs have amount limits`);
    
    // Validate min <= max when both present
    const invalidRanges = pairsWithAmounts.filter(p => 
      p.min_amount !== null && 
      p.max_amount !== null && 
      p.min_amount > p.max_amount
    );
    
    if (invalidRanges.length > 0) {
      fail(`Found ${invalidRanges.length} pairs where min_amount > max_amount`);
      return false;
    }
    
    pass('All amount ranges are valid (min <= max)');
    
    // Show sample
    const sample = pairsWithAmounts[0];
    if (sample.min_amount !== null && sample.max_amount !== null) {
      pass(`Sample: ${sample.name} (${sample.min_amount} - ${sample.max_amount})`);
    }
    
    return true;
  } catch (error) {
    fail(`Amount validation failed: ${error.message}`);
    return false;
  }
}

// Test 9: Date format validation
async function testDateFormat() {
  info('Test 9: Date format validation');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/pairs`);
    
    if (!response.ok) {
      fail(`Backend returned status ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (data.pairs.length === 0) {
      warn('No pairs available to test date format');
      return true;
    }
    
    // Check if last_updated is valid ISO 8601
    const invalidDates = data.pairs.filter(p => {
      try {
        const date = new Date(p.last_updated);
        return isNaN(date.getTime());
      } catch {
        return true;
      }
    });
    
    if (invalidDates.length > 0) {
      fail(`Found ${invalidDates.length} pairs with invalid date format`);
      return false;
    }
    
    pass('All last_updated dates are valid ISO 8601 format');
    
    // Show sample
    const sample = data.pairs[0];
    pass(`Sample: ${sample.name} updated at ${sample.last_updated}`);
    
    return true;
  } catch (error) {
    fail(`Date format test failed: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  PAIRS ENDPOINT INTEGRATION TEST');
  console.log('='.repeat(60) + '\n');
  
  const tests = [
    testBackendConnectivity,
    testResponseStructure,
    testPagination,
    testFilterBaseCurrency,
    testFilterStatus,
    testFilterQuoteCurrency,
    testNetworkFiltering,
    testAmountValidation,
    testDateFormat,
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
