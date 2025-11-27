# Contributing to NixDeck 2133

First off, thank you for considering contributing to NixDeck 2133. This project thrives on community input and collaboration.

## Code of Conduct

This project operates under a simple principle: **Be excellent to each other.**

- Respect different viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title** - Descriptive and specific
- **Steps to reproduce** - Exact steps to trigger the bug
- **Expected behavior** - What should happen
- **Actual behavior** - What actually happens
- **System info** - OS, kernel version, DE/WM
- **Logs** - Any relevant error messages

### Suggesting Features

Feature suggestions are welcome! Please include:

- **Use case** - Why this feature would be useful
- **Proposed solution** - How it might work
- **Alternatives** - Other approaches you considered
- **Mockups** - Visual designs if applicable

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**: `git commit -m 'Add amazing feature'`
6. **Push to your branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

#### PR Guidelines

- Follow existing code style
- Write clear commit messages
- Update documentation if needed
- Add tests for new functionality
- Keep PRs focused on a single feature/fix

## Development Setup
```bash
# Clone your fork
git clone https://github.com/your-username/nixdeck-2133.git
cd nixdeck-2133

# Add upstream remote
git remote add upstream https://github.com/original/nixdeck-2133.git

# Install dependencies
npm install

# Run development build
npm run tauri dev
```

## Project Structure
```
nixdeck-2133/
├── src-tauri/          # Rust backend
│   ├── src/
│   │   ├── main.rs     # Entry point
│   │   ├── commands.rs # Tauri commands
│   │   └── */          # Module directories
│   └── Cargo.toml
├── src/                # Frontend
│   ├── index.html
│   ├── styles/
│   └── scripts/
└── README.md
```

## Coding Standards

### Rust
- Follow `rustfmt` formatting
- Use meaningful variable names
- Add comments for complex logic
- Handle errors explicitly

### JavaScript
- Use ES6+ features
- Prefer `const` over `let`
- Use arrow functions where appropriate
- Add JSDoc comments for functions

### CSS
- Use CSS custom properties (variables)
- Follow BEM naming convention
- Group related properties
- Comment complex selectors

## Testing
```bash
# Run Rust tests
cd src-tauri
cargo test

# Run frontend tests (when implemented)
npm test
```

## Documentation

- Update README.md for user-facing changes
- Add inline comments for complex code
- Create examples for new features
- Update INSTALLATION.md for setup changes

## Module Development

When adding new modules:

1. **Create module directory**: `src-tauri/src/modulename/`
2. **Add mod.rs**: Core module logic
3. **Update main.rs**: Add module declaration
4. **Add commands**: In commands.rs
5. **Create frontend**: Corresponding JS/CSS
6. **Document**: Add to README

## Theme Development

When creating themes:

1. **Copy blacksite.css**: Use as template
2. **Modify variables**: Update colors, fonts, spacing
3. **Test thoroughly**: Check all panels
4. **Add metadata**: Name, author, description
5. **Share**: Submit as PR or standalone

## Questions?

Feel free to:
- Open an issue for discussion
- Join community channels (coming soon)
- Reach out to maintainers

---

**Thank you for contributing to NixDeck 2133!**

*every contribution shapes the reality*
