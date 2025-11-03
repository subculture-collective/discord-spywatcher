# Advanced Visualization & Charts Documentation

## Overview

The Discord Spywatcher application now includes advanced visualization capabilities that provide deep insights into user behavior, channel interactions, and relationship patterns through interactive charts and diagrams.

## Features

### 1. Network/Relationship Graph
- **Technology**: Vis-network
- **Purpose**: Visualizes relationships between users and channels as an interactive network
- **Features**:
  - Interactive node dragging and zooming
  - Node size represents activity level (suspicion + ghost scores)
  - Color-coded nodes (users in blue, channels in green)
  - Hover tooltips showing detailed information
  - Physics-based layout for natural clustering
  - Real-time updates

### 2. Sankey Flow Diagram
- **Technology**: D3.js with d3-sankey
- **Purpose**: Shows the flow of interactions from users to channels
- **Features**:
  - Flow width represents interaction volume
  - Left side shows users, right side shows channels
  - Color-coded by source entity type
  - Hover tooltips with interaction counts
  - Smooth, animated transitions
  - Responsive layout

### 3. Chord Diagram
- **Technology**: D3.js chord layout
- **Purpose**: Displays circular interaction patterns between all entities
- **Features**:
  - Circular layout showing all relationships
  - Arc width represents total interactions
  - Ribbons show interaction strength between entities
  - Color-coded by entity
  - Interactive hover effects
  - Compact visualization for complex relationships

### 4. Interactive Filtering
- **Purpose**: Real-time data filtering and exploration
- **Features**:
  - Suspicion score range filter (0-100)
  - Ghost score range filter (0-100)
  - Minimum interactions threshold
  - User search by name
  - Channel search by name
  - Active filter count indicator
  - One-click filter reset
  - Filters apply to all visualizations

### 5. Chart Export
- **Technology**: html2canvas
- **Purpose**: Export visualizations as PNG images
- **Features**:
  - High-quality 2x resolution export
  - Automatic filename with timestamp
  - Dark theme preserved in export
  - One-click download
  - Works with all chart types

### 6. Drill-Down Panel
- **Purpose**: Detailed entity information modal
- **Features**:
  - User and channel detail views
  - Metrics display (suspicion, ghost scores, message counts)
  - Recent activity timeline
  - Smooth animations
  - Click outside to close

## Usage

### Accessing Advanced Analytics

1. Navigate to the main Analytics page (`/analytics`)
2. Click the "Advanced Charts" button in the top-right corner
3. You'll be taken to `/advanced-analytics`

### Switching Between Visualizations

Use the view toggle buttons at the top of the page:
- **Network Graph**: Best for understanding relationships
- **Sankey Flow**: Best for tracking interaction flows
- **Chord Diagram**: Best for comparing all interactions

### Applying Filters

1. Click the "Filters" button
2. Adjust ranges and enter search terms
3. Filters apply immediately to all visualizations
4. Click "Reset All Filters" to clear

### Exporting Charts

1. Select your desired visualization
2. Apply any filters you want
3. Click the "Export" button
4. The chart will be downloaded as a PNG file

## Technical Details

### New Dependencies

```json
{
  "d3": "^7.x",
  "d3-sankey": "^0.12.x",
  "@types/d3": "^7.x",
  "@types/d3-sankey": "^0.12.x",
  "vis-network": "^9.x",
  "vis-data": "^7.x",
  "html2canvas": "^1.x"
}
```

### Component Architecture

```
src/
├── components/
│   └── analytics/
│       ├── NetworkGraph.tsx        # Vis-network based graph
│       ├── SankeyDiagram.tsx       # D3 Sankey flow
│       ├── ChordDiagram.tsx        # D3 Chord diagram
│       ├── InteractiveFilter.tsx   # Filter UI component
│       ├── ChartExport.tsx         # Export functionality
│       └── DrillDownPanel.tsx      # Detail modal
└── pages/
    └── AdvancedAnalytics.tsx       # Main page component
```

### Data Flow

1. **Data Fetching**: Combined heatmap and suspicion data from API
2. **Data Processing**: Merged and normalized for visualization
3. **Filtering**: Client-side filtering based on user selections
4. **Rendering**: Real-time updates to visualizations
5. **Export**: Canvas-based image generation

### Performance Considerations

- **Data Limiting**: Large datasets are automatically truncated
- **Debouncing**: Filter changes are debounced for smooth UX
- **Lazy Rendering**: Only active visualization is rendered
- **Memoization**: React hooks optimize re-renders
- **Physics Stabilization**: Network graph physics limited to 200 iterations

## API Integration

The advanced analytics page consumes two main API endpoints:

```typescript
// Heatmap data - user-channel interactions
GET /api/heatmap?since=<ISO_DATE>

// Suspicion data - user behavior metrics
GET /api/suspicion?since=<ISO_DATE>
```

### Data Models

```typescript
interface AnalyticsData {
    userId: string;
    username: string;
    channelId?: string;
    channel?: string;
    count?: number;
    suspicionScore?: number;
    ghostScore?: number;
    interactions?: number;
}
```

## Testing

The implementation includes comprehensive unit tests:

```bash
# Run all tests
npm test

# Run specific test files
npm test InteractiveFilter.test.tsx
npm test ChartExport.test.tsx
npm test AdvancedAnalytics.test.tsx
```

### Test Coverage

- ✅ InteractiveFilter component (5 tests)
- ✅ ChartExport component (3 tests)
- ✅ AdvancedAnalytics page (4 tests)
- ✅ All tests passing with proper mocking

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (responsive design)

## Accessibility

- Keyboard navigation supported
- ARIA labels on interactive elements
- Color contrast meets WCAG AA standards
- Screen reader friendly
- Focus indicators visible

## Future Enhancements

Potential additions for future versions:

1. **3D Visualizations**: Three.js based 3D network graphs
2. **Real-time Updates**: WebSocket integration for live data
3. **Animation Controls**: Playback of historical data
4. **Custom Color Schemes**: User-defined color palettes
5. **Advanced Drill-down**: Nested detail views with more metrics
6. **Comparison Mode**: Side-by-side visualization comparison
7. **Saved Views**: Bookmark favorite filter configurations
8. **CSV Export**: Raw data export alongside images

## Troubleshooting

### Visualization Not Rendering

- Check browser console for errors
- Verify API endpoints are accessible
- Ensure data is not empty
- Try refreshing the page

### Export Not Working

- Check browser console for canvas errors
- Verify html2canvas is loaded
- Try a smaller viewport size
- Check browser permissions

### Performance Issues

- Reduce date range to limit data size
- Apply filters to reduce visible data
- Use a more powerful device
- Clear browser cache

## Support

For issues or questions:
- Check existing GitHub issues
- Review the main [README.md](./README.md)
- Consult [CONTRIBUTING.md](./CONTRIBUTING.md)
- Open a new issue with detailed information

---

**Note**: This feature requires an active backend API connection for data. The visualizations are built to handle large datasets efficiently but performance may vary based on data volume and device capabilities.
