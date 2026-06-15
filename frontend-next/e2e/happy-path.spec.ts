import { test, expect } from '@playwright/test';

test('Order Checkout Happy Path', async ({ page }) => {
  // Go to homepage
  await page.goto('/');

  // Expect to see the menu
  await expect(page.locator('text=Handcrafted Drink Menu')).toBeVisible();

  // Click the Coffee category tab to ensure we select a coffee drink
  await page.click('button:has-text("Coffee")');

  // Click a product
  const productAddButton = page.locator('button:has-text("Add to Cart +")').first();
  await productAddButton.click();

  // Customization Modal
  try {
    await expect(page.locator('text=Milk Choice')).toBeVisible({ timeout: 5000 });
  } catch (e) {
    console.log(await page.content());
    throw e;
  }
  
  // Choose Oat Milk
  await page.click('text=Oat Milk (+$0.50)');
  
  // Add to Cart
  await page.click('button:has-text("Add to Order")');

  // Open Cart (Auto-opened by Add to Order)

  // Checkout
  await page.click('button:has-text("Checkout Securely")');

  // Payment Modal
  await page.click('button:has-text("Pay with Card")');

  // Tracking UI
  await expect(page.locator('text=Order Tracking')).toBeVisible({ timeout: 10000 });
});
