# Commit Conventions

Spywatcher follows [Conventional Commits](https://www.conventionalcommits.org/) specification for clear, standardized commit messages.

## Why Conventional Commits?

**Benefits:**
- 📖 **Readable History**: Easy to understand what changed
- 🤖 **Automated Changelog**: Generate release notes automatically
- 🔍 **Easy Search**: Find specific changes quickly
- 🚀 **Semantic Versioning**: Determine version bumps automatically
- 👥 **Better Collaboration**: Clear communication between developers

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Structure

#### Type (Required)

The type of change being made:

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add ghost detection` |
| `fix` | Bug fix | `fix: resolve memory leak` |
| `docs` | Documentation only | `docs: update API guide` |
| `style` | Code style/formatting | `style: format with prettier` |
| `refactor` | Code refactoring | `refactor: simplify analytics` |
| `perf` | Performance improvement | `perf: optimize database queries` |
| `test` | Adding/updating tests | `test: add API integration tests` |
| `build` | Build system changes | `build: update webpack config` |
| `ci` | CI/CD changes | `ci: add coverage reporting` |
| `chore` | Maintenance tasks | `chore: update dependencies` |
| `revert` | Revert previous commit | `revert: undo feature X` |

#### Scope (Optional but Recommended)

The scope specifies which part of the codebase is affected:

**Common Scopes:**
- `api` - Backend API changes
- `bot` - Discord bot changes
- `frontend` - Frontend changes
- `auth` - Authentication/authorization
- `db` - Database/schema changes
- `analytics` - Analytics engine
- `websocket` - WebSocket functionality
- `docs` - Documentation
- `tests` - Test suite
- `deps` - Dependency updates

**Examples:**
```bash
feat(api): add ghost detection endpoint
fix(auth): resolve token expiration issue
docs(readme): update installation steps
refactor(analytics): simplify scoring algorithm
```

#### Subject (Required)

The subject is a brief description of the change:

**Rules:**
- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Maximum 72 characters
- Be concise but descriptive

**Examples:**

✅ **Good:**
```
add ghost detection endpoint
fix memory leak in websocket handler
update API documentation
```

❌ **Bad:**
```
Added ghost detection endpoint.  # Past tense, capitalized, period
Fixes                             # Too vague
fix: Fix the bug that was causing problems  # Too long, redundant
```

#### Body (Optional)

Provide additional context about the change:

**When to include:**
- Complex changes needing explanation
- Breaking changes
- Motivation for the change
- Implementation details

**Format:**
- Wrap at 72 characters
- Separate from subject with blank line
- Use bullet points for multiple points
- Explain **what** and **why**, not **how**

**Example:**
```
feat(analytics): implement ghost detection algorithm

Ghost users are users with high presence but low message activity.
This feature helps moderators identify potentially inactive members.

The algorithm calculates:
- Presence time from Discord events
- Message count over same period
- Ghost score = (presence - messages) / presence * 100

Closes #123
```

#### Footer (Optional)

Include metadata about the commit:

**Common uses:**
- Reference issues: `Closes #123`, `Fixes #456`, `Relates to #789`
- Breaking changes: `BREAKING CHANGE: ...`
- Co-authors: `Co-authored-by: Name <email>`
- Reviewed by: `Reviewed-by: Name <email>`

**Example:**
```
feat(api): add pagination to ghost endpoint

BREAKING CHANGE: Ghost endpoint now returns paginated results
instead of all results at once. Update clients to use limit/offset.

Closes #123
Relates to #125
```

## Examples

### Simple Feature

```
feat(api): add user search endpoint
```

### Bug Fix

```
fix(websocket): prevent connection leak on disconnect

WebSocket connections were not being properly closed when clients
disconnected, leading to memory leaks over time.

Fixed by implementing proper cleanup in disconnect handler and
adding timeout for stale connections.

Fixes #456
```

### Breaking Change

```
feat(auth)!: migrate to OAuth2 PKCE flow

BREAKING CHANGE: Authentication now requires PKCE flow. Clients
must generate code_verifier and code_challenge parameters.

Previous OAuth2 flow is no longer supported. Update all clients
to use the new flow before upgrading.

See migration guide in docs/MIGRATION.md

Closes #789
```

### Documentation

```
docs(contributing): add code review guidelines

Added comprehensive code review section covering:
- What to look for during review
- How to provide constructive feedback
- Review etiquette and best practices

Relates to #234
```

### Refactoring

```
refactor(analytics): extract ghost score calculation

Moved ghost score logic from route handler to dedicated service.
Improves testability and separation of concerns.

No functional changes.
```

### Performance

```
perf(db): add index on presence timestamp

Added compound index on (userId, timestamp) to optimize queries
for user presence history. Reduces query time from 500ms to 50ms
for typical date ranges.

Closes #567
```

### Multiple Changes

```
feat(analytics): add suspicion scoring system

Implemented comprehensive suspicion scoring based on:
- Multi-client connection detection
- Unusual activity patterns
- Role change frequency
- Ban history correlation

Added tests covering:
- Score calculation edge cases
- Real-world user data scenarios
- Performance with large datasets

Updated documentation:
- API reference for new endpoints
- Analytics guide with examples
- Admin guide for score interpretation

Closes #345
Relates to #123, #234
```

## Breaking Changes

Mark breaking changes with `!` or `BREAKING CHANGE:`:

**Method 1: Exclamation mark**
```
feat(api)!: remove deprecated v1 endpoints

All v1 API endpoints have been removed. Migrate to v2 endpoints
before upgrading.
```

**Method 2: Footer**
```
feat(api): update authentication flow

BREAKING CHANGE: JWT tokens now expire after 15 minutes instead
of 1 hour. Clients must implement token refresh.
```

## Reverting Commits

When reverting a commit:

```
revert: feat(api): add ghost detection

This reverts commit abc123def456.

Reverting due to performance issues discovered in production.
Issue will be addressed in #890.
```

## Multiple Authors

For collaborative work:

```
feat(analytics): implement advanced metrics

Co-authored-by: Alice Johnson <alice@example.com>
Co-authored-by: Bob Smith <bob@example.com>
```

## Merge Commits

For merge commits (when using merge strategy):

```
Merge pull request #123 from user/feature-branch

feat(analytics): add ghost detection
```

## Best Practices

### 1. Atomic Commits

Each commit should be a single, logical change:

✅ **Good:**
```
commit 1: feat(api): add user endpoint
commit 2: test(api): add user endpoint tests
commit 3: docs(api): document user endpoint
```

❌ **Bad:**
```
commit 1: add user endpoint, fix bugs, update docs, refactor code
```

### 2. Commit Often

Make frequent, small commits rather than large, infrequent ones:

✅ **Good:**
- Small, focused changes
- Easy to review
- Easy to revert if needed

❌ **Bad:**
- Huge commits with many changes
- Hard to review
- Hard to identify what broke

### 3. Test Before Committing

Ensure code works before committing:

```bash
# Run tests
npm test

# Check linting
npm run lint

# Type check
npm run type-check

# Then commit
git commit -m "feat(api): add endpoint"
```

### 4. Write for Others

Write commit messages as if explaining to a future developer:

✅ **Good:**
```
fix(websocket): prevent race condition in connection handling

Added mutex to synchronize access to connection map, preventing
race condition when multiple connections are established/closed
simultaneously.

Fixes intermittent "connection not found" errors in production.
```

❌ **Bad:**
```
fix stuff
```

### 5. Use Present Tense

Use imperative mood (command form):

✅ **Good:** `add`, `fix`, `update`, `remove`

❌ **Bad:** `added`, `fixed`, `updating`, `removed`

## Tools

### Commitlint

The project uses Commitlint to enforce conventions:

```bash
# Automatically runs on git commit via Husky
git commit -m "invalid commit message"
# ❌ Will be rejected

git commit -m "feat(api): add endpoint"
# ✅ Will be accepted
```

### Commitizen

For interactive commit message creation:

```bash
# Install globally
npm install -g commitizen

# Use instead of git commit
git cz
```

### GitHub CLI

Create commits with gh:

```bash
gh commit create -m "feat(api): add endpoint"
```

## Verification

### Pre-commit Hook

The pre-commit hook checks:
- Commit message format
- Linting
- Type checking
- Tests (optional)

### Bypass Hooks (Use Sparingly)

```bash
# Skip pre-commit hook
git commit --no-verify -m "WIP: work in progress"

# Not recommended for normal commits!
```

## Common Mistakes

### ❌ Vague Messages

```
fix: bug fix
feat: new stuff
update: changes
```

### ❌ Too Much Detail in Subject

```
feat(api): add new ghost detection endpoint that analyzes user presence and message activity to calculate ghost score
```

### ❌ Wrong Type

```
feat: fix typo in documentation
# Should be: docs: fix typo
```

### ❌ Multiple Changes

```
feat: add feature A and fix bug B and update docs
# Should be 3 separate commits
```

### ❌ Non-descriptive Scope

```
feat(stuff): add thing
# Use meaningful scope like feat(api): add endpoint
```

## Examples by Type

### Features

```
feat(analytics): add lurker detection
feat(api): implement rate limiting
feat(frontend): add dark mode
feat(bot): support slash commands
```

### Bug Fixes

```
fix(auth): resolve token expiration race condition
fix(websocket): prevent memory leak on reconnect
fix(frontend): correct chart data formatting
fix(db): handle null values in presence query
```

### Documentation

```
docs(readme): add installation instructions
docs(api): document rate limiting headers
docs(contributing): add PR guidelines
docs(architecture): add system diagrams
```

### Refactoring

```
refactor(analytics): extract scoring logic to service
refactor(api): simplify error handling middleware
refactor(frontend): convert class components to hooks
```

### Performance

```
perf(db): add indexes for frequent queries
perf(api): implement response caching
perf(frontend): lazy load chart components
```

### Tests

```
test(api): add integration tests for auth flow
test(analytics): add unit tests for ghost scoring
test(frontend): add E2E tests for dashboard
```

### Build/CI

```
build: update webpack to v5
ci: add test coverage reporting
build: configure code splitting
ci: add automated deployments
```

### Dependencies

```
chore(deps): update discord.js to v14
chore(deps): bump prisma to v5
chore(deps): update all dev dependencies
```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)
- [Commitlint](https://commitlint.js.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)

## Getting Help

- **Questions?** Ask in [GitHub Discussions](https://github.com/subculture-collective/discord-spywatcher/discussions)
- **Commit rejected?** Check error message and fix format
- **Not sure which type?** See examples above or ask maintainers

## Next Steps

- [Pull Request Process](./pull-requests)
- [Code Review Process](./review-process)
- [Contributing Guide](./contributing)
