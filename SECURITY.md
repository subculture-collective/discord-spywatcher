# Security Policy

## 🔒 Security Measures

This document outlines the security measures implemented in Discord SpyWatcher to protect against common vulnerabilities and attacks.

### HTTP Security Headers

We use [Helmet.js](https://helmetjs.github.io/) to set secure HTTP headers:

- **Content-Security-Policy (CSP)**: Prevents XSS attacks by controlling allowed content sources
- **Strict-Transport-Security (HSTS)**: Enforces HTTPS connections (1 year max-age)
- **X-Frame-Options**: Prevents clickjacking attacks (set to DENY)
- **X-Content-Type-Options**: Prevents MIME-sniffing attacks
- **X-XSS-Protection**: Enables browser XSS filtering
- **Referrer-Policy**: Controls referrer information (strict-origin-when-cross-origin)

### Rate Limiting

Multiple rate limiters protect against brute force and DoS attacks:

- **Authentication endpoints**: 5 requests per 15 minutes
- **Refresh token endpoint**: 10 requests per 15 minutes
- **General API endpoints**: 100 requests per 15 minutes
- **Admin endpoints**: 30 requests per 15 minutes

### Input Validation

All user input is validated using [Zod](https://zod.dev/) schemas:

- Request body, query parameters, and URL parameters are validated
- Discord IDs are validated to match the correct format (17-19 digits)
- Role changes are restricted to valid enum values
- Invalid requests return detailed error messages

### Authentication & Authorization

- **JWT tokens** with secure secret keys (minimum 32 characters)
- **Access tokens** expire after 15 minutes
- **Refresh tokens** expire after 7 days
- **Token rotation** on refresh to prevent replay attacks
- **Role-based access control** (USER, ADMIN, MODERATOR, BANNED)
- **Admin verification** using environment-configured Discord IDs

### CORS Protection

Strict CORS policy:

- Only whitelisted origins are allowed (configured via `CORS_ORIGINS` env var)
- Credentials are required for cross-origin requests
- Preflight requests are properly handled
- Rejected origins are logged for monitoring

### Request Size Limits

- Maximum request size: 10MB
- Prevents DoS attacks via large payloads
- Applied to both JSON and URL-encoded bodies

### Database Security

- **Prisma ORM** with parameterized queries prevents SQL injection
- **Connection string** stored securely in environment variables
- **Sensitive data** (access tokens, refresh tokens) stored in database
- Database connections should use SSL/TLS in production

### Secrets Management

- All secrets stored in environment variables (never in code)
- `.env` file excluded from version control
- Separate `.env.example` with secure defaults
- Environment variable validation on startup
- Secret strength validation for JWT keys

### Discord Bot Security

- Bot token validated for correct format (minimum 50 characters)
- Guild authorization checks before operations
- Permission scoping follows principle of least privilege
- Command validation prevents unauthorized actions

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Preferred Method**: Create a [private security advisory](https://github.com/subculture-collective/discord-spywatcher/security/advisories/new) on GitHub
2. **Alternative**: Contact the maintainers directly through GitHub

**Please do NOT create public issues for security vulnerabilities.**

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Time

- Initial response: Within 48 hours
- Status update: Every 72 hours
- Resolution target: 7-14 days for critical issues

## 🛡️ Security Best Practices for Deployment

### Environment Variables

1. Never commit `.env` files to version control
2. Use strong, randomly generated secrets for JWT keys:
    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```
3. Rotate secrets regularly (quarterly recommended)
4. Use different secrets for each environment (dev, staging, production)

### Database

1. Use SSL/TLS for database connections in production
2. Configure least-privilege database users
3. Enable automatic backups with encryption
4. Regularly audit database access logs

### Network Security

1. Use HTTPS in production (enforce with HSTS)
2. Configure firewall rules to restrict access
3. Use a reverse proxy (nginx, Cloudflare) for additional protection
4. Enable DDoS protection

### Monitoring & Logging

1. Monitor for unusual activity patterns
2. Set up alerts for authentication failures
3. Log security events (rate limit hits, blocked CORS requests)
4. Never log sensitive data (tokens, passwords, API keys)

### Docker Security

1. Use non-root users in containers
2. Keep base images updated
3. Scan images for vulnerabilities
4. Use multi-stage builds to minimize attack surface

## 🔍 Security Audit Checklist

Regular security audits should include:

- [ ] Dependency vulnerability scan (`npm audit`)
- [ ] Code security analysis (CodeQL, ESLint security plugin)
- [ ] Secret scanning (TruffleHog)
- [ ] Access control review
- [ ] Rate limiting effectiveness
- [ ] Log review for security events
- [ ] Environment variable audit
- [ ] Database security review

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Discord Bot Security](https://discord.com/developers/docs/topics/oauth2)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## 📝 Changelog

### 2025-10-20 - Initial Security Hardening

- Implemented Helmet.js security headers
- Added comprehensive rate limiting
- Implemented input validation with Zod
- Enhanced CORS configuration
- Added request size limits
- Removed hardcoded secrets
- Created security utilities
- Added security documentation
