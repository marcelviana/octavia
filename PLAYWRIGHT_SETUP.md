# 🎵 Playwright E2E Testing for Octavia

This document describes the Playwright end-to-end testing setup for the Octavia music management application.

## 📊 Overview

Playwright provides comprehensive E2E testing with:
- **Multi-browser support** (Chromium, Firefox, WebKit)
- **Mobile testing** with responsive viewports
- **Visual testing** with screenshots and videos
- **Network interception** for API testing
- **Authentication handling** with state management
- **CI/CD integration** with GitHub Actions

## 🚀 Quick Start

### 1. Installation

Playwright is already installed and configured. The setup includes:

- **Playwright Test** (`@playwright/test`)
- **Browser binaries** (Chromium, Firefox, WebKit)
- **Configuration** (`playwright.config.ts`)
- **Test examples** (`tests/e2e/`)
- **CI integration** (GitHub Actions)

### 2. Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run tests with UI mode (interactive)
pnpm test:e2e:ui

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Run tests in debug mode
pnpm test:e2e:debug

# Generate test code
pnpm test:e2e:codegen

# Show test report
pnpm test:e2e:report
```

### 3. Test Structure

```
tests/e2e/
├── navigation.spec.ts      # Navigation tests
├── library.spec.ts         # Library functionality tests
├── dashboard.spec.ts       # Dashboard tests
├── utils/
│   └── test-helpers.ts     # Test helper utilities
├── global-setup.ts         # Global test setup
├── global-teardown.ts      # Global test cleanup
└── .auth/                  # Authentication state
```

## ⚙️ Configuration

### Playwright Configuration (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Environment Variables

```bash
# Test environment
NODE_ENV=test
BASE_URL=http://localhost:3000

# Supabase test configuration
NEXT_PUBLIC_SUPABASE_URL=https://test-mock.supabase.co
SUPABASE_SERVICE_ROLE_KEY=mock-service-key-for-testing-only
```

## 📝 Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.locator('h1')).toContainText('Expected Title');
  });
});
```

### Using Test Helpers

```typescript
import { test, expect } from '@playwright/test';
import { createTestHelpers } from './utils/test-helpers';

test('should authenticate user', async ({ page }) => {
  const helpers = createTestHelpers(page);
  
  await helpers.authenticate();
  await helpers.expectPageTitle('Dashboard');
});
```

### Page Object Model

```typescript
// pages/LibraryPage.ts
export class LibraryPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/library');
  }

  async addContent() {
    await this.page.click('text=Add Content');
  }

  async searchContent(query: string) {
    await this.page.fill('[data-testid="search-input"]', query);
  }
}

// tests/library.spec.ts
test('should search content', async ({ page }) => {
  const libraryPage = new LibraryPage(page);
  await libraryPage.navigate();
  await libraryPage.searchContent('test song');
});
```

## 🧪 Test Examples

### Navigation Tests

```typescript
test('should navigate to main pages', async ({ page }) => {
  await page.click('text=Dashboard');
  await expect(page).toHaveURL('/dashboard');
  
  await page.click('text=Library');
  await expect(page).toHaveURL('/library');
});
```

### Form Interaction Tests

```typescript
test('should create new content', async ({ page }) => {
  await page.goto('/add-content');
  
  await page.fill('[data-testid="title-input"]', 'Test Song');
  await page.selectOption('[data-testid="content-type-select"]', 'lyrics');
  await page.fill('[data-testid="content-editor"]', 'Test lyrics...');
  
  await page.click('[data-testid="save-button"]');
  await expect(page).toHaveURL(/\/content\/.+/);
});
```

### Responsive Tests

```typescript
test('should work on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/library');
  
  await expect(page.locator('h1')).toContainText('Your Music Library');
});
```

### Authentication Tests

```typescript
test('should require authentication', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Should redirect to login
  await expect(page).toHaveURL('/login');
  
  // Fill login form
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'password');
  await page.click('[data-testid="login-button"]');
  
  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
});
```

## 🔧 Test Helpers

### TestHelpers Class

```typescript
const helpers = createTestHelpers(page);

// Navigation
await helpers.navigateTo('/library');
await helpers.waitForAppLoad();

// Authentication
await helpers.authenticate();
await helpers.isAuthenticated();

// Content management
await helpers.createTestContent({
  title: 'Test Song',
  type: 'lyrics',
  content: 'Test content...'
});
await helpers.deleteTestContent('Test Song');

// Assertions
await helpers.expectPageTitle('Library');
await helpers.expectPageURL('/library');
await helpers.expectElementVisibleAndClickable('[data-testid="add-button"]');

// Utilities
await helpers.takeScreenshot('test-screenshot');
await helpers.waitForLoadingComplete();
```

## 📊 Test Reports

### HTML Report

```bash
# Generate and open HTML report
pnpm test:e2e:report
```

The HTML report includes:
- Test results and status
- Screenshots and videos
- Trace viewer for debugging
- Performance metrics

### CI Reports

GitHub Actions automatically:
- Runs E2E tests on all browsers
- Uploads test artifacts
- Generates test reports
- Preserves failures for debugging

## 🎯 Best Practices

### Test Organization

1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the behavior
3. **Keep tests independent** - no shared state between tests
4. **Use page objects** for complex interactions

### Selectors

```typescript
// ✅ Good - Use data-testid attributes
await page.click('[data-testid="add-button"]');

// ✅ Good - Use semantic selectors
await page.click('text=Add Content');
await page.click('button:has-text("Save")');

// ❌ Avoid - Fragile selectors
await page.click('.btn-primary');
await page.click('#submit');
```

### Error Handling

```typescript
test('should handle errors gracefully', async ({ page }) => {
  // Mock network errors
  await page.route('**/api/content', route => route.abort());
  
  await page.goto('/library');
  
  // Should show error message
  await expect(page.locator('text=Error loading content')).toBeVisible();
});
```

### Performance Testing

```typescript
test('should load quickly', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000); // 3 seconds
});
```

## 🔍 Debugging

### Debug Mode

```bash
# Run tests in debug mode
pnpm test:e2e:debug
```

### Code Generation

```bash
# Generate test code interactively
pnpm test:e2e:codegen
```

### Screenshots and Videos

```typescript
// Take screenshots
await page.screenshot({ path: 'screenshot.png' });

// Record videos (configured in playwright.config.ts)
// Videos are automatically saved on test failure
```

### Trace Viewer

```typescript
// Enable tracing
await page.context.tracing.start({ screenshots: true, snapshots: true });

// Stop tracing
await page.context.tracing.stop({ path: 'trace.zip' });
```

## 🚀 CI/CD Integration

### GitHub Actions

The CI workflow includes:
- Browser installation
- E2E test execution
- Artifact upload
- Test reporting

### Parallel Execution

```typescript
// Tests run in parallel across browsers
// Configure workers for optimal performance
workers: process.env.CI ? 1 : undefined,
```

### Retry Logic

```typescript
// Retry failed tests in CI
retries: process.env.CI ? 2 : 0,
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Setup](https://playwright.dev/docs/ci)

## 🆘 Troubleshooting

### Common Issues

1. **Tests failing in CI but passing locally**
   - Check browser compatibility
   - Verify environment variables
   - Review CI logs for errors

2. **Slow test execution**
   - Reduce parallel workers
   - Optimize selectors
   - Use headless mode in CI

3. **Authentication issues**
   - Verify auth state management
   - Check test credentials
   - Review global setup

### Debug Commands

```bash
# Run specific test file
pnpm test:e2e tests/e2e/navigation.spec.ts

# Run specific test
pnpm test:e2e -g "should navigate"

# Run with specific browser
pnpm test:e2e --project=chromium

# Run with headed mode
pnpm test:e2e:headed
```

---

*Last updated: $(date)* 