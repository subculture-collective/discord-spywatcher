# Screenshots and Visual Guide

Visual walkthrough of Spywatcher's key features with annotated screenshots.

::: info About Screenshots
Screenshots in this guide show Spywatcher's interface and features. All user data in screenshots is anonymized or uses demo data for privacy protection.
:::

## Dashboard Overview

### Main Dashboard

The main dashboard provides an at-a-glance view of your server's health and activity.

**Key Components:**

1. **Navigation Bar** - Access different features and switch servers
2. **Metrics Cards** - Quick stats on users, activity, and security
3. **Activity Feed** - Real-time updates of server events
4. **Quick Actions** - Common tasks and shortcuts

![Dashboard Overview](../images/dashboard-overview.png)

::: tip
Hover over any metric card to see a detailed breakdown and trend information.
:::

### Metrics Cards Explained

**Total Users Card**
- Shows current member count
- Trend indicator (↑ ↓) shows growth/decline
- Click to view user list and details

**Active Users Card**
- Users active in last 24 hours
- Percentage of total user base
- Breakdown by activity type (messages, voice, presence)

**Ghost Users Card**
- Detected ghost accounts
- Risk level indicator
- Click for detailed ghost analysis

**Suspicion Score Card**
- Overall server security rating (0-100)
- Color-coded by risk level
- Click for suspicious users list

![Metrics Cards](../images/metrics-cards.png)

## Analytics Features

### Activity Charts

Track server activity over time with interactive charts.

**Features:**
- Multiple chart types (line, bar, area)
- Customizable date ranges
- Export functionality
- Drill-down capabilities

![Activity Charts](../images/activity-charts.png)

**Chart Controls:**
1. **Date Range Selector** - Choose time period to analyze
2. **Chart Type Toggle** - Switch between visualization types
3. **Export Button** - Download data as CSV/PNG
4. **Filter Panel** - Apply filters to data

### Heatmap Visualization

See when your server is most active with the activity heatmap.

![Activity Heatmap](../images/heatmap.png)

**Reading the Heatmap:**
- **X-axis**: Time of day (24-hour format)
- **Y-axis**: Day of week
- **Color Intensity**: Activity level
  - Light colors = Low activity
  - Dark colors = High activity
- **Hover**: See exact numbers

**Use Cases:**
- Find optimal times for events
- Plan moderation coverage
- Identify unusual activity patterns

### User Timeline

Track individual user behavior over time with detailed timelines.

![User Timeline](../images/user-timeline.png)

**Timeline Events:**
- 🟢 **Online** - User came online
- ⚫ **Offline** - User went offline
- 💬 **Message** - User sent a message
- 🏷️ **Role Change** - Role added or removed
- 🎤 **Voice** - Joined/left voice channel
- 💻 **Client Change** - Different device/platform

**Timeline Controls:**
1. **Zoom Controls** - Adjust time scale
2. **Filter Events** - Show/hide event types
3. **Export Timeline** - Save as image or CSV
4. **Compare Users** - View multiple timelines

## Ghost Detection

### Ghost Users List

View and manage detected ghost accounts.

![Ghost Detection](../images/ghost-detection.png)

**List Columns:**
- **Username** - User's Discord name
- **Presence Time** - Hours online
- **Message Count** - Total messages sent
- **Ghost Score** - Confidence level (0-100)
- **Status** - Investigation status
- **Actions** - Quick action buttons

**Actions:**
- 🔍 **Investigate** - View detailed analysis
- ✅ **Clear** - Mark as false positive
- 🚫 **Ban** - Remove from server
- 👁️ **Monitor** - Add to watch list

### Ghost Detail View

Detailed analysis of a specific ghost account.

![Ghost Detail](../images/ghost-detail.png)

**Analysis Sections:**
1. **Presence Pattern** - When they're online
2. **Activity History** - What they've done
3. **Client Information** - Devices used
4. **Behavioral Indicators** - Red flags
5. **Similar Accounts** - Related ghosts
6. **Recommended Action** - System suggestion

## Suspicion Scores

### Suspicion Dashboard

Monitor users with unusual behavior patterns.

![Suspicion Dashboard](../images/suspicion-dashboard.png)

**Risk Levels:**
- 🟢 **Low (0-20)** - Normal behavior
- 🟡 **Moderate (21-40)** - Minor anomalies
- 🟠 **Elevated (41-60)** - Worth investigating
- 🔴 **High (61-80)** - Review immediately
- 🚨 **Critical (81-100)** - Take action now

### Score Breakdown

Understand what contributes to a suspicion score.

![Score Breakdown](../images/score-breakdown.png)

**Score Components:**
- **Activity Anomalies** (25%) - Unusual patterns
- **Client Behavior** (20%) - Device/platform usage
- **Presence Patterns** (20%) - Online/offline cycles
- **Interaction Metrics** (20%) - Engagement level
- **Historical Changes** (15%) - Behavior shifts

## Filters and Search

### Advanced Filter Interface

Find exactly what you're looking for with powerful filters.

![Filter Interface](../images/filters.png)

**Filter Types:**
- **User Filters** - Name, role, join date
- **Activity Filters** - Message count, presence
- **Behavior Filters** - Ghost status, suspicion
- **Time Filters** - Date ranges, specific periods

**Example Filters:**
```
# High suspicion users
suspicion:>70

# Recent ghosts
is:ghost AND joined:>2024-01-01

# Inactive moderators
role:moderator AND messages:<10
```

### Search Results

View and interact with search results.

![Search Results](../images/search-results.png)

**Features:**
- **Sort Options** - By relevance, date, score
- **Bulk Actions** - Act on multiple results
- **Export Results** - Save filtered data
- **Save Filter** - Reuse common searches

## Settings and Configuration

### General Settings

Customize Spywatcher to your needs.

![General Settings](../images/settings-general.png)

**Setting Categories:**
- **Appearance** - Theme, language, layout
- **Notifications** - Alert preferences
- **Privacy** - Data collection settings
- **Integration** - External services
- **Advanced** - Developer options

### User Management

Manage who can access Spywatcher features.

![User Management](../images/user-management.png)

**User Roles:**
- **Owner** - Full access to everything
- **Admin** - Full access except ownership transfer
- **Moderator** - View and export data
- **Viewer** - Read-only access

**Permission Matrix:**

| Feature | Owner | Admin | Moderator | Viewer |
|---------|-------|-------|-----------|--------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Analytics | ✅ | ✅ | ✅ | ✅ |
| Export Data | ✅ | ✅ | ✅ | ❌ |
| Manage Bans | ✅ | ✅ | ⚠️ | ❌ |
| Change Settings | ✅ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ⚠️ | ❌ | ❌ |

## Mobile Interface

### Mobile Dashboard

Spywatcher is fully responsive on mobile devices.

![Mobile Dashboard](../images/mobile-dashboard.png)

**Mobile Features:**
- **Touch Optimized** - Swipe and tap gestures
- **Responsive Layout** - Adapts to screen size
- **Mobile Navigation** - Burger menu and tabs
- **Quick Actions** - Essential functions accessible

### Mobile Charts

Charts adapt for mobile viewing.

![Mobile Charts](../images/mobile-charts.png)

**Mobile Optimizations:**
- Simplified chart types
- Touch-friendly controls
- Horizontal scrolling for timelines
- Simplified data presentation

## Dark Mode

### Dark Theme

Spywatcher includes a full dark mode for comfortable viewing.

![Dark Mode Dashboard](../images/dark-mode.png)

**Theme Options:**
- **Light** - Bright, high contrast
- **Dark** - Easy on the eyes
- **Auto** - Matches system preference

**Toggle Theme:**
1. Click profile icon
2. Select Settings
3. Choose Appearance
4. Select theme preference

## Export Options

### Export Dialog

Export data in multiple formats for external analysis.

![Export Dialog](../images/export-dialog.png)

**Export Formats:**
- **CSV** - Spreadsheet compatible
- **JSON** - Programmatic access
- **PDF** - Printable reports
- **Excel** - Advanced spreadsheets (Pro)

**Export Options:**
- Date range selection
- Include/exclude columns
- Format preferences
- Compression (for large exports)

## Real-time Updates

### Live Activity Feed

See server activity as it happens.

![Live Feed](../images/live-feed.png)

**Real-time Features:**
- **Presence Updates** - Online/offline changes
- **Message Events** - New messages (count only)
- **Role Changes** - Role assignments
- **Join/Leave Events** - Member changes
- **System Events** - Bans, warnings, etc.

**Feed Controls:**
- **Pause/Resume** - Stop/start live updates
- **Filter Events** - Show only specific types
- **Auto-scroll** - Follow latest events
- **Sound Alerts** - Audio notifications

## Plugin Interface

### Plugin Management

Install and configure plugins to extend functionality.

![Plugin Management](../images/plugin-management.png)

**Plugin Card:**
- **Plugin Name** - Identifier
- **Status** - Active/Inactive
- **Version** - Current version
- **Controls** - Enable/disable, configure

**Plugin Actions:**
- **Install** - Add new plugin
- **Configure** - Set plugin options
- **Enable/Disable** - Toggle functionality
- **Update** - Get latest version
- **Remove** - Uninstall plugin

---

## Screenshot Placeholder Notes

::: warning Note for Documentation Maintainers
This guide contains placeholder image references. To complete this documentation:

1. **Take Screenshots**
   - Run Spywatcher locally
   - Use demo/anonymized data
   - Capture at 1920x1080 resolution
   - Use consistent browser width

2. **Add Annotations**
   - Use tools like Snagit or Skitch
   - Add arrows, boxes, and labels
   - Keep annotations consistent
   - Use theme colors

3. **Save Images**
   - Location: `docs/images/`
   - Format: PNG (for quality)
   - Names match references in this file
   - Optimize file size (< 500KB each)

4. **Update This File**
   - Remove this warning block
   - Verify all image paths
   - Test image display in docs

**Priority Screenshots:**
1. Dashboard overview (main page)
2. Analytics charts
3. Ghost detection list
4. Suspicion score breakdown
5. Heatmap visualization
6. Settings interface
:::

---

::: tip Pro Tip
Screenshots are taken with demo data to protect user privacy. Your actual dashboard will show your server's real data.
:::

*Last updated: November 2024*
