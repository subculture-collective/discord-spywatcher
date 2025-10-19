# Testing Guide

This document provides comprehensive information about the testing infrastructure for the Discord Spywatcher project.

## Table of Contents

- [Overview](#overview)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)

## Overview

The Discord Spywatcher project uses a comprehensive testing strategy including:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test API endpoints and component interactions
- **End-to-End Tests**: Test complete user workflows

### Testing Stack

**Backend:**

- Jest - Test framework
- ts-jest - TypeScript support for Jest
- Supertest - HTTP assertion library

**Frontend:**

- Vitest - Fast unit test framework
- React Testing Library - React component testing
- Playwright - End-to-end testing

## Backend Testing

### Setup

The backend uses Jest with TypeScript support. Configuration is in `backend/jest.config.js`.

### Test Structure

```
backend/
  __tests__/
    unit/
      analytics/      # Analytics function tests
      middleware/     # Middleware tests
      utils/          # Utility function tests
    integration/
      routes/         # API endpoint tests
      auth/           # Authentication flow tests
    e2e/              # End-to-end tests
    __mocks__/        # Mock files (Discord API, etc.)
    setup.ts          # Test configuration and globals
```

### Running Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only E2E tests
npm run test:e2e
```

### Backend Test Examples

#### Unit Test (Analytics Function)

```typescript
import { getGhostScores } from '../../../src/analytics/ghosts';
import { db } from '../../../src/db';

jest.mock('../../../src/db');

describe('Analytics - Ghost Scores', () => {
    it('should calculate ghost scores correctly', async () => {
        const mockTypings = [
            /* mock data */
        ];
        const mockMessages = [
            /* mock data */
        ];

        (db.typingEvent.groupBy as jest.Mock).mockResolvedValue(mockTypings);
        (db.messageEvent.groupBy as jest.Mock).mockResolvedValue(mockMessages);

        const result = await getGhostScores('test-guild-id');

        expect(result).toHaveLength(2);
        expect(result[0].ghostScore).toBeCloseTo(3.33);
    });
});
```

#### Integration Test (API Endpoint)

```typescript
import request from 'supertest';
import app from '../../../src/server';

describe('GET /api/analytics/ghosts', () => {
    it('should return ghost scores', async () => {
        const response = await request(app)
            .get('/api/analytics/ghosts')
            .set('Authorization', `Bearer ${validToken}`)
            .expect(200);

        expect(response.body).toBeInstanceOf(Array);
    });
});
```

### Mocking

#### Discord API Mock

Located in `__tests__/__mocks__/discord.ts`:

```typescript
export const mockDiscordUser = {
    id: '123456789',
    username: 'testuser',
    email: 'test@example.com',
    // ...
};
```

## Frontend Testing

### Setup

The frontend uses Vitest with React Testing Library. Configuration is in `frontend/vite.config.ts`.

### Test Structure

```
frontend/
  src/
    __tests__/
      components/     # React component tests
      hooks/          # Custom hook tests
      pages/          # Page component tests
      store/          # State management tests
      lib/            # API client tests
      integration/    # Integration tests
      __mocks__/      # Mock data and modules
      setup.ts        # Test configuration
  e2e/                # Playwright E2E tests
    specs/            # E2E test specifications
```

### Running Frontend Tests

```bash
cd frontend

# Run all unit/integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

### Frontend Test Examples

#### Component Test

```typescript
import { render, screen } from '@testing-library/react';
import SessionStatus from '../../components/SessionStatus';

describe('SessionStatus Component', () => {
    it('should display user info', () => {
        render(<SessionStatus />);
        expect(screen.getByText('TestUser')).toBeInTheDocument();
    });
});
```

#### Hook Test

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useSession } from '../../hooks/useSession';

describe('useSession hook', () => {
    it('should fetch session data', async () => {
        const { result } = renderHook(() => useSession());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.session).toBeDefined();
    });
});
```

#### Store Test

```typescript
import { useAuth } from '../../store/auth';

describe('Auth Store', () => {
    it('should set access token', () => {
        useAuth.getState().setToken('test-token');
        expect(useAuth.getState().accessToken).toBe('test-token');
    });
});
```

## End-to-End Testing

### Setup

E2E tests use Playwright. Configuration is in `frontend/playwright.config.ts`.

### Running E2E Tests

```bash
cd frontend

# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should login with Discord', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login with Discord');

    // ... test authentication flow

    await expect(page).toHaveURL('/dashboard');
});
```

## Test Coverage

### Coverage Goals

- **Backend**: >80% code coverage
- **Frontend**: >70% code coverage
- **Critical Paths**: 100% coverage

### Viewing Coverage Reports

```bash
# Backend
cd backend
npm run test:coverage
# Open backend/coverage/index.html in browser

# Frontend
cd frontend
npm run test:coverage
# Open frontend/coverage/index.html in browser
```

### Coverage Configuration

Coverage thresholds are configured in:

- Backend: `jest.config.js`
- Frontend: `vite.config.ts`

## Writing Tests

### Best Practices

1. **Test Behavior, Not Implementation**
    - Focus on what the code does, not how it does it
    - Test user-facing behavior and API contracts

2. **Keep Tests Simple and Focused**
    - One test should test one thing
    - Use descriptive test names

3. **Use Proper Mocking**
    - Mock external dependencies (API calls, database)
    - Don't mock the code you're testing

4. **Test Edge Cases**
    - Empty arrays/objects
    - Null/undefined values
    - Error conditions
    - Boundary values

5. **Maintain Test Data**
    - Use factories or fixtures for test data
    - Keep test data minimal but realistic

### Test Naming Convention

```typescript
describe('Component/Function Name', () => {
    describe('Method or Feature', () => {
        it('should [expected behavior] when [condition]', () => {
            // Test implementation
        });
    });
});
```

### Test Organization

```typescript
describe('Component', () => {
    // Setup
    beforeEach(() => {
        // Reset state, clear mocks
    });

    // Happy path tests
    it('should work in normal conditions', () => {});

    // Edge cases
    it('should handle empty data', () => {});
    it('should handle errors', () => {});

    // Cleanup
    afterEach(() => {
        // Cleanup if needed
    });
});
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:

- Pull requests
- Pushes to main branch
- Manual workflow dispatch

### Required Checks

Before merging:

- All unit tests must pass
- All integration tests must pass
- Code coverage must meet thresholds
- E2E tests for critical paths must pass

### Local Pre-commit Testing

```bash
# Run all tests before committing
cd backend && npm test && cd ../frontend && npm test
```

## Troubleshooting

### Common Issues

#### Tests Timeout

```typescript
// Increase timeout for slow tests
jest.setTimeout(10000); // Backend
test.setTimeout(10000); // Frontend
```

#### Mock Issues

```typescript
// Clear mocks between tests
beforeEach(() => {
    jest.clearAllMocks();
});
```

#### Environment Variables

Tests use environment variables from `__tests__/setup.ts`. Add test-specific env vars there.

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure tests cover edge cases
3. Update this guide if adding new test patterns
4. Verify coverage meets thresholds

For questions or issues with tests, please open an issue on GitHub.
