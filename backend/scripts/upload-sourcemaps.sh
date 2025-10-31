#!/bin/bash
# Upload source maps to Sentry for backend
# This script should be run after building the backend in production

set -e

# Check if required environment variables are set
if [ -z "$SENTRY_AUTH_TOKEN" ]; then
    echo "❌ SENTRY_AUTH_TOKEN is not set"
    exit 1
fi

if [ -z "$SENTRY_ORG" ]; then
    echo "❌ SENTRY_ORG is not set"
    exit 1
fi

if [ -z "$SENTRY_PROJECT" ]; then
    echo "❌ SENTRY_PROJECT is not set"
    exit 1
fi

# Default release to git commit SHA if not set
if [ -z "$SENTRY_RELEASE" ]; then
    SENTRY_RELEASE=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    echo "ℹ️  SENTRY_RELEASE not set, using git SHA: $SENTRY_RELEASE"
fi

echo "📦 Uploading source maps to Sentry"
echo "   Organization: $SENTRY_ORG"
echo "   Project: $SENTRY_PROJECT"
echo "   Release: $SENTRY_RELEASE"

# Install Sentry CLI if not already installed
if ! command -v sentry-cli &> /dev/null; then
    echo "📥 Installing Sentry CLI..."
    npm install -g @sentry/cli
fi

# Create a new release
echo "🏷️  Creating release: $SENTRY_RELEASE"
sentry-cli releases new "$SENTRY_RELEASE" --org "$SENTRY_ORG" --project "$SENTRY_PROJECT"

# Upload source maps
echo "📤 Uploading source maps from ./dist"
sentry-cli releases files "$SENTRY_RELEASE" upload-sourcemaps ./dist \
    --org "$SENTRY_ORG" \
    --project "$SENTRY_PROJECT" \
    --rewrite \
    --strip-prefix /home/runner/work/discord-spywatcher/discord-spywatcher/backend

# Finalize the release
echo "✅ Finalizing release"
sentry-cli releases finalize "$SENTRY_RELEASE" --org "$SENTRY_ORG" --project "$SENTRY_PROJECT"

# Optional: Set deployment
if [ -n "$SENTRY_ENVIRONMENT" ]; then
    echo "🚀 Setting deployment for environment: $SENTRY_ENVIRONMENT"
    sentry-cli releases deploys "$SENTRY_RELEASE" new --env "$SENTRY_ENVIRONMENT" \
        --org "$SENTRY_ORG" \
        --project "$SENTRY_PROJECT"
fi

echo "✅ Source maps uploaded successfully!"
