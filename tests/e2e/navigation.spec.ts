import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should navigate to main pages', async ({ page }) => {
    // Test navigation to dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Test navigation to library
    await page.click('text=Library');
    await expect(page).toHaveURL('/library');
    await expect(page.locator('h1')).toContainText('Your Music Library');

    // Test navigation to setlists
    await page.click('text=Setlists');
    await expect(page).toHaveURL('/setlists');
    await expect(page.locator('h1')).toContainText('Setlists');

    // Test navigation to add content
    await page.click('text=Add Song');
    await expect(page).toHaveURL('/add-content');
    await expect(page.locator('h1')).toContainText('Add Content');
  });

  test('should handle responsive navigation', async ({ page }) => {
    // Test mobile navigation
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile menu button is accessible (hamburger menu)
    const mobileMenuButton = page.locator('button:has([data-lucide="Menu"])');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      // Mobile menu should be visible after clicking
      await expect(page.locator('nav')).toBeVisible();
    }

    // Test desktop navigation
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should maintain navigation state', async ({ page }) => {
    // Navigate to library
    await page.click('text=Library');
    await expect(page).toHaveURL('/library');

    // Refresh the page
    await page.reload();
    
    // Should still be on library page
    await expect(page).toHaveURL('/library');
    await expect(page.locator('h1')).toContainText('Your Music Library');
  });

  test('should handle sidebar collapse', async ({ page }) => {
    // Look for sidebar collapse button
    const collapseButton = page.locator('button:has([data-lucide="PanelLeftClose"])');
    
    if (await collapseButton.isVisible()) {
      // Click to collapse sidebar
      await collapseButton.click();
      
      // Check if sidebar is collapsed (should show expand button)
      await expect(page.locator('button:has([data-lucide="PanelLeftOpen"])')).toBeVisible();
      
      // Click to expand sidebar
      await page.click('button:has([data-lucide="PanelLeftOpen"])');
      
      // Check if sidebar is expanded (should show collapse button)
      await expect(page.locator('button:has([data-lucide="PanelLeftClose"])')).toBeVisible();
    }
  });

  test('should have working search navigation', async ({ page }) => {
    // Find search input in header
    const searchInput = page.locator('input[placeholder="Search..."]');
    
    if (await searchInput.isVisible()) {
      // Enter search term
      await searchInput.fill('test search');
      await searchInput.press('Enter');
      
      // Should navigate to library with search parameter
      await expect(page).toHaveURL(/\/library\?search=test%20search/);
      
      // Check if search term is preserved in input
      await expect(page.locator('input[placeholder="Search..."]')).toHaveValue('test search');
    }
  });

  test('should show user menu when authenticated', async ({ page }) => {
    // Look for user avatar/button
    const userButton = page.locator('button:has(.avatar)');
    
    if (await userButton.isVisible()) {
      // Click user button to open dropdown
      await userButton.click();
      
      // Check for dropdown menu items
      await expect(page.locator('text=Profile')).toBeVisible();
      await expect(page.locator('text=Sign out')).toBeVisible();
      
      // Click profile link
      await page.click('text=Profile');
      await expect(page).toHaveURL('/profile');
    }
  });
}); 