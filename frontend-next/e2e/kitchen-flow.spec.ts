import { test, expect } from '@playwright/test';

test('Kitchen Flow - order state transitions', async ({ page }) => {
  // 1. Create an order on the storefront
  await page.goto('/');
  await expect(page.locator('text=Handcrafted Drink Menu')).toBeVisible();
  
  // Choose Coffee -> Add Cappuccino
  await page.click('button:has-text("Coffee")');
  await page.locator('button:has-text("Add to Cart +")').first().click();
  await expect(page.locator('text=Special Instructions')).toBeVisible({ timeout: 5000 });
  
  await page.click('button:has-text("Add to Order")');
  await page.click('button:has-text("Checkout Securely")');
  await page.click('button:has-text("Pay with Card")');
  
  // Wait for order tracking to appear and data to load (no '...')
  const trackingHeading = page.locator('h2', { hasText: 'Order Tracking #' });
  await expect(trackingHeading.filter({ hasNotText: '...' })).toBeVisible({ timeout: 10000 });
  
  const orderHeading = await trackingHeading.innerText();
  // It says "Order Tracking #12345"
  const orderNumber = orderHeading.replace('Order Tracking #', '').trim();
  
  // 2. Clear local storage to reset any persisted UI overlays (like cart drawer)
  await page.evaluate(() => window.localStorage.clear());
  
  // Go to Login page
  await page.goto('/login');
  await expect(page.locator('text=Email Address')).toBeVisible();
  
  await page.fill('input[type="email"]', 'staff@brewops.local');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // 3. Should redirect to Kitchen Queue
  await expect(page.locator('h1:has-text("Kitchen Queue")')).toBeVisible({ timeout: 10000 });
  
  // 4. Find the order in the 'paid' column (New Orders)
  const orderCard = page.locator(`.bg-white:has-text("#${orderNumber}")`);
  await expect(orderCard).toBeVisible({ timeout: 15000 });
  
  // 5. Move to Preparing
  await orderCard.locator('button:has-text("Start Brewing")').click();
  
  // It should show up in "Mark Ready" state (Preparing column)
  await expect(orderCard.locator('button:has-text("Mark Ready")')).toBeVisible({ timeout: 5000 });
  
  // 6. Move to Ready
  await orderCard.locator('button:has-text("Mark Ready")').click();
  
  // It should show up in "Complete & Handover" state (Ready for Pickup column)
  await expect(orderCard.locator('button:has-text("Complete & Handover")')).toBeVisible({ timeout: 5000 });
  
  // 7. Complete it
  await orderCard.locator('button:has-text("Complete & Handover")').click();
  
  // It should disappear from the active kitchen board
  await expect(orderCard).toHaveCount(0, { timeout: 5000 });
});
