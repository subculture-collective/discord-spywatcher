# Advanced Charts User Guide

## Quick Start

Access advanced visualizations by clicking **"Advanced Charts"** button on the Analytics page.

## Available Visualizations

### 1. Network Relationship Graph

**Best for**: Understanding connections between users and channels

**Features**:
- Interactive nodes you can drag and rearrange
- Zoom in/out with mouse wheel
- Node size = activity level
- Blue nodes = Users
- Green nodes = Channels
- Lines = Interactions

**How to Read**:
- Larger nodes = more active users/popular channels
- Clustered nodes = related activities
- Isolated nodes = independent users/channels

**Use Cases**:
- Identify community clusters
- Find isolated users
- Discover channel popularity
- Spot unusual connection patterns

---

### 2. Sankey Flow Diagram

**Best for**: Tracking interaction flow from users to channels

**Features**:
- Left side = Users (blue)
- Right side = Channels (green)
- Flow width = interaction volume
- Hover for exact numbers

**How to Read**:
- Thicker flows = more interactions
- Follow a user's flow to see their active channels
- Follow a channel's input to see active users
- Multiple flows = distributed activity

**Use Cases**:
- See where users spend time
- Identify power users in specific channels
- Find underutilized channels
- Track conversation patterns

---

### 3. Chord Interaction Diagram

**Best for**: Comparing all interactions in a compact circular view

**Features**:
- Circular layout with all entities
- Arc width = total activity
- Ribbons connect interacting entities
- Color-coded by entity type

**How to Read**:
- Larger arcs = more active entities
- Thicker ribbons = stronger connections
- Opposite sides = interaction pairs
- Many ribbons = highly connected entity

**Use Cases**:
- Get overview of all interactions
- Spot the most connected users
- Find reciprocal relationships
- Identify communication hubs

---

## Interactive Filtering

### Available Filters

1. **Suspicion Score Range** (0-100)
   - Filter by user suspicion level
   - High scores = suspicious behavior

2. **Ghost Score Range** (0-100)
   - Filter by ghost detection
   - High scores = potential ghost users

3. **Minimum Interactions**
   - Show only active participants
   - Reduce noise from inactive users

4. **User Search**
   - Find specific users by name
   - Partial matching supported

5. **Channel Search**
   - Find specific channels by name
   - Partial matching supported

### Using Filters

1. Click the **"Filters"** button (top-right)
2. Adjust sliders or enter values
3. Changes apply immediately
4. Active filter count shown on button
5. Click **"Reset All Filters"** to clear

### Filter Tips

- Start broad, then narrow down
- Combine multiple filters for precision
- Use search for specific investigations
- Reset filters to see full picture

---

## Exporting Charts

### How to Export

1. Select your desired visualization
2. Apply any filters you want
3. Click the **"Export"** button
4. Image downloads automatically

### Export Details

- Format: PNG image
- Resolution: 2x (high quality)
- Filename: Includes date
- Preserves: Dark theme and colors

### Export Tips

- Export before changing views
- Apply filters first for focused exports
- Use for reports and presentations
- Filenames include timestamp for organization

---

## Date Range Selection

Control the time period for your data:

1. Click the date range selector
2. Choose start and end dates
3. Click **"Apply"**
4. All visualizations update

**Common Ranges**:
- Last 7 days: Recent activity
- Last 30 days: Monthly trends
- Last 90 days: Quarterly overview
- Custom: Specific investigation periods

---

## Statistics Cards

The top of the page shows key metrics:

- **Total Users**: Unique users in current view
- **Total Channels**: Unique channels in current view
- **Interactions**: Total interaction count
- **Filters Active**: Number of active filters

Use these to:
- Verify filter effects
- Track investigation scope
- Quick sanity checks
- Report key numbers

---

## Best Practices

### Investigation Workflow

1. **Overview**: Start with Chord diagram
2. **Explore**: Switch to Network graph
3. **Detail**: Use Sankey for specific flows
4. **Filter**: Apply filters progressively
5. **Export**: Save interesting findings

### Performance Tips

- Use date ranges to limit data
- Apply filters to reduce complexity
- Close filter panel when not in use
- Refresh page if sluggish

### Common Patterns

**Suspicious Activity**:
1. Set suspicion score > 50
2. Look for isolated nodes in Network
3. Check their flow in Sankey

**Ghost Detection**:
1. Set ghost score > 5
2. Find users with minimal interactions
3. Verify in channel distribution

**Popular Channels**:
1. No user filters
2. Look for large green nodes
3. Check Sankey for user distribution

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl + Shift + F` | Open filters |
| `Escape` | Close filter panel |
| `1` | Network view |
| `2` | Sankey view |
| `3` | Chord view |

---

## Troubleshooting

### "No data available"
- Check date range
- Verify filters aren't too restrictive
- Ensure backend is running
- Try refreshing the page

### Visualization is blurry
- Export feature provides high-res images
- Try zooming out for better overview
- Resize browser window

### Performance is slow
- Reduce date range
- Apply more filters
- Close other browser tabs
- Use a more powerful device

### Can't find a user/channel
- Check spelling in search
- Verify they exist in date range
- Try broader search terms
- Remove other filters

---

## Integration with Main Analytics

The Advanced Analytics page complements the main Analytics dashboard:

- **Main Dashboard**: Metrics, tables, basic charts
- **Advanced Analytics**: Relationships, flows, patterns

Use both views together:
1. Identify trends in main dashboard
2. Investigate patterns in advanced analytics
3. Export findings from both
4. Combine insights in reports

---

## Example Use Cases

### Case 1: Finding Community Leaders

1. Open Network Graph
2. Look for highly connected users (large nodes)
3. Check which channels they're active in
4. Export the network for reference

### Case 2: Detecting Coordinated Activity

1. Set suspicion score > 60
2. Use Sankey to see if users share channels
3. Look for unusual flow patterns
4. Export evidence

### Case 3: Channel Health Check

1. Remove all filters
2. Use Sankey to see channel activity
3. Identify underutilized channels
4. Plan community initiatives

### Case 4: Ghost Investigation

1. Set ghost score > 10
2. Use Network to see if they cluster
3. Check Chord for interaction patterns
4. Document findings

---

## Tips from Power Users

> "Start with the Network graph to get a feel for your community structure."

> "Use the Sankey diagram for presentations - it's very clear and professional."

> "Combine suspicion and ghost filters to find truly problematic users."

> "Export before and after filter application to show investigation progress."

> "The Chord diagram is great for finding unexpected connections."

---

## Additional Resources

- [Main README](../README.md)
- [Analytics API Documentation](./API_DOCUMENTATION.md)
- [Advanced Visualizations Technical Docs](../ADVANCED_VISUALIZATIONS.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

---

**Need Help?** Check the troubleshooting section or open an issue on GitHub with:
- What you were trying to do
- What you expected to happen
- What actually happened
- Screenshots if possible
