# 🎵 Codecov Integration for Octavia

This document describes the Codecov integration for the Octavia music management application, providing comprehensive test coverage reporting and analysis.

## 📊 Overview

Codecov provides detailed test coverage reporting with:
- **Real-time coverage tracking** across branches and pull requests
- **Coverage badges** for README and documentation
- **Detailed coverage reports** with line-by-line analysis
- **Coverage trends** and historical data
- **GitHub integration** with status checks and comments

## 🚀 Quick Start

### 1. Repository Setup

The Codecov integration is already configured for this repository. The setup includes:

- **GitHub Actions workflow** (`.github/workflows/ci.yml`)
- **Codecov configuration** (`codecov.yml`)
- **Coverage badge** in README.md
- **Local coverage scripts** (`scripts/coverage.sh`)

### 2. Local Coverage Testing

```bash
# Run tests with coverage
pnpm test:ci

# Or use the coverage script
./scripts/coverage.sh run

# Open coverage report in browser
./scripts/coverage.sh open

# Check coverage thresholds
./scripts/coverage.sh check
```

### 3. View Coverage Reports

- **Local**: Open `coverage/index.html` in your browser
- **Online**: Visit [Codecov Dashboard](https://codecov.io/gh/marcelvianas-projects/octavia)
- **Badge**: Click the coverage badge in README.md

## ⚙️ Configuration

### Codecov Configuration (`codecov.yml`)

```yaml
# Coverage thresholds
coverage:
  status:
    project:
      default:
        target: 70%        # Overall project coverage target
        threshold: 5%      # Allow 5% decrease
    patch:
      default:
        target: 80%        # New/changed code coverage target
        threshold: 5%

# File exclusions
ignore:
  - "**/*.d.ts"           # TypeScript declaration files
  - "**/*.config.*"       # Configuration files
  - "**/coverage/**"      # Coverage reports
  - "**/node_modules/**"  # Dependencies
  - "**/__tests__/**"     # Test files
  - "**/*.test.{ts,tsx}"  # Test files
  - "**/test-utils/**"    # Test utilities
```

### Vitest Configuration (`vitest.config.mts`)

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  reportsDirectory: './coverage',
  exclude: [
    'node_modules/',
    '**/__tests__/**',
    '**/*.test.{ts,tsx}',
    '**/*.config.*',
    // ... other exclusions
  ],
  thresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
}
```

### GitHub Actions Workflow (`.github/workflows/ci.yml`)

```yaml
- name: Test coverage
  run: pnpm test:ci

- name: Upload coverage to Codecov
  if: always()
  uses: codecov/codecov-action@v4
  with:
    file: ./coverage/coverage-final.json
    flags: unittests
    name: codecov-umbrella
    fail_ci_if_error: false
    verbose: true
```

## 📈 Coverage Metrics

### Current Coverage Status

- **Overall Coverage**: 34.84%
- **Branches**: 68.9%
- **Functions**: 53.93%
- **Lines**: 34.84%

### Coverage Targets

- **Project Target**: 70%
- **Patch Target**: 80% (for new/changed code)
- **Threshold**: 5% (allowed decrease)

### Well-Covered Areas

✅ **High Coverage Components**:
- `middleware.ts` (91.2%)
- `dashboard/page.tsx` (100%)
- `library/page.tsx` (100%)
- `profile/page.tsx` (98.46%)
- `firebase-errors.ts` (96.55%)
- `validation-schemas.ts` (98.12%)

### Areas Needing Improvement

⚠️ **Low Coverage Components**:
- `app/page.tsx` (0%)
- `components/performance-mode.tsx` (0%)
- `components/setlist-manager.tsx` (0%)
- `components/settings.tsx` (0%)
- `lib/firebase-server-utils.ts` (5.12%)

## 🛠️ Usage

### Local Development

1. **Run Coverage Tests**:
   ```bash
   pnpm test:ci
   ```

2. **View Coverage Report**:
   ```bash
   ./scripts/coverage.sh open
   ```

3. **Check Thresholds**:
   ```bash
   ./scripts/coverage.sh check
   ```

### Continuous Integration

The GitHub Actions workflow automatically:
1. Runs tests with coverage
2. Uploads coverage data to Codecov
3. Generates coverage reports
4. Updates coverage badges

### Pull Requests

Codecov automatically:
- Comments on PRs with coverage changes
- Shows coverage diff for changed files
- Enforces coverage thresholds
- Provides detailed coverage analysis

## 📊 Coverage Reports

### Report Types

1. **HTML Report** (`coverage/index.html`)
   - Interactive coverage visualization
   - Line-by-line coverage details
   - File and directory summaries

2. **JSON Report** (`coverage/coverage-final.json`)
   - Machine-readable coverage data
   - Used by Codecov for analysis
   - Contains detailed coverage metrics

3. **LCOV Report** (`coverage/lcov.info`)
   - Standard coverage format
   - Compatible with many tools
   - Used by some CI systems

### Coverage Metrics Explained

- **Statements**: Individual code statements executed
- **Branches**: Conditional branches (if/else, switch cases)
- **Functions**: Function calls and definitions
- **Lines**: Lines of code executed

## 🔧 Troubleshooting

### Common Issues

1. **Coverage Not Uploading**:
   ```bash
   # Check if coverage files exist
   ls -la coverage/
   
   # Verify coverage-final.json exists
   test -f coverage/coverage-final.json && echo "✅ Coverage file exists"
   ```

2. **Low Coverage Scores**:
   - Add tests for uncovered components
   - Exclude test files from coverage
   - Review coverage exclusions

3. **Threshold Failures**:
   - Increase test coverage for failing areas
   - Adjust thresholds in `codecov.yml`
   - Add integration tests for complex components

### Debug Commands

```bash
# Check coverage configuration
pnpm test:coverage --reporter=verbose

# Generate coverage without thresholds
pnpm exec vitest run --coverage --reporter=text

# Check specific file coverage
pnpm test:coverage | grep "filename.ts"
```

## 📚 Best Practices

### Writing Testable Code

1. **Component Structure**:
   ```typescript
   // Separate business logic from UI
   const useMyComponent = () => {
     // Business logic here
     return { data, handlers }
   }
   
   const MyComponent = () => {
     const { data, handlers } = useMyComponent()
     // UI rendering here
   }
   ```

2. **Test Organization**:
   ```typescript
   // Group related tests
   describe('MyComponent', () => {
     describe('when data is loaded', () => {
       it('should render content', () => {
         // Test implementation
       })
     })
   })
   ```

### Coverage Strategy

1. **Critical Paths**: Focus on core functionality
2. **Error Handling**: Test error scenarios
3. **Edge Cases**: Cover boundary conditions
4. **Integration**: Test component interactions

### Maintaining Coverage

1. **Regular Reviews**: Check coverage reports weekly
2. **PR Requirements**: Enforce coverage thresholds
3. **Documentation**: Update tests with code changes
4. **Refactoring**: Update tests when refactoring

## 🔗 Resources

- [Codecov Documentation](https://docs.codecov.io/)
- [Vitest Coverage Guide](https://vitest.dev/guide/coverage.html)
- [GitHub Actions Codecov Action](https://github.com/codecov/codecov-action)
- [Coverage Best Practices](https://docs.codecov.io/docs/code-coverage-best-practices)

## 📞 Support

For issues with Codecov integration:
1. Check the [troubleshooting section](#troubleshooting)
2. Review [Codecov documentation](https://docs.codecov.io/)
3. Open an issue in this repository
4. Contact the development team

---

*Last updated: $(date)* 