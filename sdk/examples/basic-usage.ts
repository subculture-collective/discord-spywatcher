/**
 * Basic Usage Example
 * 
 * This example demonstrates basic usage of the Spywatcher SDK
 */

import { Spywatcher } from '../src';

async function main() {
  // Initialize the client
  const client = new Spywatcher({
    baseUrl: process.env.SPYWATCHER_API_URL || 'http://localhost:3001/api',
    apiKey: process.env.SPYWATCHER_API_KEY || 'spy_live_your_api_key_here',
    debug: true,
  });

  console.log('=== Spywatcher SDK - Basic Usage Example ===\n');

  // 1. Health Check
  console.log('1. Checking API health...');
  const health = await client.healthCheck();
  console.log('✓ API Status:', health.status);
  console.log();

  // 2. Get Current User
  console.log('2. Getting current user...');
  const user = await client.getCurrentUser();
  console.log('✓ Logged in as:', `${user.username}#${user.discriminator}`);
  console.log('  Role:', user.role);
  console.log();

  // 3. Get Ghost Users
  console.log('3. Getting ghost users (inactive users)...');
  const ghosts = await client.analytics.getGhosts();
  console.log(`✓ Found ${ghosts.length} ghost users`);
  if (ghosts.length > 0) {
    console.log('  Sample:', ghosts[0]);
  }
  console.log();

  // 4. Get Lurkers
  console.log('4. Getting lurkers (low activity users)...');
  const lurkers = await client.analytics.getLurkers();
  console.log(`✓ Found ${lurkers.length} lurkers`);
  if (lurkers.length > 0) {
    console.log('  Sample:', lurkers[0]);
  }
  console.log();

  // 5. Get Activity Heatmap
  console.log('5. Getting activity heatmap...');
  const heatmap = await client.analytics.getHeatmap();
  console.log(`✓ Got ${heatmap.length} heatmap data points`);
  if (heatmap.length > 0) {
    console.log('  Sample:', heatmap[0]);
  }
  console.log();

  // 6. Get Suspicion Data
  console.log('6. Getting suspicion data...');
  const suspicions = await client.getSuspicionData();
  console.log(`✓ Found ${suspicions.length} suspicious users`);
  if (suspicions.length > 0) {
    console.log('  Sample:', suspicions[0]);
  }
  console.log();

  console.log('=== All operations completed successfully! ===');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
