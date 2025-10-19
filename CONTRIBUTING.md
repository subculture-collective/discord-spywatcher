# Contributing to Discord Spywatcher

Thank you for your interest in contributing to Discord Spywatcher! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Quality Standards](#code-quality-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

Please be respectful and professional in all interactions with other contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/discord-spywatcher.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Push to your fork and submit a pull request

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. Install dependencies for both backend and frontend:

```bash
# Install root dependencies (for git hooks)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

2. Set up environment variables:

```bash
# Backend
cp backend/backend.env.example backend/.env

# Frontend
cp frontend/frontend.env.example frontend/.env
```

## Code Quality Standards

This project uses several tools to maintain code quality:

### ESLint

- **Backend**: TypeScript ESLint with security and import rules
- **Frontend**: TypeScript ESLint with React, accessibility, and import rules

Run linting:

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint

# Both (from root)
npm run lint
```

Fix linting errors automatically:

```bash
# Backend
cd backend
npm run lint:fix

# Frontend
cd frontend
npm run lint:fix

# Both (from root)
npm run lint:fix
```

### Prettier

Code formatting is enforced with Prettier. Configuration is in `.prettierrc`:

- Single quotes
- Semicolons
- 4 spaces for indentation
- 80 character line length
- Trailing commas (ES5)

Format code:

```bash
# Backend
cd backend
npm run format

# Frontend
cd frontend
npm run format

# Both (from root)
npm run format
```

Check formatting:

```bash
# Backend
cd backend
npm run format:check

# Frontend
cd frontend
npm run format:check

# Both (from root)
npm run format:check
```

### TypeScript

TypeScript strict mode is enabled with additional checks:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `forceConsistentCasingInFileNames: true`

Run type checking:

```bash
# Backend
cd backend
npm run type-check

# Frontend
cd frontend
npm run type-check

# Both (from root)
npm run type-check
```

### VS Code Setup

The project includes recommended VS Code settings and extensions:

1. Install recommended extensions (VS Code will prompt you)
2. Settings are configured in `.vscode/settings.json`:
    - Format on save enabled
    - ESLint auto-fix on save
    - Prettier as default formatter

### Git Hooks (Husky)

Git hooks are automatically installed when you run `npm install` in the root directory.

#### Pre-commit Hook

Runs `lint-staged` which:

- Lints and fixes TypeScript files with ESLint
- Formats files with Prettier
- Only runs on staged files (fast!)

#### Pre-push Hook

Runs type checking for both backend and frontend before pushing.

#### Commit Message Hook

Validates commit messages follow conventional commit format.

### Bypassing Hooks

If you need to bypass hooks (use sparingly):

```bash
git commit --no-verify -m "your message"
git push --no-verify
```

## Commit Guidelines

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without changing functionality
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system or dependency changes
- `ci`: CI/CD configuration changes
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverting a previous commit

### Examples

```bash
feat(auth): add OAuth2 authentication
fix(api): resolve race condition in user fetch
docs(readme): update installation instructions
style(backend): format code with prettier
refactor(dashboard): extract user list component
```

### Rules

- Subject must be lowercase (except proper nouns)
- Subject must not end with a period
- Subject must be 100 characters or less
- Use imperative mood ("add" not "added" or "adds")

## Pull Request Process

1. Ensure all tests pass and code is properly linted
2. Update documentation if needed
3. Add a clear description of your changes
4. Link any related issues
5. Request review from maintainers
6. Address any feedback from code review
7. Once approved, your PR will be merged

### PR Checklist

- [ ] Code follows the project's style guidelines
- [ ] All linting and type checking passes
- [ ] Commit messages follow conventional commit format
- [ ] Documentation has been updated (if needed)
- [ ] Tests have been added or updated (if applicable)
- [ ] PR description clearly explains the changes

## Code Review Guidelines

### For Authors

- Keep PRs focused and small
- Write clear descriptions
- Respond to feedback promptly
- Don't take feedback personally

### For Reviewers

- Be respectful and constructive
- Focus on code quality, not personal preferences
- Explain the reasoning behind suggestions
- Approve when satisfied with changes

## Need Help?

- Check existing issues and discussions
- Ask questions in pull request comments
- Reach out to maintainers

## License

By contributing to Discord Spywatcher, you agree that your contributions will be licensed under the same license as the project.
