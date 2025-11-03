# Video Tutorials

Learn Spywatcher through our comprehensive video tutorial series. Each tutorial is designed to help you master specific features and workflows.

::: info Video Tutorial Library
This page contains embedded video tutorials and step-by-step guides. Videos are hosted on YouTube and can be watched at your own pace.
:::

## Quick Start Series

### Tutorial 1: Installing and Setting Up Spywatcher

**Duration**: 8 minutes | **Difficulty**: Beginner

Learn how to install Spywatcher from scratch and get it running on your system.

**What You'll Learn:**
- Prerequisites and system requirements
- Installing with Docker (recommended method)
- Manual installation process
- Creating a Discord bot application
- Configuring environment variables
- First-time startup and verification

**Video Tutorial:**

::: details Video Coming Soon
📹 **Video Placeholder**: Installation and Setup Tutorial

**Topics Covered:**
1. 00:00 - Introduction and prerequisites
2. 01:00 - Creating Discord bot application
3. 02:30 - Cloning the repository
4. 03:00 - Docker installation method
5. 05:00 - Manual installation method
6. 06:30 - Environment configuration
7. 07:30 - First startup and verification

**Watch on YouTube**: [Link to be added]
:::

**Step-by-Step Guide:**

1. **Prerequisites Check**
   ```bash
   # Check Node.js version
   node --version  # Should be 18+
   
   # Check Docker (if using Docker method)
   docker --version
   docker-compose --version
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/subculture-collective/discord-spywatcher.git
   cd discord-spywatcher
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start Services**
   ```bash
   # Using Docker
   docker-compose -f docker-compose.dev.yml up
   
   # Or manual setup
   cd backend && npm install && npm run dev
   cd frontend && npm install && npm run dev
   ```

**Resources:**
- [Full Installation Guide](./installation)
- [Discord Bot Setup Guide](./oauth-setup)
- [Troubleshooting Installation Issues](./troubleshooting#installation-issues)

---

### Tutorial 2: First Login and Dashboard Tour

**Duration**: 10 minutes | **Difficulty**: Beginner

Walk through your first login and explore the Spywatcher dashboard.

**What You'll Learn:**
- Authenticating with Discord OAuth
- Understanding the dashboard layout
- Reading key metrics
- Navigating the interface
- Accessing different features
- Customizing your view

**Video Tutorial:**

::: details Video Coming Soon
📹 **Video Placeholder**: Dashboard Tour

**Topics Covered:**
1. 00:00 - Accessing the login page
2. 01:00 - Discord OAuth authentication
3. 02:00 - Server selection process
4. 03:00 - Dashboard overview
5. 04:30 - Understanding key metrics
6. 06:00 - Navigation bar and menus
7. 07:30 - Quick actions and shortcuts
8. 09:00 - Customizing your dashboard

**Watch on YouTube**: [Link to be added]
:::

**Key Features Covered:**

- **Navigation Bar**: Top menu with all main sections
- **Metrics Cards**: Total users, active users, ghosts, suspicion scores
- **Quick Actions**: Fast access to common tasks
- **Real-Time Feed**: Live activity updates
- **User Profile**: Account settings and preferences

**Interactive Elements:**
- Hover over metrics for detailed breakdowns
- Click cards to drill down into specific data
- Use the server selector to switch between servers
- Access settings from your profile menu

**Resources:**
- [Dashboard Overview Guide](./dashboard)
- [Understanding Metrics](./analytics)

---

### Tutorial 3: Understanding Ghost Detection

**Duration**: 12 minutes | **Difficulty**: Beginner to Intermediate

Learn how Spywatcher identifies and analyzes ghost accounts on your server.

**What You'll Learn:**
- What are ghost accounts
- How detection algorithms work
- Reading ghost reports
- Investigating suspicious accounts
- Taking appropriate action
- Adjusting detection sensitivity

**Video Tutorial:**

::: details Video Coming Soon
📹 **Video Placeholder**: Ghost Detection Deep Dive

**Topics Covered:**
1. 00:00 - Introduction to ghost accounts
2. 01:30 - How detection works
3. 03:00 - Accessing ghost reports
4. 04:00 - Understanding the ghost list
5. 05:30 - Analyzing individual ghosts
6. 07:00 - Activity patterns and indicators
7. 08:30 - Taking action on ghosts
8. 10:00 - Adjusting sensitivity settings
9. 11:00 - Best practices

**Watch on YouTube**: [Link to be added]
:::

**Detection Criteria:**

Ghost accounts are identified based on:
- **Presence Time**: Online frequency and duration
- **Message Activity**: Low or zero message count
- **Interaction Patterns**: Lack of engagement with community
- **Client Types**: Suspicious client combinations
- **Behavioral Patterns**: Unusual activity times

**Taking Action:**

1. **Investigation**
   - Review user timeline
   - Check message history
   - Analyze presence patterns
   - Review role changes

2. **Response Options**
   - Monitor: Continue watching
   - Contact: Reach out to user
   - Ban: Remove from server
   - Clear: Mark as false positive

**Resources:**
- [Complete Ghost Detection Guide](./ghost-detection)
- [Suspicion Scores Explained](./suspicion-scores)

---

## Analytics Series

### Tutorial 4: Using Analytics and Visualizations

**Duration**: 15 minutes | **Difficulty**: Intermediate

Master Spywatcher's analytics features and data visualizations.

**What You'll Learn:**
- Navigating the analytics dashboard
- Understanding different chart types
- Using heatmaps effectively
- Applying filters and date ranges
- Exporting data and reports
- Creating custom views

**Video Tutorial:**

::: details Video Coming Soon
📹 **Video Placeholder**: Analytics Masterclass

**Topics Covered:**
1. 00:00 - Analytics dashboard overview
2. 01:30 - Activity charts and trends
3. 03:00 - Heatmap visualization
4. 05:00 - Timeline analysis
5. 07:00 - Role distribution analytics
6. 08:30 - Client type analysis
7. 10:00 - Filtering and searching data
8. 11:30 - Date range selection
9. 13:00 - Exporting reports
10. 14:00 - Advanced tips and tricks

**Watch on YouTube**: [Link to be added]
:::

**Chart Types:**

| Chart Type | Best For | Use Case |
|------------|----------|----------|
| **Line Charts** | Trends over time | Activity patterns, growth |
| **Bar Charts** | Comparisons | User counts, role distribution |
| **Pie Charts** | Proportions | Client types, role percentages |
| **Heatmaps** | Activity patterns | Peak hours, day-of-week activity |
| **Timelines** | Individual tracking | User behavior history |

**Practical Examples:**

1. **Finding Peak Activity Times**
   - Open Heatmap view
   - Select last 30 days
   - Identify high-activity periods
   - Schedule announcements accordingly

2. **Tracking Growth**
   - Open Analytics dashboard
   - View user count chart
   - Set date range to last 6 months
   - Identify growth trends

3. **Analyzing Role Distribution**
   - Navigate to Role Analytics
   - View pie chart breakdown
   - Check for role imbalances
   - Adjust server structure if needed

**Resources:**
- [Analytics Guide](./analytics)
- [Heatmap Documentation](./heatmap)
- [Advanced Charts Guide](./advanced-charts)

---

### Tutorial 5: Suspicion Scores and Behavioral Analysis

**Duration**: 13 minutes | **Difficulty**: Intermediate

Learn how to interpret and act on suspicion scores and behavioral alerts.

**What You'll Learn:**
- How suspicion scores are calculated
- Understanding score components
- Investigating high-risk users
- Differentiating false positives
- Taking appropriate actions
- Configuring alert thresholds

**Video Tutorial:**

::: details Video Coming Soon
📹 **Video Placeholder**: Suspicion Scores Explained

**Topics Covered:**
1. 00:00 - Introduction to suspicion scoring
2. 01:30 - Score calculation methodology
3. 03:00 - Score components breakdown
4. 04:30 - Accessing suspicion reports
5. 06:00 - Investigating high-risk users
6. 07:30 - Common patterns and red flags
7. 09:00 - False positive identification
8. 10:30 - Taking action on alerts
9. 11:30 - Configuring thresholds
10. 12:30 - Best practices

**Watch on YouTube**: [Link to be added]
:::

**Score Components:**

Suspicion scores (0-100) are calculated from:

- **Activity Anomalies** (25%): Unusual activity patterns
- **Client Behavior** (20%): Suspicious client usage
- **Presence Patterns** (20%): Irregular online/offline cycles
- **Interaction Metrics** (20%): Message and engagement patterns
- **Historical Behavior** (15%): Changes from baseline

**Risk Levels:**

| Score Range | Risk Level | Recommended Action |
|-------------|------------|-------------------|
| 0-20 | **Low** 🟢 | Normal user, no action needed |
| 21-40 | **Moderate** 🟡 | Monitor activity |
| 41-60 | **Elevated** 🟠 | Investigate further |
| 61-80 | **High** 🔴 | Review immediately |
| 81-100 | **Critical** 🚨 | Take immediate action |

**Investigation Workflow:**

1. **Review Score Details**
   - Click on user in suspicion list
   - Review score breakdown
   - Check contributing factors

2. **Examine Activity**
   - View user timeline
   - Check message history
   - Analyze presence patterns
   - Review role changes

3. **Make Decision**
   - False positive: Clear alert
   - Legitimate concern: Monitor or ban
   - Unclear: Flag for team review

**Resources:**
- [Suspicion Scores Guide](./suspicion-scores)
- [User Timeline Analysis](./timeline)

---

## Advanced Features Series

### Tutorial 6: Timeline Analysis and User Tracking

**Duration**: 11 minutes | **Difficulty**: Intermediate to Advanced

Deep dive into tracking individual user behavior over time.

**What You'll Learn:**
- Accessing user timelines
- Understanding timeline events
- Identifying behavior patterns
- Correlating multiple users
- Detecting coordinated activity
- Using timeline filters

**Video Tutorial:**

::: details Video Coming Soon
📹 **Video Placeholder**: Timeline Analysis Tutorial

**Topics Covered:**
1. 00:00 - Introduction to timelines
2. 01:00 - Accessing user timelines
3. 02:00 - Timeline interface overview
4. 03:30 - Event types and indicators
5. 05:00 - Filtering timeline data
6. 06:30 - Identifying patterns
7. 08:00 - Multi-user comparison
8. 09:30 - Detecting coordinated activity
9. 10:30 - Exporting timeline data

**Watch on YouTube**: [Link to be added]
:::

**Timeline Events:**

| Event Type | Icon | Description |
|------------|------|-------------|
| **Presence Change** | 🟢/⚫ | User online/offline |
| **Message Activity** | 💬 | Message sent |
| **Role Change** | 🏷️ | Role added/removed |
| **Voice Activity** | 🎤 | Joined/left voice |
| **Ban Event** | 🚫 | User banned/unbanned |
| **Client Change** | 💻 | Different client detected |

**Analysis Techniques:**

1. **Pattern Recognition**
   - Look for regular cycles
   - Identify unusual spikes
   - Check activity gaps
   - Compare to normal behavior

2. **Anomaly Detection**
   - Sudden behavior changes
   - Unusual access times
   - Client switching patterns
   - Coordinated timing

3. **Correlation Analysis**
   - Compare multiple users
   - Find related activity
   - Identify groups
   - Detect coordination

**Resources:**
- [Timeline Analysis Guide](./timeline)
- [User Tracking Best Practices](./analytics)

---

### Tutorial 7: Advanced Filtering and Search

**Duration**: 9 minutes | **Difficulty**: Intermediate

Master advanced filtering techniques to find exactly what you're looking for.

**What You'll Learn:**
- Using basic and advanced filters
- Creating complex filter queries
- Saving filter presets
- Search syntax and operators
- Combining multiple filters
- Filter performance tips

**Video Tutorial:**

::: details Video Coming Soon
📹 **Video Placeholder**: Advanced Filtering Tutorial

**Topics Covered:**
1. 00:00 - Filter basics
2. 01:00 - Filter interface overview
3. 02:00 - Common filter patterns
4. 03:30 - Advanced search syntax
5. 05:00 - Combining multiple filters
6. 06:00 - Saving filter presets
7. 07:00 - Performance optimization
8. 08:00 - Real-world examples

**Watch on YouTube**: [Link to be added]
:::

**Filter Types:**

- **User Filters**: Username, roles, join date
- **Activity Filters**: Message count, presence time
- **Behavior Filters**: Suspicion score, ghost status
- **Time Filters**: Date ranges, specific periods
- **Client Filters**: Device types, client combinations

**Search Operators:**

```
# Basic search
username:john

# Exact match
username:"John Doe"

# Greater than / less than
messages:>100
suspicion:<50

# Date ranges
joined:2024-01-01..2024-12-31

# Multiple conditions (AND)
username:john AND suspicion:>60

# Either condition (OR)
role:moderator OR role:admin

# Negation (NOT)
NOT banned:true

# Complex queries
(role:member AND messages:<10) OR suspicion:>70
```

**Resources:**
- [Complete Filters Guide](./filters)
- [Search Reference](./analytics)

---

### Tutorial 8: Plugin System and Extensions

**Duration**: 14 minutes | **Difficulty**: Advanced

Learn to extend Spywatcher's functionality with the plugin system.

**What You'll Learn:**
- Understanding the plugin system
- Installing existing plugins
- Configuring plugin settings
- Managing plugin permissions
- Creating simple plugins
- Troubleshooting plugin issues

**Video Tutorial:**

::: details Video Coming Soon
📹 **Video Placeholder**: Plugin System Tutorial

**Topics Covered:**
1. 00:00 - Plugin system introduction
2. 01:30 - Finding and installing plugins
3. 03:00 - Plugin management interface
4. 04:30 - Configuring plugins
5. 06:00 - Permission management
6. 07:30 - Plugin templates overview
7. 09:00 - Creating a simple plugin
8. 11:00 - Testing and debugging
9. 12:30 - Publishing plugins

**Watch on YouTube**: [Link to be added]
:::

**Available Plugins:**

1. **Message Logger**
   - Logs all messages to file
   - Searchable message archive
   - Configurable retention period

2. **Analytics Extension**
   - Custom analytics endpoints
   - Additional chart types
   - Export capabilities

3. **Webhook Notifier**
   - Send alerts to webhooks
   - External integrations
   - Custom notification rules

**Creating a Plugin:**

```javascript
// Simple plugin example
module.exports = {
  name: 'my-plugin',
  version: '1.0.0',
  
  async initialize(context) {
    console.log('Plugin initialized!');
  },
  
  async onMessage(message) {
    // Handle Discord messages
  }
};
```

**Resources:**
- [Plugin System Guide](./plugins)
- [Plugin Development](../developer/plugin-development)
- [Plugin Template](https://github.com/subculture-collective/discord-spywatcher/tree/main/backend/plugins/template)

---

## Troubleshooting Series

### Tutorial 9: Common Issues and Solutions

**Duration**: 10 minutes | **Difficulty**: Beginner

Learn to diagnose and fix common Spywatcher issues.

**What You'll Learn:**
- Diagnosing connection issues
- Fixing authentication problems
- Resolving data display issues
- Performance troubleshooting
- Error message interpretation
- When to seek help

**Video Tutorial:**

::: details Video Coming Soon
📹 **Video Placeholder**: Troubleshooting Guide

**Topics Covered:**
1. 00:00 - Introduction to troubleshooting
2. 01:00 - Connection issues
3. 02:30 - Authentication problems
4. 04:00 - Bot connection issues
5. 05:30 - Data not appearing
6. 07:00 - Performance problems
7. 08:00 - Error messages
8. 09:00 - Getting help

**Watch on YouTube**: [Link to be added]
:::

**Common Issues:**

| Issue | Quick Fix |
|-------|-----------|
| **Can't log in** | Clear cookies, check OAuth settings |
| **No data showing** | Verify bot is online, check permissions |
| **Bot offline** | Check token, restart bot service |
| **Slow dashboard** | Clear cache, check network |
| **Missing features** | Update to latest version |

**Diagnostic Checklist:**

```bash
# Check bot status
curl http://localhost:3001/api/health

# Verify database connection
docker-compose ps

# Check logs
docker-compose logs backend
docker-compose logs frontend

# Test authentication
curl http://localhost:3001/api/auth/me
```

**Resources:**
- [Full Troubleshooting Guide](./troubleshooting)
- [FAQ](./faq)
- [GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues)

---

## Tutorial Playlists

### Complete Beginner Series
Perfect if you're new to Spywatcher:
1. Tutorial 1: Installation and Setup
2. Tutorial 2: First Login and Dashboard Tour
3. Tutorial 3: Understanding Ghost Detection
4. Tutorial 9: Common Issues and Solutions

### Analytics Mastery
For users wanting to master data analysis:
1. Tutorial 4: Using Analytics and Visualizations
2. Tutorial 5: Suspicion Scores and Behavioral Analysis
3. Tutorial 6: Timeline Analysis and User Tracking
4. Tutorial 7: Advanced Filtering and Search

### Advanced Users
For power users and administrators:
1. Tutorial 6: Timeline Analysis and User Tracking
2. Tutorial 7: Advanced Filtering and Search
3. Tutorial 8: Plugin System and Extensions

## Additional Resources

### Video Hosting Information

All tutorial videos are hosted on YouTube with:
- 🎬 High-quality 1080p video
- 📝 Full transcripts available
- 🌍 Multiple language subtitles
- ⚡ Playback speed controls
- 📱 Mobile-friendly viewing

### Requesting New Tutorials

Have an idea for a tutorial? 
- [Submit a request on GitHub](https://github.com/subculture-collective/discord-spywatcher/issues/new?template=tutorial-request.md)
- Vote on existing tutorial requests
- Join our community discussions

### Contributing Tutorials

Want to create tutorials for Spywatcher?
- Check our [Tutorial Guidelines](../developer/tutorial-guidelines)
- Review the [Style Guide](../developer/tutorial-style-guide)
- Submit your tutorial for review

## Stay Updated

New tutorials are added regularly. Subscribe to:
- 📺 [YouTube Channel](https://youtube.com/@spywatcher) - Get notified of new videos
- 📧 [Newsletter](https://spywatcher.com/newsletter) - Monthly tutorial roundups
- 🐦 [Twitter](https://twitter.com/spywatcher) - Tutorial announcements

---

::: tip Need Help?
If you're stuck on any tutorial, check the [FAQ](./faq) or visit our [Troubleshooting Guide](./troubleshooting).
:::
