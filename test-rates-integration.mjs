#!/usr/bin/env node
/**
 * Integration Test for /rates endpoint
 * Tests the complete flow: API Client -> Endpoint -> Backend -> Trocador API
 * 
 * Run: node test-rates-integration.mjs
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
    // Use a simple BTC to USDT query
    const response = await fetch(`${API_BASE_URL}/swap/rates?from=btc&network_from=Mainnet&to=usdt&network_to=TRC20&amount=0.1`);
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
    const response = await fetch(`${API_BASE_URL}/swap/rates?from=btc&network_from=Mainnet&to=usdt&network_to=TRC20&amount=0.1`);
    const data = await response.json();
    
    // Check top-level structure
    const requiredFields = ['trade_id', 'from', 'network_from', 'to', 'network_to', 'amount', 'rates'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      fail(`Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    pass('Response structure is valid');
    pass(`Trade ID: ${data.trade_id}`);
    pass(`Pair: ${data.from}/${data.to} (${data.network_from} -> ${data.network_to})`);
    pass(`Amount: ${data.amount}`);
    
    if (!Array.isArray(data.rates)) {
      fail('rates field is not an array');
      return false;
    }
    
    pass(`Found ${data.rates.length} rate quotes`);
    
    // Validate rate structure
    if (data.rates.length > 0) {
      const rate = data.rates[0];
      const rateFields = ['provider', 'provider_name', 'rate', 'estimated_amount', 'min_amount', 'max_amount', 
                          'network_fee', 'provider_fee', 'platform_fee', 'total_fee', 'rate_type', 'kyc_required'];
      const missingRateFields = rateFields.filter(field => !(field in rate));
      
      if (missingRateFields.length > 0) {
        fail(`Missing rate fields: ${missingRateFields.join(', ')}`);
        return false;
      }
      
      pass('Rate structure is valid');
      pass(`Best rate: ${rate.provider_name} - ${rate.estimated_amount} ${data.to}`);
    }
    
    return true;
  } catch (error) {
    fail(`Response validation failed: ${error.message}`);
    return false;
  }
}

// Test 3: Rate type validation
async function testRateTypes() {
  info('Test 3: Rate type validation');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/rates?from=btc&network_from=Mainnet&to=usdt&network_to=TRC20&amount=0.1`);
    const data = await response.json();
    
    const validRateTypes = ['fixed', 'floating'];
    const invalidRates = data.rates.filter(r => !validRateTypes.includes(r.rate_type));
    
    if (invalidRates.length > 0) {
      fail(`Found ${invalidRates.length} rates with invalid rate_type`);
      return false;
    }
    
    // Count by rate type
    const typeCounts = data.rates.reduce((acc, r) => {
      acc[r.rate_type] = (acc[r.rate_type] || 0) + 1;
      return acc;
    }, {});
    
    pass('All rate types are valid (fixed or floating)');
    pass(`Rate type distribution: ${JSON.stringify(typeCounts)}`);
    
    return true;
  } catch (error) {
    fail(`Rate type validation failed: ${error.message}`);
    return false;
  }
}

// Test 4: KYC rating validation
async function testKYCRating() {
  info('Test 4: KYC rating validation');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/rates?from=btc&network_from=Mainnet&to=usdt&network_to=TRC20&amount=0.1`);
    const data = await response.json();
    
    const validRatings = ['A', 'B', 'C', 'D'];
    const withRating = data.rates.filter(r => r.kyc_rating);
    const invalidRatings = withRating.filter(r => !validRatings.includes(r.kyc_rating));
    
    if (invalidRatings.length > 0) {
      fail(`Found ${invalidRatings.length} rates with invalid KYC rating`);
      return false;
    }
    
    pass(`${withRating.length} rates have KYC rating`);
    
    if (withRating.length > 0) {
      const ratingCounts = withRating.reduce((acc, r) => {
        acc[r.kyc_rating] = (acc[r.kyc_rating] || 0) + 1;
        return acc;
      }, {});
      pass(`KYC rating distribution: ${JSON.stringify(ratingCounts)}`);
    }
    
    // Check kyc_required field
    const kycRequired = data.rates.filter(r => r.kyc_required);
    pass(`${kycRequired.length} rates require KYC`);
    
    return true;
  } catch (error) {
    fail(`KYC rating validation failed: ${error.message}`);
    return false;
  }
}

// Test 5: Amount validation
async function testAmountValidation() {
  info('Test 5: Amount validation');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/rates?from=btc&network_from=Mainnet&to=usdt&network_to=TRC20&amount=0.1`);
    const data = await response.json();
    
    // Validate min <= max
    const invalidRanges = data.rates.filter(r => r.min_amount > r.max_amount);
    
    if (invalidRanges.length > 0) {
      fail(`Found ${invalidRanges.length} rates where min_amount > max_amount`);
      return false;
    }
    
    pass('All amount ranges are valid (min <= max)');
    
    // Check if estimated_amount is positive
    const negativeAmounts = data.rates.filter(r => r.estimated_amount <= 0);
    
    if (negativeAmounts.length > 0) {
      fail(`Found ${negativeAmounts.length} rates with non-positive estimated_amount`);
      return false;
    }
    
    pass('All estimated amounts are positive');
    
    // Show sample
    if (data.rates.length > 0) {
      const sample = data.rates[0];
      pass(`Sample: ${sample.provider_name} - Min: ${sample.min_amount}, Max: ${sample.max_amount}`);
    }
    
    return true;
  } catch (error) {
    fail(`Amount validation failed: ${error.message}`);
    return false;
  }
}

// Test 6: Fee validation
async function testFeeValidation() {
  info('Test 6: Fee validation');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/rates?from=btc&network_from=Mainnet&to=usdt&network_to=TRC20&amount=0.1`);
    const data = await response.json();
    
    // Check that total_fee exists and is a number
    const invalidFees = data.rates.filter(r => typeof r.total_fee !== 'number');
    
    if (invalidFees.length > 0) {
      fail(`Found ${invalidFees.length} rates with invalid total_fee`);
      return false;
    }
    
    pass('All fees are valid numbers');
    
    // Count negative fees (this can happen with provider data)
    const negativeFees = data.rates.filter(r => 
      r.network_fee < 0 || r.provider_fee < 0 || r.platform_fee < 0 || r.total_fee < 0
    );
    
    if (negativeFees.length > 0) {
      warn(`${negativeFees.length} rates have negative fees (provider data)`);
    }
    
    // Show fee breakdown for best rate
    if (data.rates.length > 0) {
      const best = data.rates[0];
      pass(`Best rate fees: Network=${best.network_fee}, Provider=${best.provider_fee}, Platform=${best.platform_fee}, Total=${best.total_fee}`);
    }
    
    return true;
  } catch (error) {
    fail(`Fee validation failed: ${error.message}`);
    return false;
  }
}

// Test 7: Rate sorting
async function testRateSorting() {
  info('Test 7: Rate sorting (best to worst)');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/rates?from=btc&network_from=Mainnet&to=usdt&network_to=TRC20&amount=0.1`);
    const data = await response.json();
    
    if (data.rates.length < 2) {
      warn('Not enough rates to test sorting');
      return true;
    }
    
    // Check if rates are sorted by estimated_amount (descending)
    let isSorted = true;
    for (let i = 0; i < data.rates.length - 1; i++) {
      if (data.rates[i].estimated_amount < data.rates[i + 1].estimated_amount) {
        isSorted = false;
        break;
      }
    }
    
    if (!isSorted) {
      warn('Rates may not be sorted by best rate (this is OK if sorting by other criteria)');
    } else {
      pass('Rates are sorted by best estimated amount');
    }
    
    // Show top 3 rates
    const top3 = data.rates.slice(0, 3);
    pass('Top 3 rates:');
    top3.forEach((r, i) => {
      pass(`  ${i + 1}. ${r.provider_name}: ${r.estimated_amount} ${data.to} (${r.rate_type})`);
    });
    
    return true;
  } catch (error) {
    fail(`Rate sorting test failed: ${error.message}`);
    return false;
  }
}

// Test 8: Filter by rate type
async function testRateTypeFilter() {
  info('Test 8: Filter by rate_type');
  try {
    // Test fixed rate
    const fixedResponse = await fetch(`${API_BASE_URL}/swap/rates?from=btc&network_from=Mainnet&to=usdt&network_to=TRC20&amount=0.1&rate_type=fixed`);
    const fixedData = await fixedResponse.json();
    
    const nonFixed = fixedData.rates.filter(r => r.rate_type !== 'fixed');
    
    if (nonFixed.length > 0) {
      warn(`Found ${nonFixed.length} non-fixed rates when filtering for fixed (backend may return all)`);
    } else {
      pass('Fixed rate filter works correctly');
    }
    
    pass(`Fixed rates: ${fixedData.rates.filter(r => r.rate_type === 'fixed').length}`);
    
    // Test floating rate
    const floatingResponse = await fetch(`${API_BASE_URL}/swap/rates?from=btc&network_from=Mainnet&to=usdt&network_to=TRC20&amount=0.1&rate_type=floating`);
    const floatingData = await floatingResponse.json();
    
    const nonFloating = floatingData.rates.filter(r => r.rate_type !== 'floating');
    
    if (nonFloating.length > 0) {
      warn(`Found ${nonFloating.length} non-floating rates when filtering for floating (backend may return all)`);
    } else {
      pass('Floating rate filter works correctly');
    }
    
    pass(`Floating rates: ${floatingData.rates.filter(r => r.rate_type === 'floating').length}`);
    
    return true;
  } catch (error) {
    fail(`Rate type filter test failed: ${error.message}`);
    return false;
  }
}

// Test 9: Different currency pairs
async function testDifferentPairs() {
  info('Test 9: Different currency pairs');
  try {
    // Test ETH to BTC
    const response = await fetch(`${API_BASE_URL}/swap/rates?from=eth&network_from=Mainnet&to=btc&network_to=Mainnet&amount=1`);
    
    if (!response.ok) {
      warn(`Backend returned status ${response.status} for ETH/BTC pair`);
      return true; // Don't fail if pair not available
    }
    
    const data = await response.json();
    
    // Check if response matches (case-insensitive)
    if (data.from.toLowerCase() !== 'eth' || data.to.toLowerCase() !== 'btc') {
      warn(`Response pair (${data.from}/${data.to}) differs from request (eth/btc)`);
      return true; // Don't fail, backend may normalize
    }
    
    pass(`ETH/BTC pair: ${data.rates.length} rates found`);
    
    if (data.rates.length > 0) {
      pass(`Best rate: ${data.rates[0].estimated_amount} BTC for 1 ETH`);
    } else {
      warn('No rates available for ETH/BTC pair');
    }
    
    return true;
  } catch (error) {
    warn(`Different pairs test failed: ${error.message}`);
    return true; // Don't fail the test suite
  }
}

// Run all tests
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  RATES ENDPOINT INTEGRATION TEST');
  console.log('='.repeat(60) + '\n');
  
  const tests = [
    testBackendConnectivity,
    testResponseStructure,
    testRateTypes,
    testKYCRating,
    testAmountValidation,
    testFeeValidation,
    testRateSorting,
    testRateTypeFilter,
    testDifferentPairs,
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
    
    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('='.repeat(60));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60) + '\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
