# CI/CD Pipeline Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Discord Spywatcher project.

## Overview

The CI/CD pipeline is implemented using GitHub Actions and consists of multiple workflows that handle testing, security scanning, building, and deployment of both backend and frontend components.

## Workflows

### 1. Backend CI (`backend-ci.yml`)

**Triggers:**

- Push to `main` branch (when backend files change)
- Pull requests to `main` branch (when backend files change)

**Jobs:**

- **Lint**: Runs linting checks (placeholder until linting is configured)
- **TypeCheck**: Validates TypeScript compilation without emitting files
- **Prisma**: Validates Prisma schema and generates client
- **Test**: Runs test suite (placeholder until tests are implemented)
- **Build**: Compiles TypeScript to JavaScript and uploads build artifacts

**Artifacts:**

- `backend-dist`: Compiled JavaScript files (retained for 7 days)

### 2. Frontend CI (`frontend-ci.yml`)

**Triggers:**

- Push to `main` branch (when frontend files change)
- Pull requests to `main` branch (when frontend files change)

**Jobs:**

- **Lint**: Runs ESLint checks
- **TypeCheck**: Validates TypeScript compilation
- **Test**: Runs test suite (placeholder until tests are implemented)
- **Build**: Builds production bundle with Vite

**Artifacts:**

- `frontend-dist`: Production build output (retained for 7 days)

**Note:** Some jobs use `continue-on-error: true` due to pre-existing code issues. These should be fixed in a separate PR.

### 3. Security Scan (`security.yml`)

**Triggers:**

- Push to `main` branch
- Pull requests to `main` branch
- Scheduled daily at 2 AM UTC
- Manual workflow dispatch

**Jobs:**

- **CodeQL**: Static Application Security Testing (SAST) using GitHub's CodeQL
- **Dependency Check (Backend)**: Scans backend dependencies for known vulnerabilities
- **Dependency Check (Frontend)**: Scans frontend dependencies for known vulnerabilities
- **Secrets Scan**: Detects leaked secrets using TruffleHog

### 4. Deploy (`deploy.yml`)

**Triggers:**

- Push to `main` branch
- Manual workflow dispatch with environment selection

**Jobs:**

- **Deploy Backend**:
    - Builds backend application
    - Runs database migrations
    - Deploys to specified environment (staging/production)
    - Includes health check placeholder
- **Deploy Frontend**:
    - Builds frontend for production
    - Deploys to hosting service
    - Includes health check placeholder

- **Smoke Tests**:
    - Runs after both backend and frontend deployments
    - Validates deployment health
    - Triggers rollback on failure

**Environments:**

- `staging`: Default environment for automatic deployments
- `production`: Requires manual workflow dispatch

### 5. PR Labeler (`pr-labeler.yml`)

**Triggers:**

- Pull request opened, synchronized, or reopened

**Purpose:**

- Automatically labels PRs based on changed files
- Labels: backend, frontend, ci/cd, dependencies, documentation, database

## Dependency Management

### Dependabot Configuration

Dependabot is configured to automatically create PRs for dependency updates:

- **Backend**: Weekly updates on Mondays, max 5 open PRs
- **Frontend**: Weekly updates on Mondays, max 5 open PRs
- **GitHub Actions**: Weekly updates on Mondays

Dependencies are grouped by type (development vs production) and update severity (minor/patch).

## Required Secrets

The following secrets need to be configured in GitHub repository settings:

### Backend Deployment

- `DATABASE_URL`: Database connection string for production/staging

### Frontend Deployment

- `VITE_API_URL`: Backend API URL for the frontend

### Optional Deployment Secrets

(Depending on deployment target)

- SSH keys for server deployment
- Cloud provider credentials (AWS, Azure, GCP)
- Container registry credentials
- Hosting platform API keys (Vercel, Netlify, etc.)

## Branch Protection Rules

To enforce CI/CD best practices, configure the following branch protection rules for `main`:

1. **Require pull request reviews before merging**
    - Require at least 1 approval

2. **Require status checks to pass before merging**
    - Backend CI: Build
    - Frontend CI: Build
    - Security Scan: CodeQL

3. **Require branches to be up to date before merging**

4. **Include administrators**

## Build Times

Current approximate build times:

- Backend CI: ~2-3 minutes
- Frontend CI: ~2-3 minutes
- Security Scan: ~5-10 minutes
- Full Deployment: ~5-8 minutes

## Extending the Pipeline

### Adding Tests

When tests are implemented:

1. Remove the placeholder test scripts from `package.json`
2. Update the test jobs in CI workflows to actually run tests
3. Add code coverage reporting:

    ```yaml
    - name: Run tests with coverage
      run: npm run test:coverage

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
    ```

### Adding Actual Deployment

Replace the placeholder deployment steps with actual deployment logic:

**Example for backend deployment to a server:**

```yaml
- name: Deploy to server
  uses: appleboy/scp-action@master
  with:
      host: ${{ secrets.SERVER_HOST }}
      username: ${{ secrets.SERVER_USER }}
      key: ${{ secrets.SSH_PRIVATE_KEY }}
      source: 'backend/dist/*'
      target: '/var/www/backend'
```

**Example for frontend deployment to Vercel:**

```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
      vercel-token: ${{ secrets.VERCEL_TOKEN }}
      vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
      vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
      working-directory: ./frontend
```

### Adding Linting to Backend

To enable linting for the backend:

1. Install ESLint and TypeScript ESLint:

    ```bash
    cd backend
    npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
    ```

2. Create `backend/eslint.config.js`

3. Update the lint script in `backend/package.json`:

    ```json
    "lint": "eslint . --ext .ts"
    ```

4. Remove `continue-on-error` from the Backend CI lint job

## Monitoring and Notifications

Consider adding workflow status notifications:

- Slack notifications on deployment
- Email alerts on CI failures
- GitHub status checks on PRs

## Troubleshooting

### Build Failures

1. Check the workflow run logs in GitHub Actions tab
2. Verify all required secrets are configured
3. Ensure dependencies are up to date
4. Check for TypeScript compilation errors

### Deployment Failures

1. Verify environment secrets are correct
2. Check database connectivity
3. Review deployment service logs
4. Verify health check endpoints

### Security Scan Failures

1. Review CodeQL alerts in Security tab
2. Check npm audit output for vulnerability details
3. Update vulnerable dependencies
4. Review TruffleHog output for exposed secrets

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Prisma CI/CD Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [CodeQL Documentation](https://codeql.github.com/docs/)
