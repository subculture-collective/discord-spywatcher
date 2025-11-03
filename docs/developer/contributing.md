# Contributing to Spywatcher

Thank you for your interest in contributing to Spywatcher! This guide will help you get started.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

## Ways to Contribute

### Reporting Bugs

Found a bug? Please report it!

1. **Check existing issues** to avoid duplicates
2. **Use the bug template** when creating a new issue
3. **Include details:**
   - Description of the bug
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node version, etc.)

### Suggesting Features

Have an idea for improvement?

1. **Check existing feature requests**
2. **Use the feature request template**
3. **Explain:**
   - The problem you're trying to solve
   - Your proposed solution
   - Why it would be valuable
   - Alternative solutions considered

### Contributing Code

Ready to code? Great!

1. **Fork the repository**
2. **Create a branch**: `git checkout -b feature/your-feature`
3. **Make your changes**
4. **Write tests**
5. **Ensure all tests pass**
6. **Submit a pull request**

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/discord-spywatcher.git
cd discord-spywatcher

# Add upstream remote
git remote add upstream https://github.com/subculture-collective/discord-spywatcher.git

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Set up database
cd backend
npx prisma migrate dev
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/my-new-feature
```

Branch naming conventions:
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/what-changed` - Documentation
- `refactor/what-changed` - Code refactoring
- `test/what-added` - Test additions

### 2. Make Changes

- Follow the [code style guide](./code-style)
- Write clear, concise code
- Add comments where necessary
- Update documentation

### 3. Write Tests

- Add unit tests for new functions
- Add integration tests for API endpoints
- Add E2E tests for user workflows
- Ensure all tests pass

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### 4. Commit Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add ghost detection API endpoint
fix: resolve WebSocket connection issue
docs: update installation guide
test: add integration tests for analytics
refactor: simplify suspicion scoring logic
chore: update dependencies
```

Commit message format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Examples:
```bash
git commit -m "feat(api): add ghost detection endpoint

- Implements GET /api/ghosts
- Includes filtering and sorting
- Adds comprehensive tests
- Updates OpenAPI spec

Closes #123"
```

### 5. Keep Your Fork Updated

```bash
git fetch upstream
git rebase upstream/main
```

### 6. Push Changes

```bash
git push origin feature/my-new-feature
```

## Pull Request Process

### Before Submitting

✅ Checklist:
- [ ] Code follows style guide
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console.log or debug code
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main

### Submitting PR

1. **Go to GitHub** and create a Pull Request
2. **Fill out the template** completely
3. **Link related issues** using "Closes #123"
4. **Describe your changes** clearly
5. **Add screenshots** for UI changes
6. **Request review** from maintainers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe tests added/modified

## Screenshots
If applicable, add screenshots

## Checklist
- [ ] Code follows style guide
- [ ] Tests pass
- [ ] Documentation updated
```

### Review Process

1. **Automated checks** run (CI/CD)
2. **Maintainer review** (may request changes)
3. **Address feedback** if needed
4. **Approval** by maintainer(s)
5. **Merge** into main branch

## Code Style

### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Write descriptive variable names
- Avoid `any` types when possible

```typescript
// Good
async function getUserAnalytics(userId: string): Promise<Analytics> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { analytics: true },
  });
  return user.analytics;
}

// Bad
async function getStuff(id: any): Promise<any> {
  const data = await prisma.user.findUnique({ where: { id } });
  return data.analytics;
}
```

### React/TSX

- Use functional components
- Use hooks appropriately
- Keep components small and focused
- Use proper prop types

```tsx
// Good
interface UserCardProps {
  user: User;
  onSelect: (id: string) => void;
}

export function UserCard({ user, onSelect }: UserCardProps) {
  return (
    <div className="card" onClick={() => onSelect(user.id)}>
      <h3>{user.username}</h3>
    </div>
  );
}
```

### Testing

- Write clear test descriptions
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test edge cases

```typescript
describe('Ghost Score Calculation', () => {
  it('should calculate correct score with messages', () => {
    // Arrange
    const presenceCount = 100;
    const messageCount = 5;

    // Act
    const score = calculateGhostScore(presenceCount, messageCount);

    // Assert
    expect(score).toBe(16.67);
  });
});
```

## Documentation

### When to Update Docs

Update documentation when you:
- Add new features
- Change existing behavior
- Fix bugs that affect usage
- Update APIs
- Change configuration

### Documentation Style

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Use proper markdown formatting
- Link to related documentation

## Getting Help

Need help contributing?

- **Discord** (coming soon)
- **GitHub Discussions**
- **GitHub Issues** - Tag with `question`
- **Email** - maintainers@spywatcher.com (if urgent)

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- GitHub Contributors page
- Release notes
- Documentation credits

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to ask questions! We're here to help:
- Open an issue tagged with `question`
- Reach out to maintainers
- Check existing documentation

Thank you for contributing to Spywatcher! 🎉

---

See also:
- [Development Setup](./local-environment)
- [Code Style Guide](./code-style)
- [Testing Guide](./testing)
- [Pull Request Guide](./pull-requests)
