# Testing Guide

Comprehensive testing documentation for the Spywatcher project, covering unit tests, integration tests, and end-to-end tests.

## Testing Philosophy

Our testing strategy follows these principles:

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how
2. **Write Tests First**: Consider test-driven development (TDD) when appropriate
3. **Comprehensive Coverage**: Aim for >80% code coverage
4. **Fast Feedback**: Tests should run quickly
5. **Independent Tests**: Each test should be isolated and independent

## Testing Stack

### Backend Testing

- **Jest**: Test framework and test runner
- **ts-jest**: TypeScript support for Jest
- **Supertest**: HTTP assertions for API testing
- **@testing-library**: Component testing utilities

### Frontend Testing

- **Vitest**: Fast unit test runner (Vite-native)
- **React Testing Library**: React component testing
- **Playwright**: End-to-end testing
- **MSW (Mock Service Worker)**: API mocking

## Test Organization

### Backend Test Structure

```
backend/
├── __tests__/
│   ├── unit/                  # Unit tests
│   │   ├── analytics/         # Analytics function tests
│   │   ├── utils/             # Utility function tests
│   │   └── middleware/        # Middleware tests
│   ├── integration/           # Integration tests
│   │   ├── routes/            # API endpoint tests
│   │   ├── auth/              # Authentication flow tests
│   │   └── database/          # Database integration tests
│   ├── e2e/                   # End-to-end tests
│   ├── __mocks__/             # Mock implementations
│   │   ├── discord.js.ts      # Discord API mocks
│   │   └── prisma.ts          # Prisma mocks
│   └── setup.ts               # Test configuration
└── src/
```

### Frontend Test Structure

```
frontend/
├── src/
│   └── __tests__/             # Co-located with components
│       ├── components/        # Component tests
│       ├── hooks/             # Custom hook tests
│       └── utils/             # Utility tests
├── e2e/                       # Playwright E2E tests
│   ├── auth.spec.ts
│   ├── dashboard.spec.ts
│   └── analytics.spec.ts
└── playwright.config.ts
```

## Running Tests

### Backend Tests

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

# Run specific test file
npm test -- auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="ghost score"
```

### Frontend Tests

```bash
cd frontend

# Run unit/integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in specific browser
npm run test:e2e -- --project=chromium
```

## Writing Unit Tests

### Backend Unit Test Example

Testing a utility function:

```typescript
// src/analytics/ghost.ts
export function calculateGhostScore(
    presenceCount: number,
    messageCount: number
): number {
    if (presenceCount === 0) return 0;
    return ((presenceCount - messageCount) / presenceCount) * 100;
}

// __tests__/unit/analytics/ghost.test.ts
import { calculateGhostScore } from '../../../src/analytics/ghost';

describe('Analytics - Ghost Score', () => {
    describe('calculateGhostScore', () => {
        it('should return 80 when user has 100 presences and 20 messages', () => {
            const score = calculateGhostScore(100, 20);
            expect(score).toBe(80);
        });

        it('should return 0 when presence count is 0', () => {
            const score = calculateGhostScore(0, 0);
            expect(score).toBe(0);
        });

        it('should return 100 when user has no messages', () => {
            const score = calculateGhostScore(100, 0);
            expect(score).toBe(100);
        });

        it('should return negative score when messages exceed presences', () => {
            const score = calculateGhostScore(50, 100);
            expect(score).toBe(-100);
        });

        it('should handle decimal results correctly', () => {
            const score = calculateGhostScore(100, 33);
            expect(score).toBe(67);
        });
    });
});
```

### Frontend Unit Test Example

Testing a React component:

```tsx
// src/components/UserCard.tsx
interface UserCardProps {
    user: User;
    onSelect: (id: string) => void;
}

export function UserCard({ user, onSelect }: UserCardProps) {
    return (
        <div
            className="user-card"
            onClick={() => onSelect(user.id)}
            data-testid="user-card"
        >
            <h3>{user.username}</h3>
            <p>{user.email}</p>
        </div>
    );
}

// src/__tests__/components/UserCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from '../../components/UserCard';

describe('UserCard', () => {
    const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
    };

    it('should render user information', () => {
        render(<UserCard user={mockUser} onSelect={jest.fn()} />);
        
        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should call onSelect when clicked', () => {
        const handleSelect = jest.fn();
        render(<UserCard user={mockUser} onSelect={handleSelect} />);
        
        fireEvent.click(screen.getByTestId('user-card'));
        
        expect(handleSelect).toHaveBeenCalledWith('123');
        expect(handleSelect).toHaveBeenCalledTimes(1);
    });
});
```

### Testing Custom Hooks

```typescript
// src/hooks/useAnalytics.ts
export function useAnalytics(userId: string) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics(userId)
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [userId]);

    return { data, loading, error };
}

// src/__tests__/hooks/useAnalytics.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useAnalytics } from '../../hooks/useAnalytics';

jest.mock('../../lib/api');

describe('useAnalytics', () => {
    it('should fetch analytics data on mount', async () => {
        const mockData = { ghostScore: 80, lurkerScore: 20 };
        (fetchAnalytics as jest.Mock).mockResolvedValue(mockData);

        const { result } = renderHook(() => useAnalytics('user123'));

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual(mockData);
        expect(result.current.error).toBeNull();
    });

    it('should handle errors', async () => {
        const mockError = new Error('API error');
        (fetchAnalytics as jest.Mock).mockRejectedValue(mockError);

        const { result } = renderHook(() => useAnalytics('user123'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toEqual(mockError);
    });
});
```

## Writing Integration Tests

### API Endpoint Testing

```typescript
// __tests__/integration/routes/analytics.test.ts
import request from 'supertest';
import { app } from '../../../src/server';
import { prisma } from '../../../src/db';
import { generateTestToken } from '../../helpers/auth';

describe('Analytics API', () => {
    let authToken: string;

    beforeAll(async () => {
        // Set up test database
        await prisma.$connect();
        authToken = generateTestToken({ id: 'test-user', role: 'admin' });
    });

    afterAll(async () => {
        // Clean up test database
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Clear relevant tables before each test
        await prisma.presence.deleteMany();
        await prisma.message.deleteMany();
    });

    describe('GET /api/analytics/ghosts', () => {
        it('should return ghost users sorted by score', async () => {
            // Arrange - Create test data
            await prisma.user.create({
                data: {
                    id: 'user1',
                    discordId: '123',
                    username: 'ghost1',
                },
            });

            await prisma.presence.createMany({
                data: [
                    { userId: 'user1', status: 'online', timestamp: new Date() },
                    { userId: 'user1', status: 'online', timestamp: new Date() },
                ],
            });

            // Act
            const response = await request(app)
                .get('/api/analytics/ghosts')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Assert
            expect(response.body).toHaveProperty('users');
            expect(Array.isArray(response.body.users)).toBe(true);
            expect(response.body.users[0]).toHaveProperty('ghostScore');
        });

        it('should return 401 when not authenticated', async () => {
            await request(app)
                .get('/api/analytics/ghosts')
                .expect(401);
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/analytics/ghosts?limit=10&offset=0')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.users.length).toBeLessThanOrEqual(10);
            expect(response.body).toHaveProperty('total');
        });
    });
});
```

### Database Integration Testing

```typescript
// __tests__/integration/database/user.test.ts
import { prisma } from '../../../src/db';
import { UserService } from '../../../src/services/UserService';

describe('User Database Integration', () => {
    let userService: UserService;

    beforeAll(async () => {
        userService = new UserService(prisma);
    });

    afterEach(async () => {
        await prisma.user.deleteMany();
    });

    it('should create user with associations', async () => {
        const userData = {
            discordId: '123456',
            username: 'testuser',
            discriminator: '0001',
        };

        const user = await userService.createUser(userData);

        expect(user).toHaveProperty('id');
        expect(user.discordId).toBe(userData.discordId);

        const found = await prisma.user.findUnique({
            where: { id: user.id },
        });

        expect(found).not.toBeNull();
    });

    it('should handle unique constraint violations', async () => {
        const userData = {
            discordId: '123456',
            username: 'testuser',
            discriminator: '0001',
        };

        await userService.createUser(userData);

        await expect(userService.createUser(userData)).rejects.toThrow();
    });
});
```

## Writing End-to-End Tests

### Backend E2E Testing

```typescript
// __tests__/e2e/auth-flow.test.ts
import request from 'supertest';
import { app } from '../../src/server';

describe('Authentication Flow E2E', () => {
    it('should complete full OAuth flow', async () => {
        // 1. Get Discord OAuth URL
        const authResponse = await request(app)
            .get('/api/auth/discord')
            .expect(302);

        expect(authResponse.header.location).toContain('discord.com/oauth2/authorize');

        // 2. Simulate callback with code
        const code = 'test-oauth-code';
        const callbackResponse = await request(app)
            .get(`/api/auth/callback?code=${code}`)
            .expect(302);

        // 3. Extract tokens from redirect
        const redirectUrl = new URL(callbackResponse.header.location);
        const accessToken = redirectUrl.searchParams.get('access_token');
        const refreshToken = redirectUrl.searchParams.get('refresh_token');

        expect(accessToken).toBeTruthy();
        expect(refreshToken).toBeTruthy();

        // 4. Use access token to fetch user info
        const meResponse = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

        expect(meResponse.body).toHaveProperty('id');
        expect(meResponse.body).toHaveProperty('username');

        // 5. Refresh the token
        const refreshResponse = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken })
            .expect(200);

        expect(refreshResponse.body).toHaveProperty('accessToken');

        // 6. Logout
        await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

        // 7. Verify token is invalidated
        await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(401);
    });
});
```

### Frontend E2E Testing with Playwright

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test('should login successfully', async ({ page }) => {
        // Navigate to app
        await page.goto('http://localhost:5173');

        // Click login button
        await page.click('text=Sign in with Discord');

        // Wait for Discord OAuth (mocked in test environment)
        await page.waitForURL('**/auth/callback*');

        // Should redirect to dashboard
        await page.waitForURL('**/dashboard');

        // Verify user is logged in
        await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should display error on failed login', async ({ page }) => {
        await page.goto('http://localhost:5173');
        
        // Mock failed OAuth
        await page.route('**/api/auth/discord', route => {
            route.fulfill({ status: 500 });
        });

        await page.click('text=Sign in with Discord');

        await expect(page.locator('text=Login failed')).toBeVisible();
    });
});

// e2e/dashboard.spec.ts
test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Set up authenticated session
        await page.goto('http://localhost:5173');
        await page.evaluate(() => {
            localStorage.setItem('auth_token', 'test-token');
        });
    });

    test('should display analytics data', async ({ page }) => {
        await page.goto('http://localhost:5173/dashboard');

        // Wait for data to load
        await expect(page.locator('[data-testid="ghost-count"]')).toBeVisible();
        await expect(page.locator('[data-testid="lurker-count"]')).toBeVisible();

        // Verify charts are rendered
        await expect(page.locator('.recharts-wrapper')).toBeVisible();
    });

    test('should filter users by ghost score', async ({ page }) => {
        await page.goto('http://localhost:5173/dashboard');

        // Apply filter
        await page.click('[data-testid="filter-button"]');
        await page.fill('[data-testid="ghost-score-min"]', '50');
        await page.click('[data-testid="apply-filter"]');

        // Verify filtered results
        const users = page.locator('[data-testid="user-card"]');
        await expect(users).toHaveCount(await users.count());

        // Each user should have ghost score >= 50
        const scores = await users.evaluateAll(elements =>
            elements.map(el => 
                parseInt(el.getAttribute('data-ghost-score') || '0')
            )
        );
        expect(scores.every(score => score >= 50)).toBe(true);
    });
});
```

## Mocking

### Mocking External APIs

```typescript
// __tests__/__mocks__/discord.js.ts
export const Client = jest.fn(() => ({
    login: jest.fn().mockResolvedValue('token'),
    on: jest.fn(),
    user: {
        id: 'bot-id',
        tag: 'TestBot#0001',
    },
}));

export const GatewayIntentBits = {
    Guilds: 1,
    GuildPresences: 2,
    GuildMessages: 4,
};
```

### Mocking Database

```typescript
// __tests__/__mocks__/prisma.ts
export const prisma = {
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    presence: {
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
    },
};
```

### Mock Service Worker (MSW) for Frontend

```typescript
// src/__tests__/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
    rest.get('/api/analytics/ghosts', (req, res, ctx) => {
        return res(
            ctx.json({
                users: [
                    { id: '1', username: 'ghost1', ghostScore: 90 },
                    { id: '2', username: 'ghost2', ghostScore: 85 },
                ],
                total: 2,
            })
        );
    }),

    rest.post('/api/auth/login', (req, res, ctx) => {
        return res(
            ctx.json({
                accessToken: 'test-token',
                refreshToken: 'test-refresh',
            })
        );
    }),
];

// src/__tests__/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// src/__tests__/setup.ts
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Test Coverage

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Coverage report is generated in ./coverage/
# Open coverage/lcov-report/index.html in browser
```

### Coverage Thresholds

The project enforces minimum coverage thresholds:

```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### What to Test

**High Priority (Must Test):**
- Business logic and calculations
- Authentication and authorization
- API endpoints
- Database operations
- Error handling
- Security-critical code

**Medium Priority (Should Test):**
- UI components with complex logic
- Custom hooks
- Utility functions
- Middleware

**Low Priority (Nice to Have):**
- Simple presentational components
- Configuration files
- Type definitions

## Best Practices

### 1. Test Isolation

Each test should be independent:

```typescript
// ✅ Good
describe('UserService', () => {
    beforeEach(async () => {
        await prisma.user.deleteMany(); // Clean slate
    });

    it('should create user', async () => {
        const user = await userService.create({ username: 'test' });
        expect(user).toBeDefined();
    });
});

// ❌ Bad - Tests depend on each other
describe('UserService', () => {
    let createdUser;

    it('should create user', async () => {
        createdUser = await userService.create({ username: 'test' });
    });

    it('should find user', async () => {
        const found = await userService.findById(createdUser.id);
        expect(found).toBeDefined();
    });
});
```

### 2. Use Descriptive Test Names

```typescript
// ✅ Good
it('should return 400 when email format is invalid')
it('should calculate ghost score as 80 when user has 100 presences and 20 messages')

// ❌ Bad
it('validates email')
it('ghost score works')
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should return filtered users', async () => {
    // Arrange - Set up test data
    await createTestUsers([
        { id: '1', ghostScore: 90 },
        { id: '2', ghostScore: 50 },
    ]);

    // Act - Execute the code under test
    const result = await getGhostUsers({ minScore: 75 });

    // Assert - Verify the results
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
});
```

### 4. Test Edge Cases

```typescript
describe('calculateGhostScore', () => {
    it('should handle zero presences', () => {
        expect(calculateGhostScore(0, 0)).toBe(0);
    });

    it('should handle negative inputs', () => {
        expect(() => calculateGhostScore(-1, 5)).toThrow();
    });

    it('should handle very large numbers', () => {
        expect(calculateGhostScore(Number.MAX_SAFE_INTEGER, 1000)).toBeDefined();
    });
});
```

### 5. Mock External Dependencies

```typescript
// ✅ Good - Mock external services
jest.mock('../services/DiscordService');

it('should handle Discord API errors', async () => {
    discordService.getUser.mockRejectedValue(new Error('API error'));
    
    await expect(fetchUserData('123')).rejects.toThrow('API error');
});

// ❌ Bad - Making real API calls in tests
it('should fetch user from Discord', async () => {
    const user = await discordClient.users.fetch('123'); // Real API call
    expect(user).toBeDefined();
});
```

## Continuous Integration

Tests run automatically on:

- **Pull Requests**: All tests must pass
- **Main Branch**: Full test suite with coverage
- **Nightly**: Extended E2E tests

### CI Configuration

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run backend tests
        run: cd backend && npm test -- --coverage
      
      - name: Run frontend tests
        run: cd frontend && npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Debugging Tests

### Running Single Test

```bash
# Backend
npm test -- path/to/test.ts

# Frontend
npm test -- path/to/test.tsx
```

### Debug Mode

```bash
# Backend - Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Frontend - Browser debugging
npm test -- --inspect --inspect-brk
```

### VS Code Debug Configuration

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Next Steps

- [Testing Requirements](./test-requirements)
- [Code Style Guide](./code-style)
- [Contributing Guide](./contributing)
