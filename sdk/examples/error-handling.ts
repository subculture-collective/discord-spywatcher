/**
 * Error Handling Example
 * 
 * This example demonstrates comprehensive error handling with the SDK
 */

import {
  Spywatcher,
  SpywatcherError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
} from '../src';

async function main() {
  console.log('=== Spywatcher SDK - Error Handling Example ===\n');

  // Example 1: Invalid API key
  console.log('1. Testing with invalid API key...');
  try {
    const client = new Spywatcher({
      baseUrl: 'http://localhost:3001/api',
      apiKey: 'invalid_key',
    });
    await client.healthCheck();
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('✓ Caught ValidationError:', error.message);
    }
  }
  console.log();

  // Example 2: Authentication error
  console.log('2. Testing authentication error...');
  try {
    const client = new Spywatcher({
      baseUrl: 'http://localhost:3001/api',
      apiKey: 'spy_live_invalid_key_12345',
    });
    await client.getCurrentUser();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.log('✓ Caught AuthenticationError:', error.message);
      console.log('  Status code:', error.statusCode);
    }
  }
  console.log();

  // Example 3: Generic error handling
  console.log('3. Testing generic error handling...');
  const client = new Spywatcher({
    baseUrl: process.env.SPYWATCHER_API_URL || 'http://localhost:3001/api',
    apiKey: process.env.SPYWATCHER_API_KEY || 'spy_live_your_api_key_here',
  });

  try {
    await client.analytics.getGhosts();
    console.log('✓ Request succeeded');
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.log('❌ Authentication failed:', error.message);
    } else if (error instanceof RateLimitError) {
      console.log('❌ Rate limit exceeded:', error.message);
    } else if (error instanceof ValidationError) {
      console.log('❌ Validation failed:', error.message);
    } else if (error instanceof SpywatcherError) {
      console.log('❌ API error:', error.message);
      console.log('   Status code:', error.statusCode);
      console.log('   Response:', error.response);
    } else {
      console.log('❌ Unexpected error:', error);
    }
  }
  console.log();

  console.log('=== Error handling examples completed ===');
}

main().catch((error) => {
  console.error('Unhandled error:', error.message);
  process.exit(1);
});
