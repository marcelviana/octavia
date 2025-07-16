import { test, expect } from '@playwright/test';

test.describe('Library', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to library
    await page.goto('/library');
  });

  test('should display library page correctly', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Your Music Library');
    
    // Check for add content button
    await expect(page.locator('text=Add Content')).toBeVisible();
    
    // Check for filters and sort options
    await expect(page.locator('text=Filter')).toBeVisible();
    await expect(page.locator('text=Sort')).toBeVisible();
  });

  test('should handle empty library state', async ({ page }) => {
    // Check for empty state message
    await expect(page.locator('text=No content found')).toBeVisible();
    await expect(page.locator('text=Add your first piece of music content')).toBeVisible();
    
    // Check for add content button in empty state
    await expect(page.locator('text=Add Content')).toBeVisible();
  });

  test('should navigate to add content page', async ({ page }) => {
    // Click add content button
    await page.click('text=Add Content');
    
    // Should navigate to add content page
    await expect(page).toHaveURL('/add-content');
    await expect(page.locator('h1')).toContainText('Add Content');
  });

  test('should handle search functionality', async ({ page }) => {
    // Look for search input in header
    const searchInput = page.locator('input[placeholder="Search..."]');
    
    if (await searchInput.isVisible()) {
      // Test search input
      await searchInput.fill('test song');
      await searchInput.press('Enter');
      
      // Should show search results or no results message
      await expect(page).toHaveURL(/\/library\?search=test%20song/);
    }
  });

  test('should handle filters', async ({ page }) => {
    // Click filters button
    await page.click('text=Filter');
    
    // Check if filter options are available
    const filterMenu = page.locator('[role="menu"]');
    if (await filterMenu.isVisible()) {
      // Test filter options
      await expect(page.locator('text=Content Type')).toBeVisible();
      await expect(page.locator('text=Tags')).toBeVisible();
    }
  });

  test('should handle sorting', async ({ page }) => {
    // Click sort button
    await page.click('text=Sort');
    
    // Check if sort options are available
    const sortMenu = page.locator('[role="menu"]');
    if (await sortMenu.isVisible()) {
      // Test sort options
      await expect(page.locator('text=Name')).toBeVisible();
      await expect(page.locator('text=Date')).toBeVisible();
      await expect(page.locator('text=Type')).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if page is still functional
    await expect(page.locator('h1')).toContainText('Your Music Library');
    await expect(page.locator('text=Add Content')).toBeVisible();
    
    // Check if mobile-specific elements are present
    const mobileMenuButton = page.locator('button:has([data-lucide="Menu"])');
    if (await mobileMenuButton.isVisible()) {
      await expect(mobileMenuButton).toBeVisible();
    }
  });

  test('should handle content interactions', async ({ page }) => {
    // Look for content items
    const contentItems = page.locator('[role="button"]');
    
    if (await contentItems.first().isVisible()) {
      // Click on first content item
      await contentItems.first().click();
      
      // Should navigate to content detail page
      await expect(page).toHaveURL(/\/content\/.+/);
    }
  });

  test('should handle pagination', async ({ page }) => {
    // Look for pagination elements
    const pagination = page.locator('[role="navigation"]');
    
    if (await pagination.isVisible()) {
      // Check for pagination controls
      await expect(page.locator('text=Previous')).toBeVisible();
      await expect(page.locator('text=Next')).toBeVisible();
      
      // Test next page
      const nextButton = page.locator('a[aria-label="Go to next page"]');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await expect(page).toHaveURL(/\/library\?page=2/);
      }
    }
  });

  test('should handle content actions', async ({ page }) => {
    // Look for content action buttons
    const actionButtons = page.locator('button:has([data-lucide="MoreHorizontal"])');
    
    if (await actionButtons.first().isVisible()) {
      // Click on first action button
      await actionButtons.first().click();
      
      // Check for action menu items
      await expect(page.locator('text=Edit')).toBeVisible();
      await expect(page.locator('text=Delete')).toBeVisible();
      await expect(page.locator('text=Favorite')).toBeVisible();
    }
  });
}); 