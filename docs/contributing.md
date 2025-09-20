# Contributing to Baby Tracker

Thank you for your interest in contributing to Baby Tracker! This document provides guidelines for contributing to the project.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/baby-tracker.git
   cd baby-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

4. **Set up the database**
   ```bash
   createdb baby_feeding
   psql baby_feeding < schema.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Code Style

- **TypeScript**: Use strict mode and proper typing
- **Vue 3**: Follow Composition API patterns
- **Tailwind CSS**: Use utility classes, avoid custom CSS when possible
- **ESLint**: Follow the configured rules
- **Prettier**: Use consistent formatting

## Commit Convention

Use conventional commits format:

```
type(scope): description

feat(api): add new feeding endpoint
fix(ui): resolve dark mode text visibility
docs(readme): update setup instructions
```

### Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Add comments for complex logic
   - Update documentation if needed
   - Test your changes thoroughly

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(component): add new feature"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Provide a clear description
   - Reference any related issues
   - Include screenshots for UI changes

## Testing

Before submitting a PR, ensure:

- [ ] All existing tests pass
- [ ] New features have appropriate tests
- [ ] Manual testing on different devices
- [ ] No console errors
- [ ] Responsive design works on mobile/tablet/desktop

## Documentation

When adding new features:

- [ ] Update API documentation in `docs/api-design.md`
- [ ] Update database schema in `docs/database-schema.md` if needed
- [ ] Update UI documentation in `docs/ui-design.md` for UI changes
- [ ] Add changelog entry in `docs/CHANGELOG.md`

## Database Changes

If you need to modify the database schema:

1. **Create a migration script**
   ```sql
   -- Add your SQL changes to update-schema.sql
   ```

2. **Update schema.sql**
   - Include the new schema definition
   - Add appropriate indexes
   - Update documentation

3. **Test the migration**
   - Test on a copy of production data
   - Ensure backward compatibility

## API Changes

When modifying API endpoints:

1. **Update API documentation**
   - Document new endpoints in `docs/api-design.md`
   - Include request/response examples
   - Document any breaking changes

2. **Maintain backward compatibility**
   - Use versioning if needed
   - Provide migration paths for breaking changes

3. **Update frontend code**
   - Update API calls in components
   - Handle new response formats
   - Add error handling

## UI/UX Guidelines

- **Mobile-first**: Design for mobile devices first
- **Accessibility**: Ensure keyboard navigation and screen reader support
- **Consistency**: Follow existing design patterns
- **Performance**: Optimize for fast loading and smooth interactions

## Issue Reporting

When reporting issues:

1. **Check existing issues** first
2. **Provide detailed information**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/device information
   - Screenshots if applicable

3. **Use issue templates** when available

## Feature Requests

For new features:

1. **Check if it's already planned**
2. **Provide clear use case**
3. **Consider implementation complexity**
4. **Follow the project's scope and goals**

## Code Review Process

All PRs require review before merging:

- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation is updated
- [ ] No breaking changes without discussion
- [ ] Performance impact is considered

## Release Process

Releases are managed by maintainers:

1. **Version bumping** follows semantic versioning
2. **Changelog updates** are required
3. **Database migrations** are documented
4. **Breaking changes** are clearly marked

## Questions?

If you have questions about contributing:

- Check existing documentation
- Open a discussion issue
- Contact maintainers directly

Thank you for contributing to Baby Tracker! 🍼
