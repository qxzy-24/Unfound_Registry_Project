# Contributing to The Unfound Registry

Thank you for your interest in contributing! This guide will help you get started.

## 🚀 Quick Start

1. **Fork** the repository
2. **Clone** your fork locally
3. **Install** dependencies: `npm install`
4. **Set up** your `.env` file (see [`.env.example`](.env.example))
5. **Create** a feature branch: `git checkout -b feature/your-feature`
6. **Make** your changes
7. **Test** thoroughly
8. **Commit** with a clear message
9. **Push** and open a Pull Request

## 📋 Guidelines

### Code Style

- Use `const` and `let` — never `var`
- Use `async/await` over raw Promises
- Keep functions focused and single-purpose
- Add comments for non-obvious logic
- Use parameterized queries for ALL database operations (never concatenate user input into SQL)

### Commit Messages

Write clear, descriptive commit messages:

```
✅ Good:  "Add rate limiting to auth endpoints"
✅ Good:  "Fix connection leak in PUT /api/artifacts/:id"
❌ Bad:   "fix stuff"
❌ Bad:   "update"
```

### Pull Requests

- Keep PRs focused on a single feature or fix
- Include a clear description of what changed and why
- Reference any related issues
- Ensure the server starts without errors before submitting

## 🔒 Security

- **Never** commit `.env` files, API keys, or passwords
- **Always** use parameterized SQL queries
- **Always** validate and sanitize user inputs
- Report security vulnerabilities privately (do not open a public issue)

## 🐛 Reporting Bugs

Open an issue with:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots (if applicable)
5. Your environment (Node version, OS, MySQL version)

## 💡 Suggesting Features

Open an issue with the `enhancement` label and describe:
1. The problem your feature solves
2. Your proposed solution
3. Any alternatives you've considered

---

Thank you for helping make The Unfound Registry better! 🎨
