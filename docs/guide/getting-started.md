# Getting Started with Spywatcher

Welcome to Spywatcher! This comprehensive guide will walk you through everything you need to know to get started with monitoring and analyzing your Discord server.

## What You'll Learn

In this guide, you'll learn how to:
- Set up Spywatcher for the first time
- Connect your Discord account
- Select and configure servers to monitor
- Navigate the dashboard
- Understand basic analytics
- Access help and support

## Before You Begin

### What is Spywatcher?

Spywatcher is a powerful Discord surveillance and analytics platform that helps you:
- **Monitor User Behavior**: Track presence patterns, activity levels, and engagement
- **Detect Unusual Patterns**: Identify ghost accounts, lurkers, and suspicious behavior
- **Visualize Data**: See server activity through interactive charts, heatmaps, and timelines
- **Make Informed Decisions**: Use data-driven insights to manage your community

### Prerequisites

Before getting started, ensure you have:

- ✅ A Discord account with server management permissions
- ✅ A Discord server where you want to use Spywatcher
- ✅ The Spywatcher bot added to your server
- ✅ Access to the Spywatcher web dashboard

::: tip New to Discord Bots?
If you haven't added the Spywatcher bot to your server yet, check the [Installation Guide](./installation) for step-by-step instructions.
:::

## Step 1: Access the Dashboard

### Opening Spywatcher

1. Open your web browser (Chrome, Firefox, Safari, or Edge)
2. Navigate to your Spywatcher instance:
   - **Local Installation**: `http://localhost:5173`
   - **Hosted Instance**: Your organization's Spywatcher URL

3. You should see the Spywatcher login page with the Discord logo

::: info Browser Compatibility
Spywatcher works best in modern browsers with JavaScript enabled. For the best experience, use the latest version of Chrome, Firefox, or Edge.
:::

### Understanding the Login Page

The login page displays:
- **Spywatcher Logo**: Confirms you're on the correct site
- **"Sign in with Discord" Button**: Your entry point to the application
- **Privacy Policy Link**: Information about data handling
- **Terms of Service**: Usage guidelines

## Step 2: Authenticate with Discord

### Initial Sign-In

1. Click the **"Sign in with Discord"** button
2. If you're not already logged into Discord, enter your Discord credentials
3. Review the permissions Spywatcher is requesting

### Understanding Permission Requests

Spywatcher requests the following permissions:

| Permission | Purpose | Required |
|------------|---------|----------|
| **Identify** | Access your username and avatar | ✅ Yes |
| **Guilds** | View servers you're a member of | ✅ Yes |
| **Email** | Account verification and notifications | ⚠️ Optional |

::: warning Important
Spywatcher only requests the minimum permissions needed to function. We never access your private messages or perform actions without your consent.
:::

### Authorizing the Application

1. Review the requested permissions carefully
2. Click **"Authorize"** to grant access
3. Complete any 2FA challenges if enabled on your Discord account
4. Wait for the redirect back to Spywatcher

::: tip First-Time Users
The first time you authorize Spywatcher, Discord will ask you to confirm. This is normal and only happens once.
:::

## Step 3: Select Your Server

### Server Selection Interface

After authentication, you'll see the Guild Selection page displaying:

- **Available Servers**: All Discord servers where the Spywatcher bot is present
- **Server Icons**: Visual identification of each server
- **Member Counts**: Quick overview of server size
- **"Select" Button**: Choose which server to monitor

### Choosing a Server

1. Browse the list of available servers
2. Look for the server you want to monitor
3. Check that the bot has the necessary permissions (indicated by a green checkmark)
4. Click **"Select"** next to your chosen server

::: info Multiple Servers
You can monitor multiple servers! After selecting your first server, you can switch between servers using the dropdown menu in the navigation bar.
:::

### Server Requirements

For Spywatcher to work properly, the bot needs:

- ✅ **View Channels** permission
- ✅ **Read Message History** permission
- ✅ **View Server Insights** permission
- ✅ **Presence Intent** enabled in Developer Portal

::: danger Bot Not Listed?
If your server isn't showing up, make sure:
1. The Spywatcher bot is added to your server
2. The bot is online (check Discord)
3. You have appropriate permissions in the server
4. Privileged intents are enabled in Discord Developer Portal
:::

## Step 4: Explore the Dashboard

### Dashboard Overview

After selecting a server, you'll land on the main dashboard. Here's what you'll see:

#### Navigation Bar (Top)
- **Spywatcher Logo**: Click to return to dashboard
- **Server Selector**: Switch between different servers
- **Main Menu**: Access different features (Analytics, Bans, Settings)
- **User Profile**: View your account and sign out

#### Key Metrics (Cards)
- **Total Users**: Current server member count
- **Active Users**: Users online in the last 24 hours
- **Ghost Users**: Detected inactive accounts
- **Suspicion Score**: Overall server security rating

#### Quick Actions
- **View Analytics**: Deep dive into server data
- **Check Suspicion**: Review flagged users
- **Manage Bans**: Handle banned users
- **Configure Settings**: Customize Spywatcher

#### Real-Time Activity
- **Live Feed**: Recent user activity
- **Presence Updates**: Who's coming online/offline
- **New Detections**: Recently identified patterns

### Understanding the Metrics

Let's break down what each metric means:

**Total Users**
- Includes all server members
- Updates in real-time
- Hover for breakdown by role

**Active Users**
- Users who were online in the last 24 hours
- Includes all activity types (messages, voice, presence)
- Click to view detailed activity breakdown

**Ghost Users**
- Accounts that are online but never interact
- Potential bot accounts or lurkers
- Click to view the full ghost detection report

**Suspicion Score**
- Calculated from 0 (safe) to 100 (high risk)
- Based on multiple behavior factors
- Updates continuously with new data

::: tip Dashboard Tips
- Hover over any metric to see more details
- Click on cards to drill down into specific data
- Use the date range selector to view historical data
- Enable auto-refresh for real-time monitoring
:::

## Step 5: Navigate Key Features

### Analytics Page

Access comprehensive analytics:

1. Click **"Analytics"** in the navigation menu
2. Choose from available views:
   - **Overview**: High-level summary
   - **Ghosts**: Detailed ghost detection
   - **Lurkers**: Passive user analysis
   - **Heatmap**: Activity visualization
   - **Timeline**: Historical trends

### Suspicion Detection

Review potentially problematic users:

1. Click **"Suspicion"** in the menu
2. View users sorted by suspicion score
3. Click on a user for detailed analysis
4. Take action if needed (investigate, ban, clear)

### User Timeline

Track individual user behavior:

1. Click on any username in the application
2. View their complete activity history
3. See presence patterns over time
4. Review messages and interactions
5. Check for behavioral anomalies

## Step 6: Customize Your Experience

### Dashboard Settings

Personalize your dashboard:

1. Click your profile icon in the top-right
2. Select **"Settings"**
3. Configure:
   - **Theme**: Light, dark, or auto
   - **Language**: Choose your preferred language
   - **Notifications**: Set up alerts
   - **Privacy**: Control data visibility
   - **Auto-refresh**: Enable real-time updates

### Notification Preferences

Set up alerts for important events:

- **Ghost Detection**: Alert when new ghosts are found
- **High Suspicion**: Notify for suspicious behavior
- **Ban Events**: Updates on server bans
- **System Alerts**: Important application updates

### Privacy Controls

Manage what data is visible:

- **Show Usernames**: Display or hide user identities
- **Activity Details**: Control detail level
- **Export Data**: Download your analytics
- **Data Retention**: Configure storage duration

## Common First-Time Questions

### "Why aren't I seeing any data?"

Data collection starts when the bot is added to your server. If you just installed Spywatcher:
- Wait 24 hours for initial data collection
- Ensure the bot is online
- Check that required permissions are granted
- Verify privileged intents are enabled

### "Can other users see this data?"

Access control is based on Discord roles:
- **Server Owners**: Full access
- **Administrators**: Full access
- **Moderators**: View-only (configurable)
- **Regular Users**: No access

You can configure these permissions in Settings → Permissions.

### "How often does data update?"

- **Real-time**: Presence changes, messages (with WebSocket)
- **Every 5 minutes**: Analytics recalculation
- **Every hour**: Ghost detection, suspicion scores
- **Daily**: Historical aggregations, reports

### "Is this collecting private messages?"

No. Spywatcher only monitors:
- ✅ User presence (online/offline status)
- ✅ Server activity (messages in server channels)
- ✅ Role changes and server events
- ❌ Private/Direct messages (never collected)
- ❌ Message content (optional, can be disabled)

## Next Steps

Now that you're set up, here's what to explore next:

### Learn the Core Features
- 📊 [Dashboard Overview](./dashboard) - Master the main interface
- 🔍 [Ghost Detection](./ghost-detection) - Find inactive accounts
- 📈 [Analytics](./analytics) - Deep dive into server data
- 🎯 [Suspicion Scores](./suspicion-scores) - Understand behavior ratings

### Explore Advanced Features
- 🗺️ [Heatmap Visualization](./heatmap) - See activity patterns
- ⏱️ [Timeline Analysis](./timeline) - Track changes over time
- 🔧 [Filters and Search](./filters) - Find specific data
- 🎨 [Advanced Charts](./advanced-charts) - Custom visualizations

### Get Help
- 💡 [FAQ](./faq) - Frequently asked questions
- 🔧 [Troubleshooting](./troubleshooting) - Common issues
- 🐛 [Report Issues](https://github.com/subculture-collective/discord-spywatcher/issues) - Found a bug?

## Quick Reference Card

### Essential Shortcuts

| Action | Shortcut |
|--------|----------|
| Open search | `Ctrl+K` or `Cmd+K` |
| Navigate to dashboard | `G` then `D` |
| Navigate to analytics | `G` then `A` |
| Open help | `?` |
| Toggle theme | `Ctrl+Shift+T` |

### Important Links

- **Dashboard**: Your main control panel
- **Analytics**: Deep data insights
- **Settings**: Customize your experience
- **Help**: This guide and more

::: tip Success!
Congratulations! You're now ready to use Spywatcher effectively. Remember, the more you use it, the more valuable insights you'll gain about your Discord community.
:::

## Need More Help?

If you need additional assistance:

1. Check the [Troubleshooting Guide](./troubleshooting)
2. Read the [FAQ](./faq)
3. Visit our [GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues)
4. Consult the [Admin Guide](/admin/) for advanced topics

Happy monitoring! 🔍
