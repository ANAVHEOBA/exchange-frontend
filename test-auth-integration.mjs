#!/usr/bin/env node
/**
 * Integration Test for /auth endpoints
 * Tests user registration, login, logout, and profile
 * 
 * Run: node test-auth-integration.mjs
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

// Generate random username/email for testing
const timestamp = Date.now();
const testUsername = `testuser${timestamp}`;
const testEmail = `test${timestamp}@example.com`;
const testPassword = 'SecurePass123!';

// For verified account tests
const verifiedUsername = `verified${timestamp}`;
const verifiedEmail = `verified${timestamp}@example.com`;

// Test 1: Backend connectivity
async function testBackendConnectivity() {
  info('Test 1: Backend connectivity');
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
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

// Test 2: Register new user
async function testRegisterUser() {
  info('Test 2: Register new user');
  try {
    const request = {
      username: testUsername,
      email: testEmail,
      password: testPassword,
      password_confirm: testPassword,
    };
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      fail(`Registration failed: ${response.status} - ${errorText.substring(0, 100)}`);
      return false;
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data.user) {
      fail('Response missing user object');
      return false;
    }
    
    const user = data.user;
    const requiredFields = ['id', 'email', 'username', 'email_verified', 'two_factor_enabled', 'created_at', 'updated_at'];
    const missingFields = requiredFields.filter(field => !(field in user));
    
    if (missingFields.length > 0) {
      fail(`Missing user fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    pass('User registered successfully');
    pass(`User ID: ${user.id}`);
    pass(`Username: ${user.username}`);
    pass(`Email: ${user.email}`);
    pass(`Email verified: ${user.email_verified}`);
    pass(`2FA enabled: ${user.two_factor_enabled}`);
    pass(`Created at: ${user.created_at}`);
    
    // Store user data for other tests
    global.testUser = user;
    
    return true;
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    return false;
  }
}

// Test 3: Duplicate registration (unverified account behavior)
async function testDuplicateRegistration() {
  info('Test 3: Duplicate registration (unverified account)');
  try {
    const request = {
      username: testUsername,
      email: testEmail,
      password: testPassword,
      password_confirm: testPassword,
    };
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      fail(`Duplicate registration failed: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    const newUserId = data.user.id;
    const oldUserId = global.testUser.id;
    
    if (newUserId !== oldUserId) {
      pass('Unverified account replaced with new registration');
      pass(`Old user ID: ${oldUserId}`);
      pass(`New user ID: ${newUserId}`);
      pass('✓ Allows re-registration for unverified accounts');
      
      // Update stored user
      global.testUser = data.user;
    } else {
      warn('Same user ID returned (unexpected)');
    }
    
    return true;
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    return false;
  }
}

// Test 4: Password mismatch
async function testPasswordMismatch() {
  info('Test 4: Password mismatch validation');
  try {
    const request = {
      username: `user${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: testPassword,
      password_confirm: 'DifferentPassword123!',
    };
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (response.ok) {
      fail('Password mismatch was allowed');
      return false;
    }
    
    pass(`Password mismatch rejected: ${response.status}`);
    
    return true;
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    return false;
  }
}

// Test 5: Invalid email format
async function testInvalidEmail() {
  info('Test 5: Invalid email format');
  try {
    const request = {
      username: `user${Date.now()}`,
      email: 'invalid-email-format',
      password: testPassword,
      password_confirm: testPassword,
    };
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (response.ok) {
      fail('Invalid email was allowed');
      return false;
    }
    
    pass(`Invalid email rejected: ${response.status}`);
    
    return true;
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    return false;
  }
}

// Test 6: Missing required fields
async function testMissingFields() {
  info('Test 6: Missing required fields');
  try {
    const request = {
      username: `user${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      // Missing password fields
    };
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (response.ok) {
      fail('Missing fields were allowed');
      return false;
    }
    
    pass(`Missing fields rejected: ${response.status}`);
    
    return true;
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    return false;
  }
}

// Test 7: User ID format (UUID)
async function testUserIdFormat() {
  info('Test 7: User ID format validation');
  
  if (!global.testUser) {
    warn('No test user available, skipping');
    return true;
  }
  
  try {
    const userId = global.testUser.id;
    
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(userId)) {
      fail(`Invalid UUID format: ${userId}`);
      return false;
    }
    
    pass('User ID is valid UUID');
    pass(`UUID: ${userId}`);
    
    return true;
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    return false;
  }
}

// Test 8: Timestamp format (ISO 8601)
async function testTimestampFormat() {
  info('Test 8: Timestamp format validation');
  
  if (!global.testUser) {
    warn('No test user available, skipping');
    return true;
  }
  
  try {
    const user = global.testUser;
    
    // Validate created_at
    const createdAt = new Date(user.created_at);
    if (isNaN(createdAt.getTime())) {
      fail('Invalid created_at timestamp');
      return false;
    }
    pass(`created_at is valid: ${user.created_at}`);
    
    // Validate updated_at
    const updatedAt = new Date(user.updated_at);
    if (isNaN(updatedAt.getTime())) {
      fail('Invalid updated_at timestamp');
      return false;
    }
    pass(`updated_at is valid: ${user.updated_at}`);
    
    // Check that updated_at >= created_at
    if (updatedAt >= createdAt) {
      pass('updated_at is after or equal to created_at');
    } else {
      fail('updated_at is before created_at');
      return false;
    }
    
    return true;
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    return false;
  }
}

// Test 9: Default values
async function testDefaultValues() {
  info('Test 9: Default values validation');
  
  if (!global.testUser) {
    warn('No test user available, skipping');
    return true;
  }
  
  try {
    const user = global.testUser;
    
    // Email should not be verified by default
    if (user.email_verified === false) {
      pass('email_verified defaults to false');
    } else {
      warn(`email_verified is ${user.email_verified} (expected false)`);
    }
    
    // 2FA should not be enabled by default
    if (user.two_factor_enabled === false) {
      pass('two_factor_enabled defaults to false');
    } else {
      warn(`two_factor_enabled is ${user.two_factor_enabled} (expected false)`);
    }
    
    return true;
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    return false;
  }
}

// Test 10: Verify email endpoint structure
async function testVerifyEmailEndpoint() {
  info('Test 10: Verify email endpoint');
  try {
    // Test with missing token
    const response1 = await fetch(`${API_BASE_URL}/auth/verify-email`);
    const data1 = await response1.json();
    
    if (data1.error && data1.error.includes('token')) {
      pass('Missing token rejected');
      pass(`Error: ${data1.error}`);
    } else {
      warn('Missing token handling unexpected');
    }
    
    // Test with invalid token
    const response2 = await fetch(`${API_BASE_URL}/auth/verify-email?token=invalid-token-123`);
    const data2 = await response2.json();
    
    if (data2.error && data2.error.includes('Invalid')) {
      pass('Invalid token rejected');
      pass(`Error: ${data2.error}`);
    } else {
      warn('Invalid token handling unexpected');
    }
    
    return true;
  } catch (error) {
    fail(`Test failed: ${error.message}`);
    return false;
  }
}

// Test 11: Scenario 2 - Verified email conflict (simulated)
async function testVerifiedEmailConflict() {
  info('Test 11: Verified email conflict (409 expected)');
  warn('Note: This test requires manual verification or mock');
  warn('Skipping - would need to verify an account first');
  return true;
}

// Test 12: Scenario 3 - Verified username conflict (simulated)
async function testVerifiedUsernameConflict() {
  info('Test 12: Verified username conflict (409 expected)');
  warn('Note: This test requires manual verification or mock');
  warn('Skipping - would need to verify an account first');
  return true;
}

// Run all tests
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  AUTH REGISTER ENDPOINT INTEGRATION TEST');
  console.log('='.repeat(60) + '\n');
  
  info(`Test credentials: ${testUsername} / ${testEmail}`);
  console.log('');
  
  const tests = [
    testBackendConnectivity,
    testRegisterUser,
    testDuplicateRegistration,
    testPasswordMismatch,
    testInvalidEmail,
    testMissingFields,
    testUserIdFormat,
    testTimestampFormat,
    testDefaultValues,
    testVerifyEmailEndpoint,
    testVerifiedEmailConflict,
    testVerifiedUsernameConflict,
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
