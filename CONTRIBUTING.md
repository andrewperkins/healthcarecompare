# Contributing to Health Care Compare

Thank you for your interest in contributing to Health Care Compare! This document provides guidelines and instructions for contributing.

## How to Contribute

### Reporting Issues

1. Check if the issue already exists in [GitHub Issues](https://github.com/andrewperkins/healthcarecompare/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Browser and OS information
   - Screenshots if applicable

### Suggesting Features

1. Open a [GitHub Discussion](https://github.com/andrewperkins/healthcarecompare/discussions) or issue
2. Describe the feature and its benefits
3. Explain use cases
4. Consider implementation complexity

### Submitting Pull Requests

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes**
5. **Test thoroughly** in multiple browsers
6. **Commit** with clear messages:
   ```bash
   git commit -m "Add feature: description of what you added"
   ```
7. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request** with:
   - Description of changes
   - Why the change is needed
   - How to test it

## Development Guidelines

### Code Style

- Use **clear, descriptive variable names**
- Add **comments** for complex logic
- Follow existing **React patterns** in the codebase
- Keep functions **small and focused**
- Use **Tailwind CSS classes** for styling

### Testing Checklist

Before submitting a PR, test:

- [ ] Functionality works in Chrome, Firefox, Safari
- [ ] Mobile responsive design (test on small screens)
- [ ] Data persists in LocalStorage
- [ ] Export/Import features work
- [ ] Service Worker still works (check offline mode)
- [ ] No console errors
- [ ] No broken links or images

### File Organization

```
healthcarecompare/
├── assets/
│   ├── icons/          # Favicons, app icons
│   └── images/         # Images used in app
├── docs/               # Documentation
├── .github/            # GitHub workflows
├── index.html          # Main application
├── sw.js              # Service worker
├── site.webmanifest   # PWA manifest
├── robots.txt         # SEO
├── sitemap.xml        # SEO
└── config files       # netlify.toml, vercel.json, etc.
```

### Making Changes

#### Adding Features

1. Consider if it fits the app's purpose (insurance comparison)
2. Keep the single-file architecture if possible
3. Maintain mobile-first responsive design
4. Update README.md if user-facing
5. Update docs/DEPLOYMENT.md if affects deployment

#### Fixing Bugs

1. Identify root cause
2. Fix with minimal changes
3. Test edge cases
4. Ensure localStorage compatibility

#### Improving Performance

1. Test before and after with Lighthouse
2. Maintain offline functionality
3. Don't break service worker caching
4. Consider mobile data usage

### Dependencies

This project intentionally uses **CDN-hosted libraries** to avoid build steps:
- React 18 (production build)
- Tailwind CSS
- Lucide Icons
- Babel Standalone

**Adding Dependencies:**
- Prefer CDN-hosted libraries
- Use production/minified versions
- Update CSP in security headers
- Document in README

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or inflammatory comments
- Personal or political attacks
- Publishing others' private information

## Questions?

- Open a [Discussion](https://github.com/andrewperkins/healthcarecompare/discussions)
- Comment on relevant issues
- Check existing documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making Health Care Compare better! 🎉
