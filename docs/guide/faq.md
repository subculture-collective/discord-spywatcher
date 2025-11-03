# Frequently Asked Questions

Common questions about Spywatcher.

## General

### What is Spywatcher?

Spywatcher is a Discord surveillance and analytics tool that monitors user presence, messages, and behavior patterns to provide insights about your server.

### Is Spywatcher free?

Spywatcher has multiple tiers:
- **FREE**: Basic features, limited API access
- **PRO**: Advanced features, higher quotas
- **ENTERPRISE**: Full features, unlimited access

### Is my data secure?

Yes. Spywatcher uses:
- Discord OAuth2 authentication
- Encrypted data storage
- Secure API connections
- Privacy controls

## Setup and Configuration

### How do I install Spywatcher?

See the [Installation Guide](./installation) for detailed instructions. The easiest method is using Docker.

### What permissions does the bot need?

Required permissions:
- View Channels
- Read Message History
- View Server Insights

Privileged intents:
- Presence Intent
- Server Members Intent
- Message Content Intent

### Can I monitor multiple servers?

Yes! You can monitor any server where the Spywatcher bot is present and you have appropriate permissions.

## Features

### What is ghost detection?

Ghost detection identifies users who are frequently online but rarely participate. See [Ghost Detection Guide](./ghost-detection).

### How are suspicion scores calculated?

Suspicion scores use multiple factors including presence patterns, message activity, and behavioral changes. See [Suspicion Scores](./suspicion-scores).

### Can I export data?

Yes, you can export data in CSV, JSON, or PDF formats from any view.

### Does Spywatcher work with voice channels?

Spywatcher primarily tracks presence and text messages. Voice channel tracking is limited to presence in voice channels.

## Privacy and Security

### What data does Spywatcher collect?

Spywatcher collects:
- User presence events
- Message counts (not content by default)
- User roles and permissions
- Timestamp data

### Can users opt out?

Yes, users can request data deletion and opt out of tracking through privacy settings.

### Is message content stored?

By default, only message counts are stored, not content. Message content tracking can be enabled but requires explicit consent.

### Who can see the analytics?

Only server administrators and users with appropriate permissions can access analytics for their servers.

## Technical

### What tech stack is used?

- Backend: Node.js, Express, TypeScript, Prisma
- Frontend: React, Vite, Tailwind CSS
- Database: PostgreSQL
- Cache: Redis
- Bot: discord.js

### Can I self-host Spywatcher?

Yes! Spywatcher is open-source. See the [Installation Guide](./installation) and [Deployment Guide](/developer/deployment).

### Is there an API?

Yes! Spywatcher provides a comprehensive REST API. See [API Documentation](/api/).

### How do I contribute?

See the [Contributing Guide](/developer/contributing) for information on contributing to Spywatcher.

## Troubleshooting

### Bot is offline

Check:
1. Bot token is correct
2. Privileged intents are enabled
3. Bot has been invited to server
4. Backend service is running

### No data showing

Ensure:
1. Bot has been running for some time
2. Bot has proper permissions
3. Users are active in the server
4. Date range filters are appropriate

### Authentication fails

Try:
1. Clearing browser cache
2. Using different browser
3. Checking OAuth2 configuration
4. Re-inviting the bot

For more issues, see [Troubleshooting](./troubleshooting).

## Support

### How do I get help?

- Read the documentation
- Check [GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues)
- Join the community Discord (coming soon)

### How do I report bugs?

Open an issue on [GitHub](https://github.com/subculture-collective/discord-spywatcher/issues) with:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Logs and error messages

### How do I request features?

Open a feature request on [GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues) with:
- Description of the feature
- Use case
- Why it would be valuable

## More Questions?

If your question isn't answered here:
- Check the relevant guide sections
- Search [GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues)
- Open a new issue

::: tip
The documentation search (Ctrl/Cmd + K) can help you find answers quickly!
:::
