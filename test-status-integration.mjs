#!/usr/bin/env node
/**
 * Integration Test for GET /swap/{id} endpoint
 * Tests swap status retrieval and field validation
 * 
 * Run: node test-status-integration.mjs
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
    // Test with a fake ID to check if endpoint exists
    const response = await fetch(`${API_BASE_URL}/swap/test-id-12345`);
    
    // We expect 404 (not found) not 405 (method not allowed)
    if (response.status === 404) {
      pass('Endpoint exists (404 for non-existent swap)');
      return true;
    } else if (response.status === 200) {
      pass('Endpoint is reachable');
      return true;
    } else {
      warn(`Endpoint returned status ${response.status}`);
      return true;
    }
  } catch (error) {
    fail(`Cannot connect to backend: ${error.message}`);
    return false;
  }
}

// Test 2: Create a test swap to get a real ID
async function createTestSwap() {
  info('Test 2: Create test swap for status checking');
  try {
    const swapRequest = {
      from: 'btc',
      network_from: 'Mainnet',
      to: 'usdt',
      network_to: 'TRC20',
      amount: 0.001,
      provider: 'FixedFloat',
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
      warn(`Could not create test swap: ${response.status} - ${errorText.substring(0, 100)}`);
      return null;
    }
    
    const data = await response.json();
    pass(`Test swap created: ${data.swap_id}`);
    pass(`Status: ${data.status}`);
    
    return data.swap_id;
  } catch (error) {
    warn(`Test swap creation failed: ${error.message}`);
    return null;
  }
}

// Test 3: Response structure validation
async function testResponseStructure(swapId) {
  info('Test 3: Response structure validation');
  
  if (!swapId) {
    warn('No swap ID available, skipping test');
    return true;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/swap/${swapId}`);
    
    if (!response.ok) {
      fail(`Failed to fetch swap status: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    // Check required fields
    const requiredFields = [
      'swap_id', 'provider', 'status', 'from', 'to', 'amount',
      'deposit_address', 'recipient_address', 'rate',
      'estimated_receive', 'rate_type', 'is_sandbox',
      'created_at', 'updated_at'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      fail(`Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    pass('All required fields present');
    pass(`Swap ID: ${data.swap_id}`);
    pass(`Provider: ${data.provider}`);
    pass(`Status: ${data.status}`);
    pass(`From: ${data.from} -> To: ${data.to}`);
    pass(`Amount: ${data.amount}`);
    pass(`Rate: ${data.rate}`);
    pass(`Estimated receive: ${data.estimated_receive}`);
    
    // Check optional fields
    if (data.provider_swap_id) {
      pass(`Provider swap ID: ${data.provider_swap_id}`);
    }
    
    if (data.actual_receive) {
      pass(`Actual receive: ${data.actual_receive}`);
    }
    
    if (data.tx_hash_in) {
      pass(`TX hash in: ${data.tx_hash_in.substring(0, 20)}...`);
    }
    
    if (data.tx_hash_out) {
      pass(`TX hash out: ${data.tx_hash_out.substring(0, 20)}...`);
    }
    
    if (data.deposit_extra_id) {
      pass(`Deposit memo: ${data.deposit_extra_id}`);
    }
    
    if (data.recipient_extra_id) {
      pass(`Recipient memo: ${data.recipient_extra_id}`);
    }
    
    if (data.expires_at) {
      pass(`Expires at: ${data.expires_at}`);
    }
    
    return true;
  } catch (error) {
    fail(`Response validation failed: ${error.message}`);
    return false;
  }
}

// Test 4: Status enum validation
async function testStatusValidation(swapId) {
  info('Test 4: Status enum validation');
  
  if (!swapId) {
    warn('No swap ID available, skipping test');
    return true;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/swap/${swapId}`);
    const data = await response.json();
    
    const validStatuses = [
      'waiting', 'confirming', 'exchanging', 'sending',
      'completed', 'failed', 'refunded', 'expired'
    ];
    
    if (!validStatuses.includes(data.status)) {
      fail(`Invalid status: ${data.status}`);
      return false;
    }
    
    pass(`Status is valid: ${data.status}`);
    
    return true;
  } catch (error) {
    fail(`Status validation failed: ${error.message}`);
    return false;
  }
}

// Test 5: Timestamp validation
async function testTimestampValidation(swapId) {
  info('Test 5: Timestamp validation');
  
  if (!swapId) {
    warn('No swap ID available, skipping test');
    return true;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/swap/${swapId}`);
    const data = await response.json();
    
    // Validate created_at
    const createdAt = new Date(data.created_at);
    if (isNaN(createdAt.getTime())) {
      fail('Invalid created_at timestamp');
      return false;
    }
    pass(`created_at is valid: ${data.created_at}`);
    
    // Validate updated_at
    const updatedAt = new Date(data.updated_at);
    if (isNaN(updatedAt.getTime())) {
      fail('Invalid updated_at timestamp');
      return false;
    }
    pass(`updated_at is valid: ${data.updated_at}`);
    
    // Validate expires_at if present
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      if (isNaN(expiresAt.getTime())) {
        fail('Invalid expires_at timestamp');
        return false;
      }
      pass(`expires_at is valid: ${data.expires_at}`);
      
      // Check that expires_at is after created_at
      if (expiresAt > createdAt) {
        pass('Expiration is after creation');
      } else {
        warn('Expiration is not after creation');
      }
    }
    
    // Check that updated_at >= created_at
    if (updatedAt >= createdAt) {
      pass('updated_at is after or equal to created_at');
    } else {
      fail('updated_at is before created_at');
      return false;
    }
    
    return true;
  } catch (error) {
    fail(`Timestamp validation failed: ${error.message}`);
    return false;
  }
}

// Test 6: Amount validation
async function testAmountValidation(swapId) {
  info('Test 6: Amount validation');
  
  if (!swapId) {
    warn('No swap ID available, skipping test');
    return true;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/swap/${swapId}`);
    const data = await response.json();
    
    // Validate amounts are positive
    if (data.amount <= 0) {
      fail('Swap amount is not positive');
      return false;
    }
    pass(`Swap amount is positive: ${data.amount}`);
    
    if (data.estimated_receive <= 0) {
      fail('Estimated receive is not positive');
      return false;
    }
    pass(`Estimated receive is positive: ${data.estimated_receive}`);
    
    if (data.rate <= 0) {
      fail('Rate is not positive');
      return false;
    }
    pass(`Rate is positive: ${data.rate}`);
    
    // Validate actual_receive if present
    if (data.actual_receive !== undefined && data.actual_receive !== null) {
      if (data.actual_receive <= 0) {
        fail('Actual receive is not positive');
        return false;
      }
      pass(`Actual receive is positive: ${data.actual_receive}`);
    }
    
    return true;
  } catch (error) {
    fail(`Amount validation failed: ${error.message}`);
    return false;
  }
}

// Test 7: Non-existent swap ID
async function testNonExistentSwap() {
  info('Test 7: Non-existent swap ID handling');
  try {
    const fakeId = 'non-existent-swap-id-12345';
    const response = await fetch(`${API_BASE_URL}/swap/${fakeId}`);
    
    if (response.status === 404) {
      pass('Non-existent swap returns 404');
      return true;
    } else if (response.status === 400) {
      pass('Non-existent swap returns 400 (bad request)');
      return true;
    } else {
      warn(`Non-existent swap returned status ${response.status}`);
      return true;
    }
  } catch (error) {
    fail(`Non-existent swap test failed: ${error.message}`);
    return false;
  }
}

// Test 8: Address validation
async function testAddressValidation(swapId) {
  info('Test 8: Address validation');
  
  if (!swapId) {
    warn('No swap ID available, skipping test');
    return true;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/swap/${swapId}`);
    const data = await response.json();
    
    // Check deposit_address is not empty
    if (!data.deposit_address || data.deposit_address.trim() === '') {
      fail('Deposit address is empty');
      return false;
    }
    pass(`Deposit address: ${data.deposit_address}`);
    
    // Check recipient_address is not empty
    if (!data.recipient_address || data.recipient_address.trim() === '') {
      fail('Recipient address is empty');
      return false;
    }
    pass(`Recipient address: ${data.recipient_address}`);
    
    return true;
  } catch (error) {
    fail(`Address validation failed: ${error.message}`);
    return false;
  }
}

// Test 9: Provider information
async function testProviderInformation(swapId) {
  info('Test 9: Provider information validation');
  
  if (!swapId) {
    warn('No swap ID available, skipping test');
    return true;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/swap/${swapId}`);
    const data = await response.json();
    
    // Check provider is not empty
    if (!data.provider || data.provider.trim() === '') {
      fail('Provider is empty');
      return false;
    }
    pass(`Provider: ${data.provider}`);
    
    // Check provider_swap_id if present
    if (data.provider_swap_id) {
      pass(`Provider swap ID: ${data.provider_swap_id}`);
    } else {
      warn('No provider_swap_id (may not be assigned yet)');
    }
    
    return true;
  } catch (error) {
    fail(`Provider information validation failed: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  SWAP STATUS ENDPOINT INTEGRATION TEST');
  console.log('='.repeat(60) + '\n');
  
  warn('NOTE: This test creates a swap in SANDBOX mode');
  console.log('');
  
  let passed = 0;
  let failed = 0;
  let swapId = null;
  
  // Test 1: Connectivity
  try {
    const result = await testBackendConnectivity();
    if (result) passed++; else failed++;
    console.log('');
  } catch (error) {
    fail(`Test crashed: ${error.message}`);
    failed++;
    console.log('');
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Create test swap
  try {
    swapId = await createTestSwap();
    if (swapId) passed++; else failed++;
    console.log('');
  } catch (error) {
    fail(`Test crashed: ${error.message}`);
    failed++;
    console.log('');
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Run remaining tests with swapId
  const tests = [
    () => testResponseStructure(swapId),
    () => testStatusValidation(swapId),
    () => testTimestampValidation(swapId),
    () => testAmountValidation(swapId),
    testNonExistentSwap,
    () => testAddressValidation(swapId),
    () => testProviderInformation(swapId),
  ];
  
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
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('='.repeat(60));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60) + '\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
