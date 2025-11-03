# Filters and Search

Use filters and search to find specific data quickly.

## Quick Search

Press `Ctrl/Cmd + K` to open quick search:
- Search for users by username or ID
- Jump to any page
- Search documentation
- View recent actions

## Filter Panel

Access filters using the filter icon in any view.

### Common Filters

#### Date Range

- Last 24 hours
- Last 7 days
- Last 30 days
- Last 90 days
- Custom range

#### User Filters

- **Role**: Filter by Discord roles
- **Status**: Online, offline, idle, DND
- **Activity Level**: Active, inactive, ghost
- **Join Date**: Before/after specific date

#### Activity Filters

- **Message Count**: Minimum/maximum
- **Presence Count**: Minimum/maximum
- **Suspicion Score**: Score range
- **Ghost Score**: Score threshold

#### Channel Filters

- Specific channels
- Channel categories
- Channel types (text, voice, announcement)

## Filter Presets

### Creating Presets

1. Configure filters
2. Click "Save as Preset"
3. Name your preset
4. Access from presets menu

### Built-in Presets

- **High Activity Users**: Active members
- **New Members**: Recently joined
- **Ghosts**: High ghost scores
- **Moderators**: Staff activity
- **Suspicious**: High suspicion scores

## Advanced Search

### Search Syntax

Use advanced search operators:

```
username:john          # Search by username
role:moderator        # Filter by role
score:>50             # Suspicion score above 50
messages:>100         # More than 100 messages
joined:<2024-01-01   # Joined before date
```

### Combining Filters

Chain multiple filters:

```
role:member status:online messages:>10
```

## Sorting

Sort results by:
- Username (A-Z or Z-A)
- Activity level (high to low)
- Join date (newest/oldest)
- Suspicion score (high to low)
- Last seen (recent/oldest)

## Exporting Filtered Results

After applying filters:
1. Click "Export"
2. Choose format (CSV, JSON, PDF)
3. Download filtered data

## Tips

- Save frequently used filters as presets
- Use quick search for individual users
- Combine multiple filters for precision
- Export filtered data for analysis

## Related

- [Dashboard](./dashboard)
- [Analytics](./analytics)
- [Quick Start](./quick-start)

::: tip Keyboard Shortcut
Press `Ctrl/Cmd + K` anywhere to open quick search!
:::
