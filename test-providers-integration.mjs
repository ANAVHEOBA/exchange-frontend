#!/usr/bin/env node
/**
 * Integration Test for /providers endpoint
 * Tests the complete flow: API Client -> Endpoint -> Backend
 * 
 * Run: node test-providers-integration.mjs
 */

const API_BASE_URL = 'http://localhost:3000';

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
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
    const response = await fetch(`${API_BASE_URL}/swap/providers`);
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
    const response = await fetch(`${API_BASE_URL}/swap/providers`);
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      fail('Response is not an array');
      return false;
    }
    
    pass(`Response is an array with ${data.length} providers`);
    
    if (data.length === 0) {
      fail('Response array is empty');
      return false;
    }
    
    // Validate first provider structure
    const provider = data[0];
    const requiredFields = ['name', 'rating', 'insurance', 'markup_enabled', 'eta'];
    const optionalFields = ['log_policy'];
    const missingFields = requiredFields.filter(field => !(field in provider));
    
    if (missingFields.length > 0) {
      fail(`Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    pass('Provider structure is valid');
    
    // Show which optional fields are present
    const presentOptional = optionalFields.filter(field => field in provider);
    if (presentOptional.length > 0) {
      pass(`Optional fields present: ${presentOptional.join(', ')}`);
    }
    
    pass(`Sample: ${provider.name} (Rating: ${provider.rating}, ETA: ${provider.eta}min)`);
    return true;
  } catch (error) {
    fail(`Response validation failed: ${error.message}`);
    return false;
  }
}

// Test 3: Rating validation
async function testRatingValidation() {
  info('Test 3: Rating values validation');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/providers`);
    const data = await response.json();
    
    const validRatings = ['A', 'B', 'C', 'D'];
    const invalidProviders = data.filter(p => !validRatings.includes(p.rating));
    
    if (invalidProviders.length > 0) {
      fail(`Found ${invalidProviders.length} providers with invalid ratings`);
      return false;
    }
    
    // Count by rating
    const ratingCounts = data.reduce((acc, p) => {
      acc[p.rating] = (acc[p.rating] || 0) + 1;
      return acc;
    }, {});
    
    pass('All KYC ratings are valid (A, B, C, or D)');
    pass(`KYC rating distribution: ${JSON.stringify(ratingCounts)}`);
    
    // Validate log_policy if present
    const validLogPolicies = ['A', 'B', 'C'];
    const withLogPolicy = data.filter(p => p.log_policy);
    const invalidLogPolicy = withLogPolicy.filter(p => !validLogPolicies.includes(p.log_policy));
    
    if (invalidLogPolicy.length > 0) {
      fail(`Found ${invalidLogPolicy.length} providers with invalid log_policy`);
      return false;
    }
    
    if (withLogPolicy.length > 0) {
      pass(`${withLogPolicy.length} providers have log_policy (A, B, or C)`);
    }
    
    return true;
  } catch (error) {
    fail(`Rating validation failed: ${error.message}`);
    return false;
  }
}

// Test 4: Filter by rating
async function testFilterByRating() {
  info('Test 4: Filter by rating');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/providers`);
    const allProviders = await response.json();
    
    // Test filtering for rating A
    const ratingA = allProviders.filter(p => p.rating === 'A');
    pass(`Rating A providers: ${ratingA.length}`);
    
    if (ratingA.length > 0) {
      pass(`Example: ${ratingA[0].name}`);
    }
    
    // Test filtering for rating B
    const ratingB = allProviders.filter(p => p.rating === 'B');
    pass(`Rating B providers: ${ratingB.length}`);
    
    return true;
  } catch (error) {
    fail(`Filter test failed: ${error.message}`);
    return false;
  }
}

// Test 5: Sort by ETA
async function testSortByETA() {
  info('Test 5: Sort by ETA (fastest providers)');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/providers`);
    const data = await response.json();
    
    // Sort by ETA ascending
    const sorted = [...data].sort((a, b) => a.eta - b.eta);
    const fastest = sorted.slice(0, 5);
    
    pass('Top 5 fastest providers:');
    fastest.forEach((p, i) => {
      pass(`  ${i + 1}. ${p.name} - ${p.eta} minutes (Rating: ${p.rating})`);
    });
    
    return true;
  } catch (error) {
    fail(`Sort test failed: ${error.message}`);
    return false;
  }
}

// Test 6: Insurance validation
async function testInsuranceValidation() {
  info('Test 6: Insurance values validation');
  try {
    const response = await fetch(`${API_BASE_URL}/swap/providers`);
    const data = await response.json();
    
    const invalidInsurance = data.filter(p => 
      typeof p.insurance !== 'number' || 
      p.insurance < 0 || 
      p.insurance > 1
    );
    
    if (invalidInsurance.length > 0) {
      fail(`Found ${invalidInsurance.length} providers with invalid insurance values`);
      return false;
    }
    
    const avgInsurance = data.reduce((sum, p) => sum + p.insurance, 0) / data.length;
    pass(`All insurance values are valid (0-1 range)`);
    pass(`Average insurance: ${(avgInsurance * 100).toFixed(2)}%`);
    
    return true;
  } catch (error) {
    fail(`Insurance validation failed: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  PROVIDERS ENDPOINT INTEGRATION TEST');
  console.log('='.repeat(60) + '\n');
  
  const tests = [
    testBackendConnectivity,
    testResponseStructure,
    testRatingValidation,
    testFilterByRating,
    testSortByETA,
    testInsuranceValidation,
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
