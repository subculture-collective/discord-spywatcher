# Code Style Guide

This document defines the coding standards and conventions used in the Spywatcher project. Following these guidelines ensures consistency and maintainability across the codebase.

## General Principles

1. **Readability First**: Code is read more often than written
2. **Consistency**: Follow established patterns in the codebase
3. **Simplicity**: Prefer simple, clear solutions over clever ones
4. **Type Safety**: Leverage TypeScript's type system fully
5. **Documentation**: Document complex logic and public APIs

## TypeScript Style

### Type Annotations

Always use explicit type annotations for function parameters and return types:

```typescript
// ✅ Good
function calculateGhostScore(presenceCount: number, messageCount: number): number {
    return (presenceCount - messageCount) / presenceCount * 100;
}

// ❌ Bad
function calculateGhostScore(presenceCount, messageCount) {
    return (presenceCount - messageCount) / presenceCount * 100;
}
```

### Avoid `any`

Avoid using `any` type. Use `unknown` if type is truly unknown:

```typescript
// ✅ Good
function processData(data: unknown): User {
    if (isUser(data)) {
        return data;
    }
    throw new Error('Invalid user data');
}

// ❌ Bad
function processData(data: any): User {
    return data;
}
```

### Use Type Aliases and Interfaces

Define clear types for complex structures:

```typescript
// ✅ Good
interface User {
    id: string;
    discordId: string;
    username: string;
    discriminator: string;
    avatar: string | null;
}

type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline';

// ❌ Bad - inline types everywhere
function getUser(): { id: string; discordId: string; username: string; } {
    // ...
}
```

### Generics

Use generics for reusable type-safe functions:

```typescript
// ✅ Good
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
    return items.find(item => item.id === id);
}

// Usage with type safety
const user = findById(users, '123'); // Type: User | undefined
```

## Naming Conventions

### Variables and Functions

Use camelCase for variables and functions:

```typescript
// ✅ Good
const userCount = 10;
function calculateAverage() { }

// ❌ Bad
const UserCount = 10;
const user_count = 10;
function CalculateAverage() { }
```

### Constants

Use UPPER_SNAKE_CASE for constants:

```typescript
// ✅ Good
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// ❌ Bad
const maxRetryAttempts = 3;
const apiBaseUrl = 'https://api.example.com';
```

### Classes and Interfaces

Use PascalCase for classes, interfaces, and types:

```typescript
// ✅ Good
class UserService { }
interface ApiResponse { }
type ErrorHandler = () => void;

// ❌ Bad
class userService { }
interface apiResponse { }
type error_handler = () => void;
```

### File Names

- **Components**: PascalCase (e.g., `UserCard.tsx`)
- **Utilities**: camelCase (e.g., `authUtils.ts`)
- **Routes**: kebab-case (e.g., `user-management.ts`)

```
// ✅ Good structure
components/UserCard.tsx
utils/dateFormatter.ts
routes/api/user-management.ts

// ❌ Bad structure
components/usercard.tsx
utils/DateFormatter.ts
routes/api/userManagement.ts
```

### Boolean Variables

Prefix with `is`, `has`, `should`, or `can`:

```typescript
// ✅ Good
const isActive = true;
const hasPermission = false;
const shouldRetry = true;
const canEdit = false;

// ❌ Bad
const active = true;
const permission = false;
const retry = true;
```

## Function Style

### Arrow Functions vs Regular Functions

Use arrow functions for callbacks and short functions:

```typescript
// ✅ Good
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);

const handleClick = (event: MouseEvent) => {
    console.log('Clicked!', event);
};

// Use regular functions for methods and longer functions
function complexCalculation(data: ComplexData): Result {
    // Multiple lines of logic
    const step1 = processData(data);
    const step2 = validate(step1);
    return transform(step2);
}
```

### Function Length

Keep functions small and focused (ideally < 50 lines):

```typescript
// ✅ Good - Single responsibility
async function getUserById(id: string): Promise<User> {
    return await prisma.user.findUnique({ where: { id } });
}

async function enrichUserWithAnalytics(user: User): Promise<UserWithAnalytics> {
    const analytics = await getAnalytics(user.id);
    return { ...user, analytics };
}

// ❌ Bad - Too many responsibilities
async function getUserByIdWithAnalytics(id: string): Promise<UserWithAnalytics> {
    const user = await prisma.user.findUnique({ where: { id } });
    const messages = await prisma.message.count({ where: { userId: id } });
    const presences = await prisma.presence.count({ where: { userId: id } });
    // ... 40 more lines
}
```

### Default Parameters

Use default parameters instead of checking undefined:

```typescript
// ✅ Good
function fetchUsers(limit: number = 10, offset: number = 0) {
    // ...
}

// ❌ Bad
function fetchUsers(limit?: number, offset?: number) {
    const actualLimit = limit !== undefined ? limit : 10;
    const actualOffset = offset !== undefined ? offset : 0;
    // ...
}
```

## Async/Await Style

### Always Use Async/Await

Prefer async/await over promise chains:

```typescript
// ✅ Good
async function getUser(id: string): Promise<User> {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    } catch (error) {
        logger.error('Failed to fetch user', { id, error });
        throw error;
    }
}

// ❌ Bad
function getUser(id: string): Promise<User> {
    return prisma.user.findUnique({ where: { id } })
        .then(user => {
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        })
        .catch(error => {
            logger.error('Failed to fetch user', { id, error });
            throw error;
        });
}
```

### Error Handling

Always handle errors appropriately:

```typescript
// ✅ Good
async function processRequest(req: Request, res: Response) {
    try {
        const result = await performOperation();
        res.json(result);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
        } else {
            logger.error('Unexpected error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

// ❌ Bad - Silent failure
async function processRequest(req: Request, res: Response) {
    const result = await performOperation(); // Uncaught promise rejection
    res.json(result);
}
```

## React/JSX Style

### Functional Components

Always use functional components with hooks:

```tsx
// ✅ Good
interface UserCardProps {
    user: User;
    onSelect: (id: string) => void;
}

export function UserCard({ user, onSelect }: UserCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const handleClick = () => {
        setIsExpanded(!isExpanded);
        onSelect(user.id);
    };
    
    return (
        <div className="user-card" onClick={handleClick}>
            <h3>{user.username}</h3>
            {isExpanded && <UserDetails user={user} />}
        </div>
    );
}

// ❌ Bad - Class components
class UserCard extends React.Component<UserCardProps, UserCardState> {
    // ...
}
```

### Props Destructuring

Destructure props in function parameters:

```tsx
// ✅ Good
function UserCard({ user, onSelect, className }: UserCardProps) {
    return <div className={className}>...</div>;
}

// ❌ Bad
function UserCard(props: UserCardProps) {
    return <div className={props.className}>...</div>;
}
```

### Conditional Rendering

Use short-circuit evaluation for simple conditions:

```tsx
// ✅ Good - Simple condition
{isLoading && <Spinner />}
{error && <ErrorMessage message={error} />}
{data && <DataDisplay data={data} />}

// ✅ Good - Complex condition
{status === 'loading' ? (
    <Spinner />
) : status === 'error' ? (
    <ErrorMessage message={error} />
) : (
    <DataDisplay data={data} />
)}

// ❌ Bad - Confusing ternary chain
{isLoading ? <Spinner /> : error ? <ErrorMessage /> : data ? <DataDisplay /> : null}
```

### Event Handlers

Prefix event handlers with `handle`:

```tsx
// ✅ Good
function UserForm() {
    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        // ...
    };
    
    const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <input onChange={handleNameChange} />
        </form>
    );
}
```

### Component Organization

Organize component code in this order:

```tsx
import React, { useState, useEffect } from 'react';

// 1. Type definitions
interface UserDashboardProps {
    userId: string;
}

// 2. Component
export function UserDashboard({ userId }: UserDashboardProps) {
    // 3. Hooks
    const [user, setUser] = useState<User | null>(null);
    const { data, loading } = useAnalytics(userId);
    
    // 4. Effects
    useEffect(() => {
        fetchUser(userId).then(setUser);
    }, [userId]);
    
    // 5. Event handlers
    const handleRefresh = () => {
        // ...
    };
    
    // 6. Early returns
    if (loading) return <Loading />;
    if (!user) return <NotFound />;
    
    // 7. Main render
    return (
        <div>
            {/* Component JSX */}
        </div>
    );
}

// 8. Helper components (if small and specific to this component)
function UserStats({ stats }: { stats: Stats }) {
    return <div>...</div>;
}
```

## Backend Style

### Route Handlers

Keep route handlers thin, move logic to services:

```typescript
// ✅ Good
router.get('/users/:id', authenticate, async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        res.json(user);
    } catch (error) {
        handleError(error, res);
    }
});

// Service layer
class UserService {
    async getUserById(id: string): Promise<User> {
        const user = await this.repository.findById(id);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        return this.enrichWithAnalytics(user);
    }
}

// ❌ Bad - Business logic in route handler
router.get('/users/:id', authenticate, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const messages = await prisma.message.count({ where: { userId: user.id } });
    const presences = await prisma.presence.count({ where: { userId: user.id } });
    // ... 30 more lines of business logic
    res.json({ ...user, messages, presences });
});
```

### Middleware

Create reusable middleware functions:

```typescript
// ✅ Good
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = extractToken(req);
        const user = await verifyToken(token);
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

// Usage
router.get('/admin/users', authenticate, requireAdmin, getUsers);
```

### Database Queries

Use Prisma's type-safe query builder:

```typescript
// ✅ Good
const users = await prisma.user.findMany({
    where: {
        isActive: true,
        createdAt: {
            gte: new Date('2024-01-01'),
        },
    },
    include: {
        presences: {
            take: 10,
            orderBy: { timestamp: 'desc' },
        },
    },
    orderBy: { username: 'asc' },
});

// ❌ Bad - Raw SQL when Prisma can handle it
const users = await prisma.$queryRaw`
    SELECT * FROM users 
    WHERE is_active = true 
    AND created_at >= '2024-01-01'
`;
```

## Testing Style

### Test Structure

Follow the Arrange-Act-Assert pattern:

```typescript
describe('UserService', () => {
    describe('getUserById', () => {
        it('should return user when found', async () => {
            // Arrange
            const userId = 'user123';
            const mockUser = { id: userId, username: 'testuser' };
            jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
            
            // Act
            const result = await userService.getUserById(userId);
            
            // Assert
            expect(result).toEqual(mockUser);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: userId }
            });
        });
        
        it('should throw error when user not found', async () => {
            // Arrange
            jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
            
            // Act & Assert
            await expect(userService.getUserById('invalid'))
                .rejects.toThrow('User not found');
        });
    });
});
```

### Test Naming

Use descriptive test names:

```typescript
// ✅ Good
it('should calculate ghost score as 80 when user has 100 presences and 20 messages')
it('should return empty array when no users match the filter')
it('should throw ValidationError when email format is invalid')

// ❌ Bad
it('works')
it('test ghost score')
it('handles errors')
```

## Comments and Documentation

### JSDoc Comments

Document public functions and complex logic:

```typescript
/**
 * Calculates the ghost score for a user based on presence and message activity.
 * 
 * Ghost score represents how "inactive" a user is - high presence with low messages.
 * Score is calculated as: ((presences - messages) / presences) * 100
 * 
 * @param presenceCount - Total number of presence records for the user
 * @param messageCount - Total number of messages sent by the user
 * @returns Ghost score as a percentage (0-100)
 * 
 * @example
 * ```typescript
 * const score = calculateGhostScore(100, 20);
 * console.log(score); // 80
 * ```
 */
export function calculateGhostScore(presenceCount: number, messageCount: number): number {
    if (presenceCount === 0) return 0;
    return ((presenceCount - messageCount) / presenceCount) * 100;
}
```

### Inline Comments

Use inline comments sparingly, only for complex logic:

```typescript
// ✅ Good - Explains why, not what
// Use exponential backoff to avoid overwhelming the API during retries
const delay = Math.pow(2, attempt) * 1000;

// ❌ Bad - States the obvious
// Increment the counter by 1
counter++;
```

### TODO Comments

Use TODO comments for future improvements:

```typescript
// TODO(username): Add support for multiple guilds
// FIXME: This doesn't handle edge case when user has no roles
// HACK: Temporary workaround for discord.js v14 bug
```

## Code Formatting

### Prettier Configuration

The project uses Prettier with these settings:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 4,
  "trailingComma": "es5",
  "printWidth": 80
}
```

### Line Length

Keep lines under 80 characters when possible:

```typescript
// ✅ Good
const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { presences: true },
});

// ❌ Bad
const user = await prisma.user.findUnique({ where: { id: userId }, include: { presences: true, messages: true, roleChanges: true } });
```

### Import Organization

Organize imports in this order:

```typescript
// 1. External libraries
import express from 'express';
import { prisma } from '@prisma/client';

// 2. Internal modules
import { authenticate } from '../middleware/auth';
import { UserService } from '../services/UserService';

// 3. Types
import type { User, Presence } from '../types';

// 4. Relative imports
import { calculateScore } from './utils';
```

## Git Commit Style

Follow Conventional Commits:

```bash
# Format
<type>(<scope>): <subject>

# Types
feat: New feature
fix: Bug fix
docs: Documentation changes
style: Code style changes (formatting)
refactor: Code refactoring
perf: Performance improvements
test: Test changes
build: Build system changes
ci: CI/CD changes
chore: Other changes

# Examples
feat(api): add ghost detection endpoint
fix(auth): resolve token expiration issue
docs(readme): update installation instructions
refactor(analytics): simplify scoring algorithm
```

## Resources

- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Enforcement

Code style is enforced through:

1. **ESLint**: Automatically checks code style
2. **Prettier**: Automatically formats code
3. **Husky**: Git hooks run checks pre-commit
4. **CI/CD**: Automated checks in pull requests

Run these commands before committing:

```bash
# Check and fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check

# Run all checks
npm run lint && npm run type-check
```
