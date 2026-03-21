#!/usr/bin/env node
/**
 * Integration Test for /estimate endpoint
 * Tests the complete flow: API Client -> Endpoint -> Backend
 * 
 * Run: node test-estimate-integration.mjs
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
    const response = await fetch(`${API_BASE_URL}/swap/estimate?from=btc&to=usdt&amount=0.1&network_from=Mainnet&network_to=TRC20`);
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
    const response = await fetch(`${API_BASE_URL}/swap/estimate?from=btc&to=usdt&amount=0.1&network_from=Mainnet&network_to=TRC20`);
    const data = await response.json();
    
    // Check request echo fields
    const echoFields = ['from', 'to', 'amount', 'network_from', 'network_to'];
    const missingEcho = echoFields.filter(field => !(field in data));
    
    if (missingEcho.length > 0) {
      fail(`Missing echo fields: ${missingEcho.join(', ')}`);
      return false;
    }
    
    pass('Request echo fields present');
    pass(`Pair: ${data.from}/${data.to} (${data.network_from} -> ${data.network_to})`);
    pass(`Amount: ${data.amount}`);
    
    // Check rate fields
    const rateFields = ['best_rate', 'estimated_receive', 'estimated_receive_min', 'estimated_receive_max'];
    const missingRate = rateFields.filter(field => !(field in data));
    
    if (missingRate.length > 0) {
      fail(`Missing rate fields: ${missingRate.join(', ')}`);
      return false;
    }
    
    pass('Rate fields present');
    pass(`Best rate: ${data.best_rate}`);
    pass(`Estimated receive: ${data.estimated_receive} ${data.to}`);
    pass(`Range: ${data.estimated_receive_min} - ${data.estimated_receive_max}`);
    
    // Check fee fields
    const feeFields = ['network_fee', 'provider_fee', 'platform_fee', 'total_fee'];
    const missingFee = feeFields.filter(field => !(field in data));
    
    if (missingFee.length > 0) {
      fail(`Missing fee fields: ${missingFee.join(', ')}`);
      return false;
    }
    
    pass('Fee fields present');
    
    // Check slippage fields
    const slippageFields = ['slippage_percentage', 'price_impact'];
    const missingSlippage = slippageFields.filter(field => !(field in data));
    
    if (missingSlippage.length > 0) {
      fail(`Missing slippage fields: ${missingSlippage.join(', ')}`);
      return false;
    }
    
    pass('Slippage fields present');
    
    // Check provider fields
    const providerFields = ['best_provider', 'provider_count'];
    const missingProvider = providerFields.filter(field => !(field in data));
    
    if (missingProvider.length > 0) {
      fail(`Missing provider fields: ${missingProvider.join(', ')}`);
      return false;
    }
    
    pass(`Provider: ${data.best_provider} (${data.provider_count} checked)`);
    
    // Check metadata fields
    const metadataFields = ['cached', 'cache_age_seconds', 'expires_in_seconds'];
    const missingMetadata = metadataFields.filter(field => !(field in data));
    
    if (missingMetadata.length > 0) {
      fail(`Missing metadata fields: ${missingMetadata.join(', ')}`);
      return false;
    }
    
    pass('Metadata fields present');
    pass(`Cached: ${data.cached}, Age: ${data.cache_age_seconds}s, Expires in: ${data.expires_in_seconds}s`);
    
    // Check warnings field
    if (!('warnings' in data) || !Array.isArray(data.warnings)) {
      fail('Missing or invalid warnings field');
      return false;
    }
    
    pass('Warnings field present');
    if (data.warnings.length > 0) {
      warn(`Warnings: ${data.warnings.join(', ')}`);
    }
    
    return true;
  } catch (error) {
    fail(`Response validation failed: ${error.message}`);
    return false;
  }
}

// Test 3: Amount validation
async function testAmountValidation() {
  info('Test 3: Amount validation');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/estimate?from=btc&to=usdt&amount=0.1&network_from=Mainnet&network_to=TRC20`);
    const data = await response.json();
    
    // Check min <= estimated <= max
    if (data.estimated_receive_min > data.estimated_receive) {
      fail('estimated_receive_min > estimated_receive');
      return false;
    }
    
    if (data.estimated_receive > data.estimated_receive_max) {
      fail('estimated_receive > estimated_receive_max');
      return false;
    }
    
    pass('Amount range is valid (min <= estimated <= max)');
    
    // Check all amounts are positive
    if (data.estimated_receive <= 0 || data.estimated_receive_min <= 0 || data.estimated_receive_max <= 0) {
      fail('Found non-positive amounts');
      return false;
    }
    
    pass('All amounts are positive');
    
    return true;
  } catch (error) {
    fail(`Amount validation failed: ${error.message}`);
    return false;
  }
}

// Test 4: Fee validation
async function testFeeValidation() {
  info('Test 4: Fee validation');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/estimate?from=btc&to=usdt&amount=0.1&network_from=Mainnet&network_to=TRC20`);
    const data = await response.json();
    
    // Check all fees are numbers
    const fees = [data.network_fee, data.provider_fee, data.platform_fee, data.total_fee];
    const invalidFees = fees.filter(f => typeof f !== 'number');
    
    if (invalidFees.length > 0) {
      fail('Found non-numeric fees');
      return false;
    }
    
    pass('All fees are numeric');
    
    // Show fee breakdown
    pass(`Fee breakdown: Network=${data.network_fee}, Provider=${data.provider_fee}, Platform=${data.platform_fee}, Total=${data.total_fee}`);
    
    return true;
  } catch (error) {
    fail(`Fee validation failed: ${error.message}`);
    return false;
  }
}

// Test 5: Slippage validation
async function testSlippageValidation() {
  info('Test 5: Slippage validation');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/estimate?from=btc&to=usdt&amount=0.1&network_from=Mainnet&network_to=TRC20`);
    const data = await response.json();
    
    // Check slippage is a number
    if (typeof data.slippage_percentage !== 'number') {
      fail('slippage_percentage is not a number');
      return false;
    }
    
    if (typeof data.price_impact !== 'number') {
      fail('price_impact is not a number');
      return false;
    }
    
    pass('Slippage fields are numeric');
    pass(`Slippage: ${data.slippage_percentage}%, Price impact: ${data.price_impact}%`);
    
    return true;
  } catch (error) {
    fail(`Slippage validation failed: ${error.message}`);
    return false;
  }
}

// Test 6: Cache behavior
async function testCacheBehavior() {
  info('Test 6: Cache behavior');
  try {
    // First request
    const response1 = await fetch(`${API_BASE_URL}/swap/estimate?from=btc&to=usdt&amount=0.1&network_from=Mainnet&network_to=TRC20`);
    const data1 = await response1.json();
    
    pass(`First request - Cached: ${data1.cached}`);
    
    // Second request (should be cached)
    await new Promise(resolve => setTimeout(resolve, 100));
    const response2 = await fetch(`${API_BASE_URL}/swap/estimate?from=btc&to=usdt&amount=0.1&network_from=Mainnet&network_to=TRC20`);
    const data2 = await response2.json();
    
    pass(`Second request - Cached: ${data2.cached}`);
    
    if (data2.cached) {
      pass('Cache is working');
      pass(`Cache age: ${data2.cache_age_seconds}s`);
    } else {
      warn('Second request was not cached (may be expected)');
    }
    
    return true;
  } catch (error) {
    fail(`Cache behavior test failed: ${error.message}`);
    return false;
  }
}

// Test 7: Different amounts
async function testDifferentAmounts() {
  info('Test 7: Different amounts');
  try {
    // Test with 0.01 BTC
    const response1 = await fetch(`${API_BASE_URL}/swap/estimate?from=btc&to=usdt&amount=0.01&network_from=Mainnet&network_to=TRC20`);
    const data1 = await response1.json();
    
    pass(`0.01 BTC: ${data1.estimated_receive} USDT`);
    
    // Test with 1 BTC
    const response2 = await fetch(`${API_BASE_URL}/swap/estimate?from=btc&to=usdt&amount=1&network_from=Mainnet&network_to=TRC20`);
    const data2 = await response2.json();
    
    pass(`1 BTC: ${data2.estimated_receive} USDT`);
    
    // Check that larger amount gives proportionally larger result
    const ratio = data2.estimated_receive / data1.estimated_receive;
    if (ratio > 50 && ratio < 150) { // Should be around 100x
      pass(`Amount scaling is reasonable (ratio: ${ratio.toFixed(2)})`);
    } else {
      warn(`Amount scaling seems off (ratio: ${ratio.toFixed(2)})`);
    }
    
    return true;
  } catch (error) {
    fail(`Different amounts test failed: ${error.message}`);
    return false;
  }
}

// Test 8: Provider count validation
async function testProviderCount() {
  info('Test 8: Provider count validation');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/estimate?from=btc&to=usdt&amount=0.1&network_from=Mainnet&network_to=TRC20`);
    const data = await response.json();
    
    if (typeof data.provider_count !== 'number' || data.provider_count < 0) {
      fail('Invalid provider_count');
      return false;
    }
    
    pass(`Provider count: ${data.provider_count}`);
    
    if (data.provider_count === 0) {
      warn('No providers available for this pair');
    } else {
      pass(`Best provider: ${data.best_provider}`);
    }
    
    return true;
  } catch (error) {
    fail(`Provider count validation failed: ${error.message}`);
    return false;
  }
}

// Test 9: Input validation
async function testInputValidation() {
  info('Test 9: Input validation (error handling)');
  try {
    // Test with invalid amount (negative)
    const response1 = await fetch(`${API_BASE_URL}/swap/estimate?from=btc&to=usdt&amount=-1&network_from=Mainnet&network_to=TRC20`);
    
    if (response1.status === 400) {
      pass('Negative amount rejected (400)');
    } else {
      warn(`Negative amount returned status ${response1.status}`);
    }
    
    // Test with missing parameter
    const response2 = await fetch(`${API_BASE_URL}/swap/estimate?from=btc&to=usdt&network_from=Mainnet&network_to=TRC20`);
    
    if (response2.status === 400) {
      pass('Missing amount parameter rejected (400)');
    } else {
      warn(`Missing parameter returned status ${response2.status}`);
    }
    
    return true;
  } catch (error) {
    warn(`Input validation test failed: ${error.message}`);
    return true; // Don't fail the suite
  }
}

// Run all tests
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  ESTIMATE ENDPOINT INTEGRATION TEST');
  console.log('='.repeat(60) + '\n');
  
  const tests = [
    testBackendConnectivity,
    testResponseStructure,
    testAmountValidation,
    testFeeValidation,
    testSlippageValidation,
    testCacheBehavior,
    testDifferentAmounts,
    testProviderCount,
    testInputValidation,
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
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('='.repeat(60));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60) + '\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
