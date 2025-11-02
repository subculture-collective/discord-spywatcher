# Accessibility (A11Y) Documentation

This document outlines the accessibility features and guidelines for Discord Spywatcher, ensuring WCAG 2.1 AA compliance.

## Overview

Discord Spywatcher is committed to providing an inclusive experience for all users, including those with disabilities. We follow the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.

## Keyboard Navigation

### Global Navigation
- **Skip to Main Content**: Press `Tab` on page load to reveal a "Skip to main content" link that allows bypassing navigation
- **Tab Order**: All interactive elements follow a logical tab order
- **Focus Indicators**: Visible focus indicators (blue outline) on all interactive elements
- **No Keyboard Traps**: Users can navigate in and out of all components using keyboard alone

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Tab` | Navigate to next focusable element |
| `Shift + Tab` | Navigate to previous focusable element |
| `Enter` / `Space` | Activate buttons and links |
| `Escape` | Close modals and dialogs (when implemented) |

## Screen Reader Support

### Semantic HTML
- Proper heading hierarchy (h1 → h2 → h3, etc.)
- Semantic landmarks: `<header>`, `<main>`, `<nav>`, `<aside>`, `<section>`
- Native HTML elements used where possible (`<button>`, `<a>`, etc.)

### ARIA Attributes
We use ARIA attributes to enhance accessibility:

- **aria-label**: Provides accessible names for icon-only buttons and interactive elements
- **aria-labelledby**: Associates sections with their headings
- **aria-describedby**: Links help text to form inputs
- **aria-live**: Announces dynamic content updates (notifications, stats)
- **aria-busy**: Indicates loading states
- **aria-disabled**: Indicates disabled states
- **aria-hidden**: Hides decorative elements from screen readers

### Tables
All data tables include:
- `<caption>` for table descriptions
- `scope="col"` and `scope="row"` for headers
- `<abbr>` for abbreviated column headers
- Alternative text descriptions for complex data

### Charts & Visualizations
- Visual charts include `role="img"` with descriptive `aria-label`
- Hidden data tables provided as fallback for screen readers
- Summary statistics announced via `aria-live` regions

## Visual Accessibility

### Color Contrast
All text meets WCAG AA contrast requirements:
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3.0:1 contrast ratio
- UI components: 3.0:1 contrast ratio

### Text Scaling
- Support for 200% zoom without horizontal scrolling
- Responsive text sizing using relative units (rem, em)
- No fixed pixel-based font sizes

### Color Independence
- Information is not conveyed by color alone
- Icons and patterns supplement color coding
- Status indicators include text labels

## Forms & Inputs

### Form Accessibility
- All inputs have associated `<label>` elements
- Required fields indicated with visual and screen-reader accessible markers
- Error messages clearly associated with their fields via `aria-describedby`
- Validation feedback announced to screen readers

### Input Assistance
- Clear instructions for expected input formats
- Inline validation with helpful error messages
- Success feedback when forms are submitted

## Dynamic Content

### Live Regions
- Notifications use `role="status"` with `aria-live="polite"`
- Statistics use `aria-live="polite"` for automatic updates
- Critical alerts use `aria-live="assertive"` (when implemented)

### Focus Management
- Focus automatically moved to modals when opened (when implemented)
- Focus returned to triggering element when modal closed (when implemented)
- Focus moved to error fields on validation failure

## Testing

### Automated Testing
We use the following tools for automated accessibility testing:
- **vitest-axe**: Integrated into our test suite to catch accessibility violations
- **ESLint jsx-a11y plugin**: Catches common accessibility issues during development

Run accessibility tests:
```bash
npm run test -- src/__tests__/accessibility
```

### Manual Testing
We recommend testing with:
- **Keyboard-only navigation**: Tab through the entire application
- **Screen readers**:
  - NVDA (Windows) - Free
  - JAWS (Windows) - Commercial
  - VoiceOver (macOS/iOS) - Built-in
  - TalkBack (Android) - Built-in
- **Browser zoom**: Test at 200% zoom level
- **High contrast mode**: Windows High Contrast Mode

## Supported Assistive Technologies

- Screen readers: NVDA, JAWS, VoiceOver, TalkBack
- Screen magnification software
- Voice control software
- Keyboard-only navigation
- Browser zoom functionality

## Known Issues

Currently, there are no known critical accessibility issues. If you encounter an accessibility barrier, please report it.

## Reporting Accessibility Issues

If you experience any accessibility issues or have suggestions for improvement:

1. **GitHub Issues**: Open an issue at [discord-spywatcher/issues](https://github.com/subculture-collective/discord-spywatcher/issues)
2. **Label**: Use the `accessibility` label
3. **Include**:
   - Browser and version
   - Assistive technology (if applicable)
   - Steps to reproduce
   - Expected vs. actual behavior

## Best Practices for Contributors

When contributing to Discord Spywatcher:

1. **Use semantic HTML** - Prefer native elements over custom components
2. **Include ARIA attributes** - When semantic HTML isn't sufficient
3. **Test keyboard navigation** - Ensure all features are keyboard accessible
4. **Write meaningful alt text** - Describe the purpose, not just the appearance
5. **Maintain heading hierarchy** - Don't skip heading levels
6. **Test with screen readers** - Verify your changes work with assistive technology
7. **Run accessibility tests** - Ensure `npm run test` passes before committing

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM - Web Accessibility In Mind](https://webaim.org/)
- [The A11Y Project](https://www.a11yproject.com/)
- [MDN Web Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Inclusive Components](https://inclusive-components.design/)

## Compliance Statement

Discord Spywatcher aims to conform to WCAG 2.1 Level AA standards. We are continuously working to improve accessibility and welcome feedback from our users.

Last updated: 2025-11-01
