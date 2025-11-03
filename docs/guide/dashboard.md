# Dashboard Overview

The Spywatcher dashboard is your central hub for monitoring Discord server activity and accessing analytics.

## Dashboard Layout

### Header

- **Server Selector**: Switch between monitored servers
- **User Menu**: Access settings and logout
- **Notifications**: View alerts and updates
- **Search**: Quick search for users and data

### Sidebar Navigation

- Dashboard (Home)
- Analytics
- Ghost Detection
- Lurker Detection
- Suspicion Scores
- Heatmap
- Timeline
- Settings

### Main Content Area

The dashboard displays real-time overview cards and activity feeds.

## Overview Cards

### Total Users

Shows the total number of members in the selected server.

- **Metric**: Total member count
- **Update Frequency**: Real-time
- **Click Action**: View detailed user list

### Active Users

Members who have been online in the last 24 hours.

- **Metric**: Active user count
- **Trend Indicator**: Compared to previous 24h
- **Click Action**: View active user list

### Ghost Users

Users with high presence but low message activity.

- **Metric**: Current ghost user count
- **Threshold**: Based on your settings
- **Click Action**: Open ghost detection view

### Lurkers

Passive users who rarely engage.

- **Metric**: Identified lurker count
- **Score Range**: Based on activity thresholds
- **Click Action**: View lurker analysis

### Suspicion Score Average

Average suspicion score across all monitored users.

- **Metric**: Mean suspicion score
- **Range**: 0-100
- **Trend**: Compared to previous period

## Recent Activity Feed

### Presence Changes

Real-time feed of user status changes:
- User went online
- User went offline
- Status updates
- Multi-client detection

### Message Activity

Recent message activity indicators:
- Message count trends
- Channel activity spikes
- Unusual messaging patterns

### Behavioral Alerts

Automated alerts for:
- High suspicion scores
- Ghost user detected
- Unusual multi-client activity
- Mass user join/leave

## Quick Actions

### Run Detection

- Ghost Detection Scan
- Lurker Detection Scan
- Full Analytics Refresh

### Export Data

- Export current view to CSV
- Download analytics report
- Generate PDF summary

### Manage Filters

- Create filter preset
- Load saved filters
- Reset to defaults

## Real-time Updates

The dashboard uses WebSocket connections for live updates:

- 🟢 **Connected**: Real-time updates active
- 🟡 **Connecting**: Attempting to connect
- 🔴 **Disconnected**: No real-time updates

## Customization

### Widget Layout

Drag and drop widgets to customize your dashboard layout.

### Card Settings

Click the settings icon on any card to:
- Toggle visibility
- Adjust refresh rate
- Configure thresholds
- Set alert preferences

### Theme

Switch between light and dark mode using the theme toggle.

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + B`: Toggle sidebar
- `G then D`: Go to Dashboard
- `G then A`: Go to Analytics
- `R`: Refresh current view

## Mobile View

The dashboard is fully responsive and optimized for mobile devices:
- Collapsible sidebar
- Touch-optimized controls
- Simplified card layout
- Swipe gestures for navigation

## Related Features

- [Analytics](./analytics) - Detailed metrics and trends
- [Ghost Detection](./ghost-detection) - Find silent users
- [Heatmap](./heatmap) - Visual activity patterns

::: tip Pro Tip
Customize your dashboard layout to focus on the metrics most important to your server's needs.
:::
