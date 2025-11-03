# Discord OAuth Setup

Learn how to connect your Discord account to Spywatcher for secure authentication.

## What is Discord OAuth?

OAuth2 is Discord's secure authentication protocol that allows Spywatcher to verify your identity without accessing your password.

## Setup Steps

### 1. Click "Sign in with Discord"

On the Spywatcher login page, click the Discord sign-in button.

### 2. Review Permissions

Discord will show the permissions Spywatcher requests:
- View your Discord profile
- View your server memberships
- Access basic account information

### 3. Authorize

Click "Authorize" to grant permissions.

### 4. Redirected

You'll be redirected back to Spywatcher, now logged in.

## Troubleshooting

### Authorization Failed

- Ensure you're logged into Discord
- Check browser popup blockers
- Try a different browser
- Clear cookies and try again

### Permissions Denied

If you denied permissions, you'll need to re-authorize the application.

::: tip Security
Spywatcher never sees or stores your Discord password. OAuth2 provides secure, token-based authentication.
:::

## Related

- [Installation Guide](./installation)
- [Quick Start](./quick-start)
