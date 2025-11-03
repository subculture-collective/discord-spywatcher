# Documentation Screenshots

This directory contains screenshots for the Spywatcher documentation.

## Screenshot Guidelines

### Required Screenshots

The following screenshots are referenced in the documentation and should be created:

#### Dashboard Screenshots

- [ ] `dashboard-overview.png` - Main dashboard view
- [ ] `metrics-cards.png` - Close-up of metric cards
- [ ] `live-feed.png` - Real-time activity feed
- [ ] `dark-mode.png` - Dark theme example

#### Analytics Screenshots

- [ ] `activity-charts.png` - Various chart types
- [ ] `heatmap.png` - Activity heatmap visualization
- [ ] `user-timeline.png` - Individual user timeline

#### Detection Screenshots

- [ ] `ghost-detection.png` - Ghost users list
- [ ] `ghost-detail.png` - Detailed ghost analysis
- [ ] `suspicion-dashboard.png` - Suspicion scores overview
- [ ] `score-breakdown.png` - Suspicion score components

#### Interface Screenshots

- [ ] `filters.png` - Filter interface
- [ ] `search-results.png` - Search results view
- [ ] `settings-general.png` - General settings
- [ ] `user-management.png` - User management panel
- [ ] `export-dialog.png` - Export options dialog

#### Mobile Screenshots

- [ ] `mobile-dashboard.png` - Mobile responsive view
- [ ] `mobile-charts.png` - Charts on mobile

#### Plugin Screenshots

- [ ] `plugin-management.png` - Plugin interface

## Screenshot Specifications

### Technical Requirements

- **Format**: PNG (for quality and transparency)
- **Resolution**: 1920x1080 or 1280x720
- **Color Profile**: sRGB
- **Max File Size**: 500KB per image
- **Compression**: Use tools like TinyPNG or ImageOptim

### Capture Guidelines

1. **Browser Setup**
    - Use Chrome or Firefox latest version
    - Set window to 1920x1080 or consistent size
    - Disable browser extensions that might interfere
    - Use clean browser profile

2. **Content Preparation**
    - Use demo/test data (never real user data)
    - Anonymize any usernames/IDs
    - Ensure UI is in consistent state
    - Clear any notifications/popups

3. **Visual Consistency**
    - Use light theme by default (dark theme for dark-mode.png)
    - Show consistent date/time (use mockup data if needed)
    - Keep UI elements aligned
    - Ensure text is readable

### Annotation Tools

Recommended tools for adding annotations:

- **Snagit** - Professional screenshot tool with annotations
- **Skitch** - Simple and effective
- **Monosnap** - Cross-platform option
- **GIMP** - Free open-source alternative

### Annotation Style

When adding annotations:

- **Colors**: Use theme colors (primary: #5865f2)
- **Arrows**: Simple, clear arrows pointing to features
- **Boxes**: Highlight important areas
- **Numbers**: Use circled numbers for step-by-step guides
- **Text**: Clear, legible font (14-16pt)
- **Background**: Semi-transparent overlays when needed

## Screenshot Capture Process

### Step 1: Setup Environment

```bash
# Start Spywatcher with demo data
cd /path/to/discord-spywatcher
docker-compose -f docker-compose.dev.yml up

# Or with seed data
cd backend
npm run db:seed  # If seed script exists
```

### Step 2: Prepare Browser

```bash
# Chrome with specific window size
chrome --window-size=1920,1080 --new-window http://localhost:5173

# Firefox
firefox --window-size=1920,1080 http://localhost:5173
```

### Step 3: Capture Screenshots

1. Navigate to each feature/page
2. Wait for data to load completely
3. Take clean screenshot (F11 or screenshot tool)
4. Save with descriptive filename

### Step 4: Edit and Annotate

1. Open in annotation tool
2. Add arrows, boxes, labels as needed
3. Keep annotations minimal but clear
4. Save as PNG

### Step 5: Optimize

```bash
# Install optimization tools
npm install -g imageoptim-cli

# Or use online tools
# - TinyPNG: https://tinypng.com
# - Squoosh: https://squoosh.app

# Optimize all images
imageoptim *.png
```

### Step 6: Verify

1. Check file sizes (< 500KB each)
2. Verify image quality
3. Test in documentation build
4. Ensure images load correctly

## Using Screenshots in Documentation

### Markdown Syntax

```markdown
# Local image

![Description](../images/screenshot-name.png)

# With caption

![Dashboard Overview](../images/dashboard-overview.png)
_Figure 1: Main dashboard showing key metrics_

# In info block

::: info Screenshot
![Feature Name](../images/feature.png)
:::
```

### Best Practices

1. **Alt Text**: Always provide descriptive alt text
2. **File Names**: Use kebab-case, descriptive names
3. **Context**: Explain what the screenshot shows
4. **Updates**: Keep screenshots current with UI changes
5. **Accessibility**: Describe important information in text too

## Screenshot Checklist

Before considering screenshots complete:

- [ ] All required screenshots captured
- [ ] All images optimized (< 500KB each)
- [ ] Annotations are clear and consistent
- [ ] User data is anonymized
- [ ] Images are referenced correctly in docs
- [ ] Documentation builds successfully
- [ ] Images display correctly in browser
- [ ] Dark mode screenshot included
- [ ] Mobile screenshots captured
- [ ] README updated if new screenshots added

## Maintenance

### When to Update Screenshots

- After significant UI changes
- When features are added/removed
- If current screenshots are outdated
- When documentation is reorganized
- Annually for general freshness

### Version Control

- Commit screenshots with clear commit messages
- Note screenshot updates in CHANGELOG
- Keep old screenshots if creating comparison docs
- Use branches for major screenshot overhauls

## Tools and Resources

### Screenshot Tools

- **macOS**: Cmd+Shift+4 (built-in)
- **Windows**: Win+Shift+S (Snipping Tool)
- **Linux**: Flameshot, Spectacle
- **Cross-platform**: ShareX, Greenshot

### Image Editing

- **GIMP**: Free, powerful editor
- **Photopea**: Browser-based Photoshop alternative
- **Figma**: For mockups and annotations

### Optimization

- **TinyPNG**: Online PNG compressor
- **ImageOptim**: macOS app
- **Squoosh**: Google's image optimizer
- **pngquant**: Command-line tool

### Browser Tools

- **Responsive Design Mode**: F12 → Toggle device toolbar
- **Full Page Screenshot**: Browser extensions
- **Disable Extensions**: Clean screenshot environment

## Questions?

For questions about screenshots:

1. Check the [Screenshots Guide](../guide/screenshots.md)
2. Review existing screenshots for style reference
3. Open an issue on GitHub for clarification

---

_Last updated: November 2024_
