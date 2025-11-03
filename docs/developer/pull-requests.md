# Pull Request Process

This guide explains how to create, review, and merge pull requests for Spywatcher.

## Before You Start

- [ ] Read the [Contributing Guide](./contributing)
- [ ] Set up your [local environment](./local-environment)
- [ ] Understand the [code style](./code-style)
- [ ] Review [commit conventions](./commit-conventions)

## Creating a Pull Request

### Step 1: Fork and Clone

```bash
# Fork the repository on GitHub (click "Fork" button)

# Clone your fork
git clone https://github.com/YOUR_USERNAME/discord-spywatcher.git
cd discord-spywatcher

# Add upstream remote
git remote add upstream https://github.com/subculture-collective/discord-spywatcher.git

# Verify remotes
git remote -v
```

### Step 2: Create a Branch

Always create a feature branch from `main`:

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Branch naming conventions:
# - feature/add-ghost-detection
# - fix/websocket-memory-leak
# - docs/update-architecture
# - refactor/simplify-analytics
# - test/add-api-tests
```

### Step 3: Make Changes

Write code following our [code style guide](./code-style):

```bash
# Make your changes
# ... edit files ...

# Check what changed
git status
git diff

# Stage changes
git add path/to/file

# Commit with conventional commit message
git commit -m "feat(api): add ghost detection endpoint"
```

**Commit Message Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

See [Commit Conventions](./commit-conventions) for details.

### Step 4: Write Tests

Add tests for your changes:

```bash
# Backend tests
cd backend
npm run test:watch

# Frontend tests
cd frontend
npm run test:watch
```

Ensure:
- [ ] New features have unit tests
- [ ] API endpoints have integration tests
- [ ] Bug fixes include regression tests
- [ ] Tests pass: `npm test`

### Step 5: Run Quality Checks

Before pushing, run all checks:

```bash
# Lint code
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check

# Run tests with coverage
npm run test:coverage
```

### Step 6: Push Changes

```bash
# Push branch to your fork
git push origin feature/your-feature-name

# If you need to force push (rebase/amend)
git push --force-with-lease origin feature/your-feature-name
```

### Step 7: Open Pull Request

1. Go to GitHub repository
2. Click "Compare & pull request" button
3. Fill out the PR template
4. Submit the pull request

## Pull Request Template

When you open a PR, fill out this template:

```markdown
## Description

Brief description of what this PR does and why.

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test addition or update

## Related Issues

Closes #123
Relates to #456

## Changes Made

- Added ghost detection algorithm
- Created new API endpoint `/api/analytics/ghosts`
- Added unit tests for ghost score calculation
- Updated API documentation

## Testing

### How Has This Been Tested?

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] E2E tests added/updated (if applicable)

### Test Configuration

- Node version: 18.20.0
- Database: PostgreSQL 15
- OS: macOS 14.0

## Screenshots (if applicable)

Add screenshots for UI changes:

### Before
[Screenshot]

### After
[Screenshot]

## Checklist

- [ ] My code follows the project's code style
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Additional Notes

Any additional information reviewers should know.
```

## Pull Request Best Practices

### Size Matters

**Keep PRs small and focused:**

✅ **Good PR:**
- Changes: 50-200 lines
- Scope: Single feature or bug fix
- Easy to review in 15-30 minutes

❌ **Bad PR:**
- Changes: 1000+ lines
- Scope: Multiple unrelated changes
- Takes hours to review

**If your PR is large, consider:**
- Breaking it into multiple smaller PRs
- Creating a "parent" issue to track overall progress
- Using draft PRs for early feedback

### Clear Description

**Good description includes:**

```markdown
## Description

This PR implements ghost detection by analyzing the ratio of presence 
events to message activity. Users with high presence but low message 
count are flagged as potential "ghost" users.

## Implementation Details

1. Added `calculateGhostScore()` function that computes:
   - Ghost score = ((presences - messages) / presences) * 100
   - Range: 0-100, higher means more "ghost-like"

2. Created `/api/analytics/ghosts` endpoint:
   - Returns users sorted by ghost score
   - Supports pagination (limit/offset)
   - Includes filtering by minimum score

3. Added caching layer:
   - Redis cache with 5-minute TTL
   - Invalidates on new message/presence

## Testing

Added comprehensive tests:
- 12 unit tests for score calculation
- 8 integration tests for API endpoint
- Edge cases: zero presences, negative scores, etc.

All tests pass: ✅ 20/20
```

### Draft PRs

Use draft PRs for:
- Work in progress
- Seeking early feedback
- Large features needing discussion

```bash
# Create draft PR via GitHub CLI
gh pr create --draft --title "WIP: Ghost detection" --body "Early feedback requested"
```

### CI/CD Integration

Our CI automatically runs:

1. **Linting**: ESLint on all TypeScript files
2. **Type Checking**: TypeScript compilation
3. **Tests**: Jest/Vitest test suites
4. **Build**: Production build verification
5. **Security**: CodeQL analysis

**All checks must pass before merge.**

## Code Review Process

### For Authors

#### Responding to Feedback

**When reviewers request changes:**

1. **Acknowledge** the feedback
2. **Discuss** if you disagree (respectfully)
3. **Make changes** if agreed
4. **Reply** to each comment when addressed
5. **Re-request review** when ready

**Example response:**

```markdown
> Consider using a Set instead of array for O(1) lookups

Good catch! I've refactored this to use a Set. 
The performance improvement is significant with large datasets.

Updated in commit abc123.
```

#### Handling Merge Conflicts

If conflicts arise:

```bash
# Update your branch from main
git checkout main
git pull upstream main
git checkout feature/your-feature
git merge main

# Or use rebase for cleaner history
git rebase main

# Resolve conflicts in your editor
# Then stage resolved files
git add path/to/resolved/file

# Continue rebase
git rebase --continue

# Push (force required after rebase)
git push --force-with-lease origin feature/your-feature
```

#### Making Changes

After review feedback:

```bash
# Make changes
# ... edit files ...

# Commit changes
git add .
git commit -m "refactor: use Set for faster lookups"

# Push to update PR
git push origin feature/your-feature
```

**Commit strategies:**

**Option 1: Additional commits** (recommended for active discussion)
```bash
git commit -m "fix: address review comments"
```

**Option 2: Amend existing commit** (cleaner history)
```bash
git commit --amend --no-edit
git push --force-with-lease
```

### For Reviewers

#### What to Review

**Code Quality:**
- [ ] Follows code style guide
- [ ] No code smells or anti-patterns
- [ ] Proper error handling
- [ ] No hardcoded values
- [ ] Efficient algorithms

**Functionality:**
- [ ] Meets requirements
- [ ] Handles edge cases
- [ ] No obvious bugs
- [ ] Backward compatible (or documented breaking changes)

**Testing:**
- [ ] Adequate test coverage
- [ ] Tests actually test behavior
- [ ] Edge cases covered
- [ ] Tests pass

**Documentation:**
- [ ] Code comments where needed
- [ ] API docs updated
- [ ] README updated if needed
- [ ] Migration guide for breaking changes

**Security:**
- [ ] Input validation
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Secrets not committed
- [ ] Proper authentication/authorization

#### Review Etiquette

**Be constructive:**

✅ **Good:**
```
This function could be simplified using array.reduce(). 
Here's an example: [code snippet]
```

❌ **Bad:**
```
This code is terrible. Rewrite it.
```

**Be specific:**

✅ **Good:**
```
Line 45: This should use `===` instead of `==` for type-safe comparison.
```

❌ **Bad:**
```
Fix the comparisons.
```

**Offer alternatives:**

```
Consider using a Map here instead of an object:
- Faster key lookups
- Preserves insertion order
- Handles non-string keys

However, an object is fine if simplicity is preferred.
```

#### Approval Process

**Three types of review:**

1. **Approve**: Ready to merge
2. **Request Changes**: Must be addressed before merge
3. **Comment**: Suggestions but not blocking

**Merge criteria:**
- ✅ At least 1 approval from maintainer
- ✅ All CI checks pass
- ✅ No unresolved change requests
- ✅ No merge conflicts

## Merging Pull Requests

### Merge Strategies

**1. Squash and Merge (Default)**

Best for:
- Feature branches with many small commits
- Keeping main branch history clean

```bash
# Creates single commit on main
git merge --squash feature/your-feature
```

**2. Rebase and Merge**

Best for:
- Clean commit history
- Each commit is logical and well-formed

```bash
# Replays commits on main
git rebase main
git merge feature/your-feature
```

**3. Create Merge Commit**

Best for:
- Preserving feature branch history
- Complex features with many contributors

```bash
# Preserves all commits
git merge --no-ff feature/your-feature
```

### Post-Merge

After merging:

1. **Delete branch:**
```bash
# On GitHub (automatic option)
# Or manually:
git branch -d feature/your-feature
git push origin --delete feature/your-feature
```

2. **Update local main:**
```bash
git checkout main
git pull upstream main
```

3. **Close related issues** (if not auto-closed)

4. **Announce** in Discord/Slack if significant

## Common Scenarios

### Emergency Hotfix

For critical bugs in production:

```bash
# Create hotfix branch from main
git checkout -b hotfix/critical-bug main

# Make fix
# ... edit files ...

# Commit and push
git commit -m "fix: resolve critical security issue"
git push origin hotfix/critical-bug

# Create PR with "urgent" label
gh pr create --label urgent --title "Hotfix: Critical security issue"
```

### Long-Running Feature Branch

For features taking weeks/months:

```bash
# Regularly sync with main
git checkout feature/big-feature
git fetch upstream
git merge upstream/main

# Push to keep remote updated
git push origin feature/big-feature

# Consider draft PR for visibility
gh pr create --draft
```

### Multiple Authors

For collaborative work:

```bash
# Use co-author in commits
git commit -m "feat: add feature

Co-authored-by: Name <email@example.com>"

# Or add in PR description:
Co-authored-by: Name <email@example.com>
```

## Troubleshooting

### "Changes requested" blocking merge

**Solution:** Address all feedback or discuss with reviewer

```bash
# Make requested changes
# ... edit files ...

# Commit and push
git commit -m "fix: address review comments"
git push origin feature/your-feature

# Request review again
gh pr review --approve  # if you're a maintainer
```

### Failed CI checks

**Solution:** Check logs and fix issues

```bash
# View failing tests locally
npm test

# Fix lint errors
npm run lint:fix

# Check type errors
npm run type-check
```

### Merge conflicts

**Solution:** Resolve conflicts and update PR

```bash
# Fetch latest main
git fetch upstream main

# Merge main into your branch
git merge upstream/main

# Resolve conflicts in editor
# Stage resolved files
git add .

# Commit merge
git commit

# Push to update PR
git push origin feature/your-feature
```

## Resources

- [Contributing Guide](./contributing)
- [Code Style Guide](./code-style)
- [Commit Conventions](./commit-conventions)
- [Review Process](./review-process)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)

## Getting Help

- **Stuck?** Ask in [GitHub Discussions](https://github.com/subculture-collective/discord-spywatcher/discussions)
- **Bug in PR process?** Open an [issue](https://github.com/subculture-collective/discord-spywatcher/issues)
- **Need review?** Tag maintainers in PR comments
