# Contributing to Discord Spywatcher

Thank you for your interest in contributing to Discord Spywatcher! 🎉

We're excited to have you here and grateful for your contributions, whether it's reporting bugs, proposing features, improving documentation, or writing code. This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Quality Standards](#code-quality-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers through GitHub issues or direct contact.

## Getting Started

### First Time Contributors

If this is your first time contributing to open source, welcome! Here are some resources to help you get started:

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [First Contributions](https://github.com/firstcontributions/first-contributions)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

### Quick Start Guide

1. **Fork the repository** - Click the "Fork" button at the top right of the repository page
2. **Clone your fork**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/discord-spywatcher.git
    cd discord-spywatcher
    ```
3. **Add upstream remote**:
    ```bash
    git remote add upstream https://github.com/subculture-collective/discord-spywatcher.git
    ```
4. **Create a new branch**:
    ```bash
    git checkout -b feature/your-feature-name
    # or
    git checkout -b fix/your-bug-fix
    ```
5. **Make your changes** - Follow the development setup and guidelines below
6. **Push to your fork**:
    ```bash
    git push origin feature/your-feature-name
    ```
7. **Submit a pull request** - Go to your fork on GitHub and click "New Pull Request"

## Ways to Contribute

There are many ways to contribute to Discord Spywatcher:

### 🐛 Report Bugs

Found a bug? Please [create a bug report](.github/ISSUE_TEMPLATE/bug_report.yml) with:

- Clear description of the issue
- Steps to reproduce
- Expected vs. actual behavior
- Your environment details

### 💡 Suggest Features

Have an idea for a new feature? [Submit a feature request](.github/ISSUE_TEMPLATE/feature_request.yml) with:

- Description of the problem you're trying to solve
- Your proposed solution
- Any alternative approaches you've considered

### 📝 Improve Documentation

Documentation improvements are always welcome:

- Fix typos or clarify existing docs
- Add examples and tutorials
- Improve code comments
- Write guides for new features

Use the [documentation template](.github/ISSUE_TEMPLATE/documentation.yml) to suggest improvements.

### 🔧 Write Code

Ready to contribute code? Great!

- Check the [issue tracker](https://github.com/subculture-collective/discord-spywatcher/issues) for open issues
- Look for issues labeled `good first issue` or `help wanted`
- Comment on an issue to let others know you're working on it
- Follow the development workflow below

### 🧪 Write Tests

Help improve code coverage:

- Add tests for existing features
- Improve test quality and coverage
- Add integration and end-to-end tests

### 👀 Review Pull Requests

Help review open pull requests:

- Test the changes locally
- Provide constructive feedback
- Check for code quality and best practices

## Development Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download](https://git-scm.com/)
- **Docker** (optional but recommended) - [Download](https://www.docker.com/)
- **PostgreSQL** (if not using Docker) - [Download](https://www.postgresql.org/)

### Installation

#### Option 1: Using Docker (Recommended)

The easiest way to get started:

```bash
# Copy environment file and configure
cp .env.example .env
# Edit .env with your Discord credentials

# Start development environment
docker-compose -f docker-compose.dev.yml up
```

Access:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432

See [DOCKER.md](./DOCKER.md) for detailed Docker setup.

#### Option 2: Manual Setup

1. **Install root dependencies** (for git hooks and tooling):

```bash
npm install
```

2. **Install backend dependencies**:

```bash
cd backend
npm install
```

3. **Install frontend dependencies**:

```bash
cd frontend
npm install
```

4. **Set up environment variables**:

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

5. **Set up the database**:

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

6. **Start the development servers**:

```bash
# In terminal 1 (Backend API)
cd backend
npm run dev:api

# In terminal 2 (Discord Bot)
cd backend
npm run dev

# In terminal 3 (Frontend)
cd frontend
npm run dev
```

### Discord Application Setup

To run Discord Spywatcher, you need to create a Discord application:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Navigate to the "Bot" section and click "Add Bot"
4. Under "Privileged Gateway Intents", enable:
    - Presence Intent
    - Server Members Intent
    - Message Content Intent
5. Copy the bot token and add it to your `.env` file as `DISCORD_BOT_TOKEN`
6. Navigate to "OAuth2" → "General"
7. Copy the Client ID and Client Secret to your `.env` file
8. Add your redirect URI (e.g., `http://localhost:5173/auth/callback`)
9. Navigate to "OAuth2" → "URL Generator"
10. Select scopes: `bot`, `identify`, `guilds`
11. Select bot permissions: `View Channels`, `Read Message History`, `Send Messages`
12. Copy the generated URL and use it to invite the bot to your server

## Development Workflow

### Keeping Your Fork Updated

Before starting work on a new feature or fix, sync your fork with the upstream repository:

```bash
# Fetch upstream changes
git fetch upstream

# Switch to your main branch
git checkout main

# Merge upstream changes
git merge upstream/main

# Push to your fork
git push origin main
```

### Working on a Feature or Fix

1. **Create a feature branch** from the latest `main`:

    ```bash
    git checkout main
    git pull upstream main
    git checkout -b feature/your-feature-name
    ```

2. **Make your changes** following the code standards

3. **Test your changes**:

    ```bash
    # Run linting
    npm run lint

    # Run type checking
    npm run type-check

    # Run tests
    cd backend && npm test
    cd frontend && npm test
    ```

4. **Commit your changes** using conventional commits:

    ```bash
    git add .
    git commit -m "feat(component): add new feature"
    ```

5. **Push to your fork**:

    ```bash
    git push origin feature/your-feature-name
    ```

6. **Create a Pull Request** on GitHub

### Development Tips

- **Use the git hooks**: They're set up automatically and will catch issues before you push
- **Run tests frequently**: Catch issues early
- **Keep commits small and focused**: Easier to review and revert if needed
- **Write clear commit messages**: Help others understand your changes
- **Update documentation**: Keep docs in sync with code changes

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

## Issue Guidelines

### Creating Good Issues

When creating an issue, please:

- **Use a clear and descriptive title**
- **Search for existing issues** to avoid duplicates
- **Use the appropriate template** (bug report, feature request, or documentation)
- **Provide complete information** - the more details, the better
- **Stay on topic** - keep discussions focused on the issue at hand
- **Be respectful** - follow our Code of Conduct

### Issue Labels

We use labels to categorize issues:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `needs-triage` - Needs to be reviewed by maintainers
- `priority: high` - High priority issue
- `priority: low` - Low priority issue
- `wontfix` - This will not be worked on

### Issue Lifecycle

1. **New** - Issue is created using a template
2. **Triage** - Maintainers review and label the issue
3. **Accepted** - Issue is confirmed and ready for work
4. **In Progress** - Someone is actively working on it
5. **Review** - Pull request is under review
6. **Done** - Issue is resolved and closed

## Community Guidelines

### Communication

- **Be kind and courteous** - We're all here to learn and help each other
- **Be patient** - Maintainers and contributors are often volunteers
- **Be constructive** - Focus on the issue, not the person
- **Be clear** - Explain your ideas thoroughly
- **Be respectful of time** - Keep discussions focused and productive

### Getting Help

Need help with something? Here are the best ways to get support:

- **Documentation** - Check the [README](./README.md) and [docs](./docs/) first
- **Discussions** - Use [GitHub Discussions](https://github.com/subculture-collective/discord-spywatcher/discussions) for questions
- **Issues** - Create an issue if you've found a bug or want to suggest a feature
- **Pull Request Comments** - Ask questions directly on relevant PRs

## Recognition

We value all contributions! Contributors are recognized in:

- GitHub's contributor graph
- Release notes for significant contributions
- The project's community

## Need Help?

- Check existing [issues](https://github.com/subculture-collective/discord-spywatcher/issues) and [discussions](https://github.com/subculture-collective/discord-spywatcher/discussions)
- Read the [documentation](./README.md)
- Ask questions in pull request comments
- Reach out to maintainers

## License

By contributing to Discord Spywatcher, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Discord Spywatcher! 🙏
