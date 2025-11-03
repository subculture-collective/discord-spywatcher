# Testing Requirements

All contributions to Spywatcher must meet our testing standards.

## Coverage Requirements

### Minimum Coverage

- **Backend**: 80% code coverage
- **Frontend**: 70% code coverage

### What Must Be Tested

**Required:**

- [ ] Business logic and calculations
- [ ] API endpoints (integration tests)
- [ ] Authentication and authorization
- [ ] Database operations
- [ ] Error handling
- [ ] Security-critical code

**Recommended:**

- [ ] UI components with complex logic
- [ ] Custom React hooks
- [ ] Utility functions
- [ ] Middleware

**Optional:**

- Simple presentational components
- Configuration files
- Type definitions

## Types of Tests Required

### Unit Tests

Required for:

- Pure functions
- Business logic
- Utilities
- Calculations

**Example:**

```typescript
describe('calculateGhostScore', () => {
    it('should return correct score', () => {
        expect(calculateGhostScore(100, 20)).toBe(80);
    });
});
```

### Integration Tests

Required for:

- API endpoints
- Database queries
- External service interactions

**Example:**

```typescript
describe('GET /api/analytics/ghosts', () => {
    it('should return ghost users', async () => {
        const response = await request(app)
            .get('/api/analytics/ghosts')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body.users).toBeDefined();
    });
});
```

### End-to-End Tests

Recommended for:

- Critical user flows
- Complex features
- Integration between services

**Example:**

```typescript
test('complete authentication flow', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('text=Sign in with Discord');
    await page.waitForURL('**/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
});
```

## Test Quality Standards

### Good Test Characteristics

✅ **Independent**: Each test runs independently
✅ **Repeatable**: Same result every time
✅ **Fast**: Tests run quickly
✅ **Clear**: Test name describes what it tests
✅ **Focused**: Tests one thing at a time

### Test Structure

Use Arrange-Act-Assert (AAA) pattern:

```typescript
it('should do something', () => {
    // Arrange - Set up test data
    const input = createTestData();

    // Act - Execute the code
    const result = functionUnderTest(input);

    // Assert - Verify the result
    expect(result).toEqual(expectedOutput);
});
```

## Running Tests

### Before Committing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Coverage must meet thresholds
# Backend: 80%
# Frontend: 70%
```

### CI/CD Requirements

All PRs must:

- [ ] Pass all tests
- [ ] Meet coverage thresholds
- [ ] Have no failing tests
- [ ] Include tests for new features
- [ ] Include tests for bug fixes

## Writing Tests

See the comprehensive [Testing Guide](./testing) for:

- Detailed testing strategies
- Test examples for all scenarios
- Mocking and stubbing
- Best practices
- Tools and frameworks

## Pre-Commit Checklist

Before submitting a PR:

- [ ] All tests pass locally
- [ ] New features have tests
- [ ] Bug fixes have regression tests
- [ ] Coverage meets requirements
- [ ] Tests are properly documented
- [ ] No console.log in tests
- [ ] Mock external dependencies

## Getting Help

- [Testing Guide](./testing) - Comprehensive testing documentation
- [Code Style Guide](./code-style) - Testing code style
- [Contributing Guide](./contributing) - General contribution guidelines
