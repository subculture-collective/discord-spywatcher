# Message Logger Plugin

A simple example plugin that logs all Discord messages to a file.

## Features

- Logs all non-bot messages to a timestamped log file
- Tracks total message count
- Provides health check with statistics

## Installation

This plugin is included as an example. To enable:

1. Copy to `backend/plugins/message-logger/`
2. Restart SpyWatcher
3. Check logs for initialization message

## Configuration

No configuration required. Logs are stored in the plugin's data directory.

## Log Format

```
[2024-01-01T12:00:00.000Z] username in #channel-name: message content
```

## Permissions

- `discord:events` - Listen to Discord message events
- `fs:access` - Write to log file in plugin data directory

## Usage

Once installed, the plugin automatically logs all messages. Check the health endpoint:

```bash
curl http://localhost:3001/api/plugins/message-logger/health
```

## Output

Log files are stored in: `backend/plugin-data/message-logger/messages.log`
