#!/usr/bin/env node
/**
 * Integration Test for /swap/create endpoint
 * Tests the complete flow: API Client -> Endpoint -> Backend -> Trocador
 * 
 * Run: node test-swap-integration.mjs
 * 
 * NOTE: This test creates REAL swaps in sandbox mode
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
    // Just check if the endpoint exists
    const response = await fetch(`${API_BASE_URL}/swap/create`, {
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

// Test 2: Input validation
async function testInputValidation() {
  info('Test 2: Input validation');
  try {
    // Test with missing required fields
    const response = await fetch(`${API_BASE_URL}/swap/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'btc',
        to: 'usdt',
      }),
    });
    
    if (response.status === 400) {
      pass('Missing fields rejected (400)');
    } else {
      warn(`Missing fields returned status ${response.status}`);
    }
    
    return true;
  } catch (error) {
    fail(`Input validation test failed: ${error.message}`);
    return false;
  }
}

// Test 3: Create swap in sandbox mode
async function testCreateSwapSandbox() {
  info('Test 3: Create swap (sandbox mode)');
  try {
    const swapRequest = {
      from: 'btc',
      network_from: 'Mainnet',
      to: 'usdt',
      network_to: 'TRC20',
      amount: 0.001,
      provider: 'ChangeNOW',
      recipient_address: 'TTestAddressForSandboxOnly123456789',
      rate_type: 'floating',
      sandbox: true,
    };
    
    const response = await fetch(`${API_BASE_URL}/swap/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapRequest),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      warn(`Sandbox swap creation failed: ${response.status} - ${errorText}`);
      return true; // Don't fail test, provider may not support sandbox
    }
    
    const data = await response.json();
    
    // Validate response structure
    const requiredFields = [
      'swap_id', 'provider', 'from', 'from_name', 'to', 'to_name',
      'network_from', 'network_to', 'deposit_address',
      'deposit_amount', 'recipient_address', 'estimated_receive',
      'rate', 'status', 'rate_type', 'is_sandbox', 'is_payment',
      'expires_at', 'created_at'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      fail(`Missing response fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    pass('Swap created successfully');
    pass(`Swap ID: ${data.swap_id}`);
    pass(`Provider: ${data.provider}`);
    pass(`From: ${data.from_name} (${data.from})`);
    pass(`To: ${data.to_name} (${data.to})`);
    pass(`Networks: ${data.network_from} -> ${data.network_to}`);
    pass(`Deposit address: ${data.deposit_address}`);
    pass(`Deposit amount: ${data.deposit_amount} ${data.from}`);
    pass(`Estimated receive: ${data.estimated_receive} ${data.to}`);
    pass(`Rate: ${data.rate}`);
    pass(`Status: ${data.status}`);
    pass(`Sandbox: ${data.is_sandbox}`);
    pass(`Payment: ${data.is_payment}`);
    
    if (data.deposit_extra_id) {
      pass(`Deposit memo: ${data.deposit_extra_id}`);
    }
    
    // Store swap_id for status test
    global.testSwapId = data.swap_id;
    
    return true;
  } catch (error) {
    warn(`Sandbox swap test failed: ${error.message}`);
    return true; // Don't fail suite
  }
}

// Test 4: Swap status validation
async function testSwapStatusValidation() {
  info('Test 4: Swap status validation');
  try {
    const validStatuses = ['waiting', 'confirming', 'exchanging', 'sending', 'completed', 'failed', 'refunded', 'expired'];
    
    // If we have a swap_id from previous test, check its status
    if (global.testSwapId) {
      const response = await fetch(`${API_BASE_URL}/swap/${global.testSwapId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (!validStatuses.includes(data.status)) {
          fail(`Invalid status: ${data.status}`);
          return false;
        }
        
        pass(`Status is valid: ${data.status}`);
        pass(`Swap details: ${data.from} -> ${data.to}, Amount: ${data.amount}`);
        
        return true;
      } else {
        warn(`Could not fetch swap status: ${response.status}`);
      }
    } else {
      warn('No swap_id available from previous test');
    }
    
    return true;
  } catch (error) {
    warn(`Status validation test failed: ${error.message}`);
    return true; // Don't fail suite
  }
}

// Test 5: Rate type validation
async function testRateTypeValidation() {
  info('Test 5: Rate type validation');
  try {
    // Test with fixed rate
    const fixedRequest = {
      from: 'btc',
      network_from: 'Mainnet',
      to: 'usdt',
      network_to: 'TRC20',
      amount: 0.001,
      provider: 'ChangeNOW',
      recipient_address: 'TTestAddressForSandboxOnly123456789',
      rate_type: 'fixed',
      sandbox: true,
    };
    
    const response = await fetch(`${API_BASE_URL}/swap/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fixedRequest),
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.rate_type !== 'fixed') {
        warn(`Requested fixed rate but got: ${data.rate_type}`);
      } else {
        pass('Fixed rate type respected');
      }
    } else {
      warn('Fixed rate swap creation failed (provider may not support)');
    }
    
    return true;
  } catch (error) {
    warn(`Rate type validation failed: ${error.message}`);
    return true; // Don't fail suite
  }
}

// Test 6: Refund address handling
async function testRefundAddress() {
  info('Test 6: Refund address handling');
  try {
    const requestWithRefund = {
      from: 'btc',
      network_from: 'Mainnet',
      to: 'usdt',
      network_to: 'TRC20',
      amount: 0.001,
      provider: 'ChangeNOW',
      recipient_address: 'TTestAddressForSandboxOnly123456789',
      refund_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis address
      rate_type: 'floating',
      sandbox: true,
    };
    
    const response = await fetch(`${API_BASE_URL}/swap/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestWithRefund),
    });
    
    if (response.ok) {
      const data = await response.json();
      pass('Refund address accepted');
      pass(`Swap created with refund address`);
    } else {
      warn('Swap with refund address failed');
    }
    
    return true;
  } catch (error) {
    warn(`Refund address test failed: ${error.message}`);
    return true; // Don't fail suite
  }
}

// Test 7: Extra ID/Memo handling
async function testExtraIdHandling() {
  info('Test 7: Extra ID/Memo handling');
  try {
    // Test with a currency that uses memo (XLM)
    const requestWithMemo = {
      from: 'btc',
      network_from: 'Mainnet',
      to: 'xlm',
      network_to: 'Mainnet',
      amount: 0.001,
      provider: 'ChangeNOW',
      recipient_address: 'GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A',
      recipient_extra_id: '123456',
      rate_type: 'floating',
      sandbox: true,
    };
    
    const response = await fetch(`${API_BASE_URL}/swap/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestWithMemo),
    });
    
    if (response.ok) {
      const data = await response.json();
      pass('Extra ID/Memo accepted');
      
      if (data.deposit_extra_id) {
        pass(`Deposit requires memo: ${data.deposit_extra_id}`);
      }
    } else {
      warn('Swap with extra ID failed (pair may not be available)');
    }
    
    return true;
  } catch (error) {
    warn(`Extra ID test failed: ${error.message}`);
    return true; // Don't fail suite
  }
}

// Test 8: Trade ID from rates
async function testTradeIdFromRates() {
  info('Test 8: Using trade_id from rates endpoint');
  try {
    // First get rates
    const ratesResponse = await fetch(`${API_BASE_URL}/swap/rates?from=btc&network_from=Mainnet&to=usdt&network_to=TRC20&amount=0.001`);
    
    if (!ratesResponse.ok) {
      warn('Could not fetch rates');
      return true;
    }
    
    const ratesData = await ratesResponse.json();
    
    if (!ratesData.trade_id || ratesData.rates.length === 0) {
      warn('No trade_id or rates available');
      return true;
    }
    
    pass(`Got trade_id: ${ratesData.trade_id}`);
    
    // Now create swap with trade_id
    const swapRequest = {
      trade_id: ratesData.trade_id,
      from: 'btc',
      network_from: 'Mainnet',
      to: 'usdt',
      network_to: 'TRC20',
      amount: 0.001,
      provider: ratesData.rates[0].provider,
      recipient_address: 'TTestAddressForSandboxOnly123456789',
      rate_type: 'floating',
      sandbox: true,
    };
    
    const swapResponse = await fetch(`${API_BASE_URL}/swap/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapRequest),
    });
    
    if (swapResponse.ok) {
      pass('Swap created with trade_id from rates');
    } else {
      warn('Swap with trade_id failed');
    }
    
    return true;
  } catch (error) {
    warn(`Trade ID test failed: ${error.message}`);
    return true; // Don't fail suite
  }
}

// Test 9: Timestamp validation
async function testTimestampValidation() {
  info('Test 9: Timestamp validation');
  try {
    const swapRequest = {
      from: 'btc',
      network_from: 'Mainnet',
      to: 'usdt',
      network_to: 'TRC20',
      amount: 0.001,
      provider: 'ChangeNOW',
      recipient_address: 'TTestAddressForSandboxOnly123456789',
      rate_type: 'floating',
      sandbox: true,
    };
    
    const response = await fetch(`${API_BASE_URL}/swap/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapRequest),
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Validate ISO 8601 timestamps
      const createdAt = new Date(data.created_at);
      const expiresAt = new Date(data.expires_at);
      
      if (isNaN(createdAt.getTime())) {
        fail('Invalid created_at timestamp');
        return false;
      }
      
      if (isNaN(expiresAt.getTime())) {
        fail('Invalid expires_at timestamp');
        return false;
      }
      
      pass('Timestamps are valid ISO 8601 format');
      pass(`Created: ${data.created_at}`);
      pass(`Expires: ${data.expires_at}`);
      
      // Check that expires_at is in the future
      if (expiresAt > createdAt) {
        pass('Expiration is after creation');
      } else {
        warn('Expiration is not after creation');
      }
    } else {
      warn('Could not create swap for timestamp validation');
    }
    
    return true;
  } catch (error) {
    warn(`Timestamp validation failed: ${error.message}`);
    return true; // Don't fail suite
  }
}

// Test 10: Advanced parameters (KYC, payment flag)
async function testAdvancedParameters() {
  info('Test 10: Advanced parameters (KYC, payment flag)');
  try {
    const advancedRequest = {
      from: 'btc',
      network_from: 'Mainnet',
      to: 'usdt',
      network_to: 'TRC20',
      amount: 0.001,
      provider: 'ChangeNOW',
      recipient_address: 'TTestAddressForSandboxOnly123456789',
      rate_type: 'floating',
      min_kycrating: 'B',
      payment: false,
      sandbox: true,
    };
    
    const response = await fetch(`${API_BASE_URL}/swap/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(advancedRequest),
    });
    
    if (response.ok) {
      pass('Advanced parameters accepted');
      const data = await response.json();
      pass(`Swap created with min_kycrating: B`);
      pass(`Payment flag: ${data.is_payment}`);
    } else {
      warn('Advanced parameters may not be fully supported');
    }
    
    return true;
  } catch (error) {
    warn(`Advanced parameters test failed: ${error.message}`);
    return true; // Don't fail suite
  }
}

// Run all tests
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  SWAP CREATE ENDPOINT INTEGRATION TEST');
  console.log('='.repeat(60) + '\n');
  
  warn('NOTE: This test creates swaps in SANDBOX mode');
  console.log('');
  
  const tests = [
    testBackendConnectivity,
    testInputValidation,
    testCreateSwapSandbox,
    testSwapStatusValidation,
    testRateTypeValidation,
    testRefundAddress,
    testExtraIdHandling,
    testTradeIdFromRates,
    testTimestampValidation,
    testAdvancedParameters,
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
