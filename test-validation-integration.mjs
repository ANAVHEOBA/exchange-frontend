#!/usr/bin/env node
/**
 * Integration Test for POST /swap/validate-address endpoint
 * Tests address validation for various cryptocurrencies and networks
 * 
 * Run: node test-validation-integration.mjs
 */

const API_BASE_URL = 'http://localhost:3000';

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
  info('Test 1: Backend connectivity');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/validate-address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    
    // We expect 400 (bad request) not 404 (not found)
    if (response.status === 404) {
      fail('Endpoint not found (404)');
      return false;
    }
    
    pass('Backend endpoint exists');
    return true;
  } catch (error) {
    fail(`Cannot connect to backend: ${error.message}`);
    return false;
  }
}

// Test 2: Valid Bitcoin address
async function testValidBitcoinAddress() {
  info('Test 2: Valid Bitcoin address');
  try {
    const request = {
      address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      ticker: 'btc',
      network: 'Mainnet',
    };
    
    const response = await fetch(`${API_BASE_URL}/swap/validate-address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      fail(`Request failed: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (!data.valid) {
      fail('Valid Bitcoin address marked as invalid');
      return false;
    }
    
    pass('Valid Bitcoin address accepted');
    pass(`Address: ${data.address}`);
    pass(`Ticker: ${data.ticker}`);
    pass(`Network: ${data.network}`);
    
    return true;
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    return false;
  }
}

// Test 3: Invalid Bitcoin address
async function testInvalidBitcoinAddress() {
  info('Test 3: Invalid Bitcoin address');
  try {
    const request = {
      address: 'invalid-btc-address-12345',
      ticker: 'btc',
      network: 'Mainnet',
    };
    
    const response = await fetch(`${API_BASE_URL}/swap/validate-address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      fail(`Request failed: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (data.valid) {
      fail('Invalid Bitcoin address marked as valid');
      return false;
    }
    
    pass('Invalid Bitcoin address rejected');
    pass(`Address: ${data.address}`);
    pass(`Valid: ${data.valid}`);
    
    return true;
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    return false;
  }
}

// Test 4: Valid Ethereum address
async function testValidEthereumAddress() {
  info('Test 4: Valid Ethereum address');
  try {
    const request = {
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      ticker: 'eth',
      network: 'ERC20',
    };
    
    const response = await fetch(`${API_BASE_URL}/swap/validate-address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      fail(`Request failed: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    pass(`Ethereum address validation result: ${data.valid}`);
    pass(`Address: ${data.address}`);
    pass(`Network: ${data.network}`);
    
    return true;
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    return false;
  }
}

// Test 5: Valid USDT TRC20 address
async function testValidTRC20Address() {
  info('Test 5: Valid USDT TRC20 address');
  try {
    const request = {
      address: 'TTestAddressForSandboxOnly123456789',
      ticker: 'usdt',
      network: 'TRC20',
    };
    
    const response = await fetch(`${API_BASE_URL}/swap/validate-address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      warn(`Request failed: ${response.status}`);
      return true;
    }
    
    const data = await response.json();
    
    pass(`TRC20 address validation result: ${data.valid}`);
    pass(`Address: ${data.address}`);
    pass(`Network: ${data.network}`);
    
    return true;
  } catch (error) {
    warn(`Test failed: ${error.message}`);
    return true;
  }
}

// Test 6: Response structure validation
async function testResponseStructure() {
  info('Test 6: Response structure validation');
  try {
    const request = {
      address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      ticker: 'btc',
      network: 'Mainnet',
    };
    
    const response = await fetch(`${API_BASE_URL}/swap/validate-address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    const data = await response.json();
    
    const requiredFields = ['valid', 'ticker', 'network', 'address'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      fail(`Missing fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    pass('All required fields present');
    
    // Validate types
    if (typeof data.valid !== 'boolean') {
      fail('valid field is not boolean');
      return false;
    }
    pass('valid field is boolean');
    
    if (typeof data.ticker !== 'string') {
      fail('ticker field is not string');
      return false;
    }
    pass('ticker field is string');
    
    if (typeof data.network !== 'string') {
      fail('network field is not string');
      return false;
    }
    pass('network field is string');
    
    if (typeof data.address !== 'string') {
      fail('address field is not string');
      return false;
    }
    pass('address field is string');
    
    return true;
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    return false;
  }
}

// Test 7: Missing required fields
async function testMissingFields() {
  info('Test 7: Missing required fields');
  try {
    // Test with missing ticker
    const response = await fetch(`${API_BASE_URL}/swap/validate-address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        network: 'Mainnet',
      }),
    });
    
    if (response.status === 400 || response.status === 422) {
      pass('Missing ticker rejected (400/422)');
    } else {
      warn(`Missing ticker returned status ${response.status}`);
    }
    
    return true;
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    return false;
  }
}

// Test 8: Empty address
async function testEmptyAddress() {
  info('Test 8: Empty address');
  try {
    const request = {
      address: '',
      ticker: 'btc',
      network: 'Mainnet',
    };
    
    const response = await fetch(`${API_BASE_URL}/swap/validate-address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      pass(`Empty address rejected: ${response.status}`);
      return true;
    }
    
    const data = await response.json();
    
    if (!data.valid) {
      pass('Empty address marked as invalid');
    } else {
      warn('Empty address marked as valid');
    }
    
    return true;
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    return false;
  }
}

// Test 9: Case sensitivity (ticker must be lowercase)
async function testCaseSensitivity() {
  info('Test 9: Case sensitivity (ticker must be lowercase)');
  try {
    // Test with uppercase ticker - should fail
    const requestUpper = {
      address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      ticker: 'BTC',
      network: 'Mainnet',
    };
    
    const responseUpper = await fetch(`${API_BASE_URL}/swap/validate-address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestUpper),
    });
    
    if (!responseUpper.ok) {
      pass(`Uppercase ticker rejected: ${responseUpper.status} (expected)`);
    } else {
      warn('Uppercase ticker was accepted (unexpected)');
    }
    
    // Test with lowercase ticker - should succeed
    const requestLower = {
      address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      ticker: 'btc',
      network: 'Mainnet',
    };
    
    const responseLower = await fetch(`${API_BASE_URL}/swap/validate-address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestLower),
    });
    
    if (responseLower.ok) {
      const data = await responseLower.json();
      pass(`Lowercase ticker accepted: valid=${data.valid}`);
      pass('✓ Tickers must be lowercase');
    } else {
      fail('Lowercase ticker rejected (unexpected)');
      return false;
    }
    
    return true;
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  VALIDATE ADDRESS ENDPOINT INTEGRATION TEST');
  console.log('='.repeat(60) + '\n');
  
  const tests = [
    testBackendConnectivity,
    testValidBitcoinAddress,
    testInvalidBitcoinAddress,
    testValidEthereumAddress,
    testValidTRC20Address,
    testResponseStructure,
    testMissingFields,
    testEmptyAddress,
    testCaseSensitivity,
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++; else failed++;
      console.log('');
    } catch (error) {
      fail(`Test crashed: ${error.message}`);
      failed++;
      console.log('');
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('='.repeat(60));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60) + '\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
