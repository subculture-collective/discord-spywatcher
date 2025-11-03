import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Spywatcher',
  description:
    'Comprehensive documentation for Discord Spywatcher - surveillance and analytics for Discord servers',
  lang: 'en-US',
  
  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#5865f2' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:title', content: 'Spywatcher Documentation' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Discord surveillance and analytics documentation',
      },
    ],
    ['meta', { property: 'og:site_name', content: 'Spywatcher Docs' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '/guide/' },
      { text: 'Admin', link: '/admin/', activeMatch: '/admin/' },
      { text: 'Developer', link: '/developer/', activeMatch: '/developer/' },
      { text: 'API', link: '/api/', activeMatch: '/api/' },
      {
        text: 'Resources',
        items: [
          { text: 'GitHub', link: 'https://github.com/subculture-collective/discord-spywatcher' },
          { text: 'Changelog', link: '/changelog' },
          { text: 'Contributing', link: '/developer/contributing' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          collapsed: false,
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Getting Started Guide', link: '/guide/getting-started' },
            { text: 'Discord OAuth Setup', link: '/guide/oauth-setup' },
            { text: 'Guild Selection', link: '/guide/guild-selection' },
          ],
        },
        {
          text: 'Core Features',
          collapsed: false,
          items: [
            { text: 'Dashboard Overview', link: '/guide/dashboard' },
            { text: 'Analytics', link: '/guide/analytics' },
            { text: 'Ghost Detection', link: '/guide/ghost-detection' },
            { text: 'Lurker Detection', link: '/guide/lurker-detection' },
            { text: 'Heatmap Visualization', link: '/guide/heatmap' },
            { text: 'Suspicion Scores', link: '/guide/suspicion-scores' },
            { text: 'Filters and Search', link: '/guide/filters' },
          ],
        },
        {
          text: 'Advanced Features',
          collapsed: false,
          items: [
            { text: 'Timeline Analysis', link: '/guide/timeline' },
            { text: 'Advanced Charts', link: '/guide/advanced-charts' },
            { text: 'Privacy Controls', link: '/guide/privacy' },
            { text: 'Plugin System', link: '/guide/plugins' },
          ],
        },
        {
          text: 'Learning Resources',
          collapsed: false,
          items: [
            { text: 'Video Tutorials', link: '/guide/tutorials' },
            { text: 'Best Practices', link: '/guide/best-practices' },
            { text: 'Quick Reference', link: '/guide/quick-reference' },
            { text: 'Screenshots Guide', link: '/guide/screenshots' },
            { text: 'Glossary', link: '/guide/glossary' },
          ],
        },
        {
          text: 'Help',
          collapsed: false,
          items: [
            { text: 'Troubleshooting', link: '/guide/troubleshooting' },
            { text: 'FAQ', link: '/guide/faq' },
          ],
        },
      ],
      '/admin/': [
        {
          text: 'Administration',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/admin/' },
            { text: 'Admin Panel', link: '/admin/panel' },
            { text: 'User Management', link: '/admin/user-management' },
            { text: 'Ban Management', link: '/admin/ban-management' },
            { text: 'IP Blocking', link: '/admin/ip-blocking' },
            { text: 'Permission Management', link: '/admin/permissions' },
            { text: 'Audit Logs', link: '/admin/audit-logs' },
          ],
        },
        {
          text: 'Configuration',
          collapsed: false,
          items: [
            { text: 'Environment Variables', link: '/admin/environment' },
            { text: 'Feature Flags', link: '/admin/feature-flags' },
            { text: 'Rate Limiting', link: '/admin/rate-limiting' },
            { text: 'Security Settings', link: '/admin/security' },
            { text: 'Integration Settings', link: '/admin/integrations' },
          ],
        },
        {
          text: 'Operations',
          collapsed: false,
          items: [
            { text: 'Backup Procedures', link: '/admin/backup' },
            { text: 'Restore Procedures', link: '/admin/restore' },
            { text: 'Monitoring', link: '/admin/monitoring' },
            { text: 'Alert Handling', link: '/admin/alerts' },
            { text: 'Incident Response', link: '/admin/incident-response' },
            { text: 'Maintenance', link: '/admin/maintenance' },
          ],
        },
      ],
      '/developer/': [
        {
          text: 'Getting Started',
          collapsed: false,
          items: [
            { text: 'Development Setup', link: '/developer/' },
            { text: 'Prerequisites', link: '/developer/prerequisites' },
            { text: 'Local Environment', link: '/developer/local-environment' },
            { text: 'Database Setup', link: '/developer/database-setup' },
            { text: 'Running Tests', link: '/developer/testing' },
            { text: 'Debug Configuration', link: '/developer/debugging' },
            { text: 'Common Issues', link: '/developer/common-issues' },
          ],
        },
        {
          text: 'Architecture',
          collapsed: false,
          items: [
            { text: 'System Architecture', link: '/developer/architecture' },
            { text: 'Database Schema', link: '/developer/database-schema' },
            { text: 'API Architecture', link: '/developer/api-architecture' },
            { text: 'Authentication Flow', link: '/developer/auth-flow' },
            { text: 'WebSocket Architecture', link: '/developer/websocket' },
            { text: 'Data Flow', link: '/developer/data-flow' },
          ],
        },
        {
          text: 'Contributing',
          collapsed: false,
          items: [
            { text: 'How to Contribute', link: '/developer/contributing' },
            { text: 'Code of Conduct', link: '/developer/code-of-conduct' },
            { text: 'Code Style Guide', link: '/developer/code-style' },
            { text: 'Pull Request Process', link: '/developer/pull-requests' },
            { text: 'Testing Requirements', link: '/developer/test-requirements' },
            { text: 'Commit Conventions', link: '/developer/commit-conventions' },
            { text: 'Review Process', link: '/developer/review-process' },
          ],
        },
        {
          text: 'Deployment',
          collapsed: false,
          items: [
            { text: 'Deployment Guide', link: '/developer/deployment' },
            { text: 'Infrastructure Setup', link: '/developer/infrastructure' },
            { text: 'Docker Guide', link: '/developer/docker' },
            { text: 'Kubernetes Guide', link: '/developer/kubernetes' },
            { text: 'Migration Procedures', link: '/developer/migrations' },
            { text: 'Monitoring Setup', link: '/developer/monitoring-setup' },
            { text: 'Scaling Guide', link: '/developer/scaling' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          collapsed: false,
          items: [
            { text: 'Introduction', link: '/api/' },
            { text: 'Authentication', link: '/api/authentication' },
            { text: 'Rate Limiting', link: '/api/rate-limiting' },
            { text: 'Error Handling', link: '/api/errors' },
            { text: 'Pagination', link: '/api/pagination' },
          ],
        },
        {
          text: 'REST API',
          collapsed: false,
          items: [
            { text: 'Analytics', link: '/api/analytics' },
            { text: 'Users', link: '/api/users' },
            { text: 'Ghosts', link: '/api/ghosts' },
            { text: 'Lurkers', link: '/api/lurkers' },
            { text: 'Suspicion Scores', link: '/api/suspicion' },
            { text: 'Timeline', link: '/api/timeline' },
            { text: 'Bans', link: '/api/bans' },
            { text: 'Privacy', link: '/api/privacy' },
          ],
        },
        {
          text: 'WebSocket API',
          collapsed: false,
          items: [
            { text: 'WebSocket Events', link: '/api/websocket' },
            { text: 'Real-time Updates', link: '/api/realtime' },
          ],
        },
        {
          text: 'SDK',
          collapsed: false,
          items: [
            { text: 'TypeScript/JavaScript', link: '/api/sdk-typescript' },
            { text: 'Python', link: '/api/sdk-python' },
          ],
        },
      ],
    },

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/subculture-collective/discord-spywatcher',
      },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern:
        'https://github.com/subculture-collective/discord-spywatcher/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Spywatcher Team',
    },
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    lineNumbers: true,
  },
});
