# Contributing to TonyStack

First off, thank you for considering contributing to TonyStack!

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (Deno version, OS, etc.)

### Suggesting Features

Feature suggestions are welcome! Please:

- Check if the feature already exists
- Explain the use case
- Describe the expected behavior
- Consider backward compatibility

### Code Contributions

1. **Fork the repository**

```bash
git clone https://github.com/yourusername/tonystack.git
cd tonystack
```

2. **Create a feature branch**

```bash
git checkout -b feature/my-awesome-feature
```

3. **Make your changes**

- Follow the existing code style
- Add tests for new features
- Update documentation as needed

4. **Test your changes**

```bash
# Test CLI
cd packages/cli
deno task dev scaffold test-entity

# Test starter
cd packages/starter
deno task test
deno task dev
```

5. **Commit with clear messages**

```bash
git commit -m "feat: add amazing feature"
git commit -m "fix: resolve issue with user service"
git commit -m "docs: update README with new examples"
```

6. **Push to your fork**

```bash
git push origin feature/my-awesome-feature
```

7. **Open a Pull Request**

- Describe what changed and why
- Reference any related issues
- Include screenshots if relevant

## Code Style

- **TypeScript**: Use TypeScript for all code
- **Formatting**: Run `deno fmt` before committing
- **Linting**: Run `deno lint` and fix issues
- **Types**: Avoid `any`, prefer explicit types
- **Comments**: Add JSDoc comments for public APIs

### Example:

```typescript
/**
 * Generate a new entity with all MVC files
 * @param options - Scaffolding options
 * @returns Promise that resolves when complete
 */
export async function scaffoldEntity(options: ScaffoldOptions): Promise<void> {
  // Implementation
}
```

## Testing

- Write tests for new features
- Ensure existing tests pass
- Aim for >80% coverage

```bash
# Run tests
deno task test

# Run with coverage
deno test --coverage=coverage tests/
```

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for code APIs
- Update relevant guides in `/docs`
- Include usage examples

## Development Workflow

1. **CLI Development** (`packages/cli/`)

```bash
cd packages/cli
deno task dev scaffold products
```

2. **Starter Development** (`packages/starter/`)

```bash
cd packages/starter
deno task dev
```

3. **Testing Integration**

```bash
# Install CLI globally
cd packages/cli
deno task install

# Test in starter
cd ../starter
tstack scaffold test-entity
```

## Areas to Contribute

### Good First Issues

- Documentation improvements
- Example projects
- Bug fixes
- Test coverage

### Intermediate

- New CLI features
- Middleware additions
- Template improvements
- Performance optimizations

### Advanced

- Database adapter support
- GraphQL integration
- WebSocket support
- Plugin system

## Pull Request Checklist

Before submitting, ensure:

- [ ] Code follows style guidelines
- [ ] Tests pass (`deno task test`)
- [ ] Linting passes (`deno lint`)
- [ ] Formatting is correct (`deno fmt`)
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] No breaking changes (or clearly documented)

## Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## 📞 Questions?

- Open a
  [GitHub Discussion](https://github.com/yourusername/tonystack/discussions)
- Check existing [Issues](https://github.com/yourusername/tonystack/issues)
- Email: your-email@example.com

---

**Thank you for contributing to TonyStack!**
