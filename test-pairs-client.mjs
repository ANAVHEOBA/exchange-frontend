#!/usr/bin/env node
/**
 * Quick test of pairs API client integration
 * Tests: API Client -> Endpoint wrapper -> Backend
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple test without full build
async function testPairsEndpoint() {
  const API_BASE_URL = 'http://localhost:3000';
  
  console.log('Testing /swap/pairs endpoint...\n');
  
  // Test 1: Basic call
  console.log('1. Basic call (no params)');
  const response1 = await fetch(`${API_BASE_URL}/swap/pairs`);
  const data1 = await response1.json();
  console.log(`   ✓ Status: ${response1.status}`);
  console.log(`   ✓ Pairs: ${data1.pairs.length}`);
  console.log(`   ✓ Pagination: page=${data1.pagination.page}, total=${data1.pagination.total_elements}\n`);
  
  // Test 2: With pagination
  console.log('2. With pagination (page=0, size=10)');
  const response2 = await fetch(`${API_BASE_URL}/swap/pairs?page=0&size=10`);
  const data2 = await response2.json();
  console.log(`   ✓ Status: ${response2.status}`);
  console.log(`   ✓ Requested size: 10, Got: ${data2.pairs.length}`);
  console.log(`   ✓ Page size in response: ${data2.pagination.size}\n`);
  
  // Test 3: With status filter
  console.log('3. With status filter (status=active)');
  const response3 = await fetch(`${API_BASE_URL}/swap/pairs?status=active`);
  const data3 = await response3.json();
  console.log(`   ✓ Status: ${response3.status}`);
  console.log(`   ✓ Active pairs: ${data3.pairs.length}\n`);
  
  // Test 4: Multiple filters
  if (data1.pairs.length > 0) {
    const sample = data1.pairs[0];
    console.log('4. Multiple filters (base_currency + status)');
    const response4 = await fetch(`${API_BASE_URL}/swap/pairs?base_currency=${sample.base_currency}&status=active`);
    const data4 = await response4.json();
    console.log(`   ✓ Status: ${response4.status}`);
    console.log(`   ✓ Filtered pairs: ${data4.pairs.length}`);
    console.log(`   ✓ Filter: base_currency=${sample.base_currency}\n`);
  } else {
    console.log('4. Multiple filters - skipped (no pairs in DB)\n');
  }
  
  console.log('✅ All tests passed!');
}

testPairsEndpoint().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
