# Quick Start

Get up and running with Spywatcher in under 10 minutes!

## Prerequisites

Before starting, make sure you have:

- ✅ Spywatcher installed ([Installation Guide](./installation))
- ✅ A Discord bot created and added to your server
- ✅ Backend and frontend services running

## Step 1: Access the Dashboard

Open your browser and navigate to:

```
http://localhost:5173
```

You'll see the Spywatcher login page.

## Step 2: Sign In with Discord

1. Click the **"Sign in with Discord"** button
2. Authorize Spywatcher to access your Discord account
3. Review the requested permissions:
   - View your Discord profile
   - View your server memberships
   - Access basic account information
4. Click **"Authorize"**

::: tip First-time Authorization
The first time you sign in, Discord will ask you to authorize the application. This is a one-time setup.
:::

## Step 3: Select Your Server

After authentication, you'll see the **Guild Selection** page:

1. View all Discord servers where the Spywatcher bot is present
2. Click **"Select"** on the server you want to monitor
3. Confirm your selection

::: info Multiple Servers
You can monitor multiple servers. Switch between them using the server selector in the navigation bar.
:::

## Step 4: Explore the Dashboard

You'll land on the main dashboard showing:

### Overview Cards

- **Total Users**: Number of members in the server
- **Active Users**: Users active in the last 24 hours
- **Ghost Users**: Users with high presence but low participation
- **Lurkers**: Users who rarely engage

### Recent Activity

- Real-time feed of user presence changes
- Message activity trends
- Behavioral alerts

### Quick Actions

- View detailed analytics
- Check ghost detection results
- Review suspicion scores
- Access heatmaps

## Step 5: Run Your First Detection

### Ghost Detection

1. Click **"Ghost Detection"** in the sidebar
2. Set your parameters:
   - **Minimum Presence Count**: 50 (default)
   - **Maximum Message Count**: 10 (default)
3. Click **"Run Detection"**
4. Review the results:
   - Users sorted by "ghost score"
   - Higher scores = more "ghostly" behavior
   - Click any user for detailed analysis

### Suspicion Scoring

1. Navigate to **"Suspicion Scores"**
2. View automatically calculated scores
3. Scores are based on:
   - Presence patterns
   - Message frequency
   - Multi-client usage
   - Behavioral anomalies
4. Click **"Details"** on any user to investigate

## Step 6: Configure Filters

Customize what you see:

1. Click the **Filter** icon in any view
2. Set filter criteria:
   - **Date Range**: Last 7 days, 30 days, or custom
   - **Minimum Activity**: Filter by activity threshold
   - **Role Filter**: Show specific roles only
   - **Status Filter**: Online, offline, or both
3. Click **"Apply Filters"**
4. Save filters as presets for quick access

## Step 7: Enable Real-time Updates

Stay synchronized with live Discord activity:

1. Look for the **WebSocket status** indicator (top-right)
2. When connected, you'll see: 🟢 **Live**
3. Real-time updates include:
   - Presence changes
   - New messages
   - User joins/leaves
   - Status updates

::: warning Connection Issues
If the WebSocket disconnects, the dashboard will attempt to reconnect automatically. Check your network connection if issues persist.
:::

## Step 8: Set Up Alerts (Optional)

Configure notifications for important events:

1. Go to **Settings** > **Alerts**
2. Enable alert types:
   - High suspicion score detected
   - New ghost user identified
   - Unusual multi-client activity
   - Mass user join/leave events
3. Choose notification method:
   - Browser notifications
   - Discord webhook
   - Email (if configured)
4. Save your preferences

## Common First Tasks

### View Server Analytics

```
Dashboard → Analytics → Select Time Range
```

See comprehensive metrics about your server activity.

### Check Heatmap

```
Dashboard → Heatmap → Configure View
```

Visualize activity patterns across time periods and channels.

### Review Timeline

```
Dashboard → Timeline → Select User
```

Track individual user behavior over time.

### Export Data

```
Any View → Export Button → Choose Format (CSV/JSON)
```

Download data for external analysis.

## Navigation Tips

### Sidebar Navigation

- **Dashboard**: Main overview
- **Analytics**: Detailed metrics
- **Ghost Detection**: Find silent users
- **Lurkers**: Identify passive users
- **Suspicion Scores**: Behavior analysis
- **Heatmap**: Activity visualization
- **Timeline**: User history
- **Settings**: Configuration

### Keyboard Shortcuts

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + /`: Show keyboard shortcuts
- `Ctrl/Cmd + B`: Toggle sidebar
- `G then D`: Go to Dashboard
- `G then A`: Go to Analytics
- `G then H`: Go to Heatmap

### Quick Search

Press `Ctrl/Cmd + K` to open quick search:

- Search for users by username or ID
- Jump to any page quickly
- Search help documentation
- Access recent views

## Best Practices

### 1. Start with Default Settings

Don't customize too much initially. Use default detection thresholds to understand typical behavior first.

### 2. Review Weekly

Check ghost detection and suspicion scores weekly to identify trends and patterns.

### 3. Use Filters Strategically

Create filter presets for common views:
- "High Activity Members"
- "Recently Joined"
- "Moderator Activity"

### 4. Monitor Heatmaps

Weekly heatmap review helps identify:
- Peak activity times
- Inactive periods
- Channel usage patterns

### 5. Investigate Before Acting

High suspicion scores don't always mean malicious behavior. Always investigate before taking action.

## What's Next?

Now that you're familiar with the basics:

1. **[Dashboard Overview](./dashboard)** - Learn about all dashboard features
2. **[Ghost Detection](./ghost-detection)** - Deep dive into ghost detection
3. **[Analytics](./analytics)** - Understand all available metrics
4. **[Suspicion Scores](./suspicion-scores)** - Learn the scoring algorithm

## Need Help?

- **[Troubleshooting Guide](./troubleshooting)** - Solve common issues
- **[FAQ](./faq)** - Frequently asked questions
- **[GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues)** - Report bugs

Happy monitoring! 🔍
