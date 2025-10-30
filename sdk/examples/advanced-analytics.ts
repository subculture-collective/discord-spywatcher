/**
 * Advanced Analytics Example
 * 
 * This example demonstrates advanced analytics queries with the SDK
 */

import { Spywatcher } from '../src';

async function main() {
  const client = new Spywatcher({
    baseUrl: process.env.SPYWATCHER_API_URL || 'http://localhost:3001/api',
    apiKey: process.env.SPYWATCHER_API_KEY || 'spy_live_your_api_key_here',
  });

  console.log('=== Spywatcher SDK - Advanced Analytics Example ===\n');

  // 1. Get ghosts with date range
  console.log('1. Getting ghost users for the last 30 days...');
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ghosts = await client.analytics.getGhosts({
    startDate: thirtyDaysAgo.toISOString(),
    endDate: new Date().toISOString(),
  });

  console.log(`✓ Found ${ghosts.length} ghost users`);
  console.log('  Most inactive:', ghosts[0]?.username);
  console.log(`  Days since last seen: ${ghosts[0]?.daysSinceLastSeen}`);
  console.log();

  // 2. Get lurkers with pagination
  console.log('2. Getting lurkers with pagination...');
  const lurkersPage1 = await client.analytics.getLurkers({
    page: 1,
    perPage: 10,
  });

  console.log(`✓ Got ${lurkersPage1.length} lurkers (page 1)`);
  if (lurkersPage1.length > 0) {
    console.log('  Top lurker:', lurkersPage1[0].username);
    console.log('  Message count:', lurkersPage1[0].messageCount);
    console.log('  Presence count:', lurkersPage1[0].presenceCount);
  }
  console.log();

  // 3. Get activity heatmap and analyze peak hours
  console.log('3. Analyzing activity heatmap...');
  const heatmap = await client.analytics.getHeatmap();

  // Find peak hour
  const peakHour = heatmap.reduce(
    (max, curr) => (curr.count > max.count ? curr : max),
    heatmap[0]
  );

  console.log('✓ Activity heatmap analyzed');
  console.log('  Peak hour:', peakHour?.hour);
  console.log('  Peak day:', peakHour?.dayOfWeek);
  console.log('  Peak count:', peakHour?.count);
  console.log();

  // 4. Get role changes with pagination
  console.log('4. Getting recent role changes...');
  const roleChanges = await client.analytics.getRoleChanges({
    page: 1,
    perPage: 5,
  });

  console.log(`✓ Found ${roleChanges.data.length} recent role changes`);
  if (roleChanges.data.length > 0) {
    const change = roleChanges.data[0];
    console.log('  User:', change.username);
    console.log('  Before:', change.rolesBefore.join(', '));
    console.log('  After:', change.rolesAfter.join(', '));
  }
  console.log();

  // 5. Get client data and analyze usage
  console.log('5. Analyzing client usage...');
  const clients = await client.analytics.getClients();

  const clientCounts = clients.reduce((acc, user) => {
    user.clients.forEach((client) => {
      acc[client] = (acc[client] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  console.log('✓ Client usage analyzed');
  console.log('  Desktop users:', clientCounts.desktop || 0);
  console.log('  Mobile users:', clientCounts.mobile || 0);
  console.log('  Web users:', clientCounts.web || 0);
  console.log();

  // 6. Get suspicion data and analyze
  console.log('6. Analyzing suspicious users...');
  const suspicions = await client.getSuspicionData();

  if (suspicions.length > 0) {
    const highSuspicion = suspicions.filter((s) => s.suspicionScore > 70);
    console.log(`✓ Found ${suspicions.length} suspicious users`);
    console.log(`  High suspicion (>70): ${highSuspicion.length}`);

    if (highSuspicion.length > 0) {
      console.log('  Top suspect:', highSuspicion[0].username);
      console.log('  Score:', highSuspicion[0].suspicionScore);
      console.log('  Reasons:', highSuspicion[0].reasons.join(', '));
    }
  } else {
    console.log('✓ No suspicious users found');
  }
  console.log();

  // 7. Get timeline for comprehensive view
  console.log('7. Getting recent timeline events...');
  const timeline = await client.getTimeline({
    page: 1,
    perPage: 10,
  });

  console.log(`✓ Got ${timeline.length} timeline events`);
  if (timeline.length > 0) {
    console.log('  Most recent:', timeline[0].eventType);
    console.log('  User:', timeline[0].username);
    console.log('  Timestamp:', timeline[0].timestamp);
  }
  console.log();

  console.log('=== Advanced analytics completed successfully! ===');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
