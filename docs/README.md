# Spywatcher Documentation

This directory contains the comprehensive documentation for Spywatcher, built with [VitePress](https://vitepress.dev/).

## Documentation Structure

```
docs/
├── .vitepress/          # VitePress configuration
│   └── config.ts        # Site configuration
├── guide/               # User guides
│   ├── index.md         # Guide home
│   ├── installation.md  # Installation guide
│   ├── quick-start.md   # Quick start guide
│   └── ...              # Feature guides
├── admin/               # Administrator guides
│   ├── index.md         # Admin home
│   └── ...              # Admin documentation
├── developer/           # Developer guides
│   ├── index.md         # Developer home
│   └── ...              # Development docs
├── api/                 # API reference
│   ├── index.md         # API home
│   └── ...              # API endpoints
├── index.md             # Documentation homepage
└── changelog.md         # Version history
```

## Local Development

### Prerequisites

- Node.js 18+
- npm 8+

### Setup

```bash
# Install dependencies (from repository root)
npm install

# Start development server
npm run docs:dev
```

The documentation will be available at `http://localhost:5173/`.

### Build

```bash
# Build documentation
npm run docs:build

# Preview build
npm run docs:preview
```

## Writing Documentation

### Creating New Pages

1. Create a new `.md` file in the appropriate directory
2. Add front matter if needed
3. Update `.vitepress/config.ts` to add it to navigation
4. Use markdown with VitePress enhancements

### Markdown Features

VitePress supports:
- Standard markdown
- Custom containers (tip, warning, danger)
- Code syntax highlighting
- Mermaid diagrams
- Vue components

### Example Page

```markdown
# Page Title

Brief introduction to the topic.

## Section

Content with **bold** and *italic* text.

### Code Example

\`\`\`typescript
// TypeScript code example
const example = "highlighted code";
\`\`\`

::: tip
Helpful tip for users
:::

::: warning
Important warning
:::

## Related

- [Related Page 1](./page1)
- [Related Page 2](./page2)
```

### Custom Containers

```markdown
::: tip
Helpful information
:::

::: warning
Important warnings
:::

::: danger
Critical information
:::

::: info
Informational content
:::
```

### Code Groups

```markdown
::: code-group

\`\`\`typescript [TypeScript]
const example = "TypeScript";
\`\`\`

\`\`\`python [Python]
example = "Python"
\`\`\`

:::
```

## Deploying Documentation

### GitHub Pages

Documentation can be deployed to GitHub Pages:

```bash
# Build documentation
npm run docs:build

# Deploy to GitHub Pages
# (Configure in .github/workflows/deploy-docs.yml)
```

### Other Platforms

The built documentation (in `docs/.vitepress/dist`) can be deployed to:
- Netlify
- Vercel
- AWS S3
- Any static hosting service

## Contributing

When contributing documentation:

1. Follow the existing structure
2. Use clear, concise language
3. Include code examples
4. Add screenshots for UI features
5. Link to related documentation
6. Test locally before submitting

See [Contributing Guide](./developer/contributing.md) for more details.

## Style Guide

### Writing Style

- Use active voice
- Write in second person ("you")
- Keep sentences short
- Use bullet points for lists
- Include examples

### Formatting

- Use proper markdown headings (h1, h2, h3)
- Code snippets should be properly highlighted
- Use tables for structured data
- Add alt text to images
- Use consistent terminology

### Code Examples

- Include complete, working examples
- Add comments to explain complex code
- Show both TypeScript and JavaScript when applicable
- Include error handling
- Use realistic variable names

## Search

VitePress includes built-in search functionality. All content is automatically indexed.

## Version Control

Documentation is version-controlled alongside code:
- Update docs in the same PR as code changes
- Keep docs in sync with features
- Update changelog for documentation changes

## Links

- [VitePress Documentation](https://vitepress.dev/)
- [Markdown Guide](https://www.markdownguide.org/)
- [Spywatcher Repository](https://github.com/subculture-collective/discord-spywatcher)

## Questions?

If you have questions about documentation:
- Open an issue on GitHub
- Check the [Contributing Guide](./developer/contributing.md)
- Review the [Developer Guide](./developer/)
