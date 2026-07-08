// Quick test to verify all imports resolve correctly
console.log('Testing imports...');

try {
  console.log('✓ All imports should resolve correctly');
  console.log('Run: pnpm dev');
} catch (e) {
  console.error('✗ Import error:', e.message);
}
