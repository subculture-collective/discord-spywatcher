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

# Check if Sentry CLI is available
if ! command -v sentry-cli &> /dev/null; then
    echo "⚠️  Sentry CLI not found. Using npx to run @sentry/cli"
    echo "   To install globally: npm install -g @sentry/cli"
    SENTRY_CLI="npx @sentry/cli"
else
    SENTRY_CLI="sentry-cli"
fi

# Create a new release
echo "🏷️  Creating release: $SENTRY_RELEASE"
$SENTRY_CLI releases new "$SENTRY_RELEASE" --org "$SENTRY_ORG" --project "$SENTRY_PROJECT"

# Upload source maps
echo "📤 Uploading source maps from ./dist"

# Determine strip prefix - use custom path if provided, otherwise use current directory
STRIP_PREFIX="${SENTRY_STRIP_PREFIX:-$(pwd)}"

$SENTRY_CLI releases files "$SENTRY_RELEASE" upload-sourcemaps ./dist \
    --org "$SENTRY_ORG" \
    --project "$SENTRY_PROJECT" \
    --rewrite \
    --strip-prefix "$STRIP_PREFIX"

# Finalize the release
echo "✅ Finalizing release"
$SENTRY_CLI releases finalize "$SENTRY_RELEASE" --org "$SENTRY_ORG" --project "$SENTRY_PROJECT"

# Optional: Set deployment
if [ -n "$SENTRY_ENVIRONMENT" ]; then
    echo "🚀 Setting deployment for environment: $SENTRY_ENVIRONMENT"
    $SENTRY_CLI releases deploys "$SENTRY_RELEASE" new --env "$SENTRY_ENVIRONMENT" \
        --org "$SENTRY_ORG" \
        --project "$SENTRY_PROJECT"
fi

echo "✅ Source maps uploaded successfully!"
