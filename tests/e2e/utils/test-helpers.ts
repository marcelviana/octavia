import { Page, expect } from '@playwright/test';

/**
 * Test helper utilities for Octavia E2E tests
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the app to be fully loaded
   */
  async waitForAppLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('body', { state: 'visible' });
  }

  /**
   * Navigate to a page and wait for it to load
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.waitForAppLoad();
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Look for authentication indicators
      const authIndicators = [
        'button:has(.avatar)',
        'text=Profile',
        'text=Sign out'
      ];

      for (const indicator of authIndicators) {
        if (await this.page.locator(indicator).isVisible()) {
          return true;
        }
      }
      
      // Check for unauthenticated indicators
      const unAuthIndicators = [
        'text=Sign In',
        'text=Sign Up'
      ];
      
      for (const indicator of unAuthIndicators) {
        if (await this.page.locator(indicator).isVisible()) {
          return false;
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Authenticate user if not already authenticated
   */
  async authenticate() {
    if (await this.isAuthenticated()) {
      return;
    }

    // Navigate to login page
    await this.navigateTo('/login');

    // Fill login form (adjust selectors based on your actual form)
    await this.page.fill('input[type="email"]', 'test@example.com');
    await this.page.fill('input[type="password"]', 'testpassword123');
    
    // Submit form
    await this.page.click('button:has-text("Sign In")');
    
    // Wait for authentication to complete
    await this.page.waitForURL(/\/dashboard|\/library/, { timeout: 10000 });
  }

  /**
   * Create test content for testing
   */
  async createTestContent(contentData: {
    title: string;
    type: 'lyrics' | 'chords' | 'tabs';
    content: string;
  }) {
    // Navigate to add content page
    await this.navigateTo('/add-content');

    // Fill content form
    await this.page.fill('input[placeholder*="title" i]', contentData.title);
    await this.page.selectOption('select', contentData.type);
    await this.page.fill('textarea', contentData.content);

    // Submit form
    await this.page.click('button:has-text("Save")');

    // Wait for save to complete
    await this.page.waitForURL(/\/library|\/content\/.+/, { timeout: 10000 });
  }

  /**
   * Delete test content
   */
  async deleteTestContent(contentTitle: string) {
    // Navigate to library
    await this.navigateTo('/library');

    // Find and click on content item
    const contentItem = this.page.locator(`text=${contentTitle}`).first();
    if (await contentItem.isVisible()) {
      await contentItem.click();

      // Click delete button
      await this.page.click('button:has-text("Delete")');

      // Confirm deletion
      await this.page.click('button:has-text("Confirm")');

      // Wait for deletion to complete
      await this.page.waitForURL('/library', { timeout: 10000 });
    }
  }

  /**
   * Check if element is visible and clickable
   */
  async expectElementVisibleAndClickable(selector: string) {
    const element = this.page.locator(selector);
    await expect(element).toBeVisible();
    await expect(element).toBeEnabled();
  }

  /**
   * Wait for and verify page title
   */
  async expectPageTitle(expectedTitle: string) {
    await expect(this.page.locator('h1')).toContainText(expectedTitle);
  }

  /**
   * Check if page has expected URL
   */
  async expectPageURL(expectedURL: string | RegExp) {
    await expect(this.page).toHaveURL(expectedURL);
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for loading state to complete
   */
  async waitForLoadingComplete() {
    // Wait for loading indicators to disappear
    const loadingIndicator = this.page.locator('.animate-spin');
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
    }

    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill form fields with error handling
   */
  async fillFormField(selector: string, value: string) {
    try {
      await this.page.fill(selector, value);
    } catch (error) {
      console.warn(`Could not fill field ${selector}:`, error);
    }
  }

  /**
   * Click element with error handling
   */
  async clickElement(selector: string) {
    try {
      await this.page.click(selector);
    } catch (error) {
      console.warn(`Could not click element ${selector}:`, error);
    }
  }

  /**
   * Check if element exists and is visible
   */
  async elementExists(selector: string): Promise<boolean> {
    try {
      return await this.page.locator(selector).isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Search for content
   */
  async searchContent(query: string) {
    const searchInput = this.page.locator('input[placeholder="Search..."]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(query);
      await searchInput.press('Enter');
    }
  }

  /**
   * Navigate using sidebar
   */
  async navigateViaSidebar(screen: string) {
    await this.page.click(`text=${screen}`);
  }

  /**
   * Toggle sidebar collapse
   */
  async toggleSidebar() {
    const collapseButton = this.page.locator('button:has([data-lucide="PanelLeftClose"])');
    const expandButton = this.page.locator('button:has([data-lucide="PanelLeftOpen"])');
    
    if (await collapseButton.isVisible()) {
      await collapseButton.click();
    } else if (await expandButton.isVisible()) {
      await expandButton.click();
    }
  }

  /**
   * Open user menu
   */
  async openUserMenu() {
    const userButton = this.page.locator('button:has(.avatar)');
    if (await userButton.isVisible()) {
      await userButton.click();
    }
  }

  /**
   * Sign out user
   */
  async signOut() {
    await this.openUserMenu();
    await this.page.click('text=Sign out');
  }
}

/**
 * Create test helper instance
 */
export function createTestHelpers(page: Page): TestHelpers {
  return new TestHelpers(page);
} 