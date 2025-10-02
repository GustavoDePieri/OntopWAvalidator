#!/usr/bin/env node

/**
 * Amplemarket Configuration Checker
 * Run with: node check-amplemarket-config.js
 */

require('dotenv').config({ path: '.env.local' });

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, emoji, message) {
  console.log(`${colors[color]}${emoji} ${message}${colors.reset}`);
}

console.log('\n' + '='.repeat(60));
console.log('🔍 AMPLEMARKET CONFIGURATION CHECKER');
console.log('='.repeat(60) + '\n');

// Check API Key
const apiKey = process.env.AMPLEMARKET_API_KEY;

if (!apiKey) {
  log('red', '❌', 'AMPLEMARKET_API_KEY is NOT SET');
  log('yellow', '⚠️', 'This is why you\'re seeing fake/mock data!');
  console.log('\n' + colors.yellow + 'To fix this:' + colors.reset);
  console.log('1. Get your API key from: https://app.amplemarket.com/settings/api');
  console.log('2. Create/edit .env.local file in your project root');
  console.log('3. Add this line:');
  console.log('   ' + colors.cyan + 'AMPLEMARKET_API_KEY=amp_live_your_actual_key_here' + colors.reset);
  console.log('4. Restart your dev server: npm run dev\n');
  process.exit(1);
}

log('green', '✅', 'AMPLEMARKET_API_KEY is set');
console.log(`   Key: ${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 4)}`);
console.log(`   Length: ${apiKey.length} characters`);

// Validate key format
if (apiKey.startsWith('amp_live_')) {
  log('green', '✅', 'Key format is correct (production key)');
} else if (apiKey.startsWith('amp_test_')) {
  log('blue', 'ℹ️', 'Using TEST key (not production)');
} else {
  log('yellow', '⚠️', 'Key format looks unusual (should start with amp_live_ or amp_test_)');
}

// Check Base URL
const baseUrl = process.env.AMPLEMARKET_BASE_URL || 'https://api.amplemarket.com';
log('green', '✅', `Base URL: ${baseUrl}`);

// Check if .env.local exists
const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
  log('green', '✅', '.env.local file exists');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n').filter(line => 
    line.trim() && !line.trim().startsWith('#')
  );
  
  console.log('\n' + colors.cyan + 'Environment variables in .env.local:' + colors.reset);
  lines.forEach(line => {
    const [key] = line.split('=');
    if (key) {
      const icon = key.includes('AMPLEMARKET') ? '✅' : '  ';
      console.log(`  ${icon} ${key.trim()}`);
    }
  });
} else {
  log('yellow', '⚠️', '.env.local file NOT FOUND');
  log('blue', 'ℹ️', 'You may be using environment variables from another source');
}

console.log('\n' + '='.repeat(60));
log('green', '✨', 'Configuration check complete!');
console.log('='.repeat(60) + '\n');

// Final verdict
console.log(colors.cyan + 'Summary:' + colors.reset);
if (apiKey && apiKey.startsWith('amp_')) {
  log('green', '✅', 'Amplemarket is properly configured');
  console.log('\nIf you\'re still seeing mock data:');
  console.log('1. Check server console logs for API errors');
  console.log('2. Verify your API key is active in Amplemarket dashboard');
  console.log('3. Check if you have API credits remaining');
  console.log('4. Try running: ' + colors.cyan + 'node test-amplemarket.js' + colors.reset + '\n');
} else {
  log('red', '❌', 'Configuration incomplete - add your API key to .env.local');
}

