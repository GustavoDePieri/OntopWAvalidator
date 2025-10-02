#!/usr/bin/env node

/**
 * Amplemarket API Test Script
 * 
 * This script tests the Amplemarket API integration directly
 * Run with: node test-amplemarket.js
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.AMPLEMARKET_API_KEY;
const BASE_URL = process.env.AMPLEMARKET_BASE_URL || 'https://api.amplemarket.com';

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, emoji, message) {
  console.log(`${colors[color]}${emoji} ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

async function testAmplemarketAPI() {
  logSection('🔍 Amplemarket API Test');

  // Step 1: Check API Key
  log('blue', '🔑', 'Checking API key configuration...');
  if (!API_KEY) {
    log('red', '❌', 'ERROR: AMPLEMARKET_API_KEY not found in .env.local');
    log('yellow', '💡', 'Please add your API key to .env.local:');
    console.log('   AMPLEMARKET_API_KEY=amp_live_your_key_here\n');
    process.exit(1);
  }
  
  log('green', '✅', `API Key found: ${API_KEY.substring(0, 15)}...`);
  log('blue', '🌐', `Base URL: ${BASE_URL}`);

  // Step 2: Test with a sample email
  const testCases = [
    {
      name: 'Email Search',
      method: 'GET',
      url: `${BASE_URL}/people/find`,
      params: { email: 'elon@tesla.com' }, // Public figure for testing
      description: 'Finding contact by email (most accurate)'
    },
    {
      name: 'Name + Company Search',
      method: 'GET',
      url: `${BASE_URL}/people/find`,
      params: { name: 'Elon Musk', company_name: 'Tesla' },
      description: 'Finding contact by name and company'
    },
    {
      name: 'Broad Search',
      method: 'POST',
      url: `${BASE_URL}/people/search`,
      data: {
        person_name: 'Elon Musk',
        company_names: ['Tesla'],
        page: 1,
        page_size: 5
      },
      description: 'Broad search with multiple potential matches'
    }
  ];

  for (const testCase of testCases) {
    logSection(`📤 Test: ${testCase.name}`);
    log('blue', 'ℹ️', testCase.description);
    
    try {
      let response;
      
      if (testCase.method === 'GET') {
        const url = new URL(testCase.url);
        Object.entries(testCase.params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
        
        log('cyan', '🔗', `URL: ${url.toString()}`);
        
        response = await axios.get(url.toString(), {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });
      } else {
        log('cyan', '🔗', `URL: ${testCase.url}`);
        log('cyan', '📦', `Payload: ${JSON.stringify(testCase.data, null, 2)}`);
        
        response = await axios.post(testCase.url, testCase.data, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });
      }

      log('green', '✅', `Status: ${response.status} ${response.statusText}`);
      
      // Parse and display results
      const data = response.data;
      log('blue', '📥', 'Response received:');
      console.log(JSON.stringify(data, null, 2));

      // Extract phone numbers
      const phoneFields = [
        'mobile_number', 'phone_number', 'work_number', 
        'sourced_number', 'manually_added_number', 'phone'
      ];
      
      let foundPhones = [];
      
      // Check if it's a single person object
      if (data.id || data.object === 'person') {
        log('blue', '📋', 'Single person response detected');
        phoneFields.forEach(field => {
          if (data[field]) {
            foundPhones.push({ field, value: data[field] });
          }
        });
      }
      // Check if it's a search results array
      else if (data.results && Array.isArray(data.results)) {
        log('blue', '📋', `Search results: ${data.results.length} person(s) found`);
        data.results.forEach((person, index) => {
          log('blue', '👤', `Person ${index + 1}:`);
          console.log(`   Name: ${person.name || person.first_name || 'N/A'}`);
          console.log(`   Email: ${person.email || 'N/A'}`);
          console.log(`   Company: ${person.company?.name || person.company_name || 'N/A'}`);
          
          phoneFields.forEach(field => {
            if (person[field]) {
              foundPhones.push({ field, value: person[field], person: index + 1 });
            }
          });
        });
      }

      if (foundPhones.length > 0) {
        log('green', '📞', `Found ${foundPhones.length} phone number(s):`);
        foundPhones.forEach(phone => {
          const personInfo = phone.person ? ` (Person ${phone.person})` : '';
          console.log(`   ${phone.field}${personInfo}: ${phone.value}`);
        });
      } else {
        log('yellow', '⚠️', 'No phone numbers found in response');
        log('blue', 'ℹ️', 'Available fields in response:');
        const keys = data.id ? Object.keys(data) : (data.results && data.results[0] ? Object.keys(data.results[0]) : Object.keys(data));
        console.log(`   ${keys.join(', ')}`);
      }

      log('green', '✨', `Test "${testCase.name}" PASSED\n`);
      
    } catch (error) {
      log('red', '❌', `Test "${testCase.name}" FAILED`);
      
      if (error.response) {
        log('red', '🔴', `HTTP ${error.response.status}: ${error.response.statusText}`);
        
        if (error.response.data) {
          log('red', '📥', 'Error response:');
          console.log(JSON.stringify(error.response.data, null, 2));
        }

        // Provide helpful suggestions based on error code
        if (error.response.status === 401) {
          log('yellow', '💡', 'Suggestion: Check if your API key is valid and active');
        } else if (error.response.status === 429) {
          log('yellow', '💡', 'Suggestion: Rate limit exceeded. Wait a minute before retrying');
        } else if (error.response.status === 402) {
          log('yellow', '💡', 'Suggestion: Insufficient credits. Check your Amplemarket account balance');
        } else if (error.response.status === 404) {
          log('yellow', '💡', 'Suggestion: Contact not found in Amplemarket database');
        }
      } else if (error.request) {
        log('red', '🔴', 'No response received from server');
        log('yellow', '💡', 'Suggestion: Check your internet connection and API base URL');
      } else {
        log('red', '🔴', `Error: ${error.message}`);
      }
      
      console.log('');
    }

    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  logSection('🎉 Test Complete');
  log('green', '✅', 'All tests finished!');
  log('blue', 'ℹ️', 'Check the results above to verify the API is working correctly.');
  console.log('');
}

// Run the test
testAmplemarketAPI().catch(error => {
  log('red', '❌', `Unexpected error: ${error.message}`);
  process.exit(1);
});

