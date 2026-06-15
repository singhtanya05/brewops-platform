import { test, expect } from '@playwright/test';

test('Order Checkout fails with insufficient inventory', async ({ page }) => {
  let alertMessage = '';
  page.on('dialog', async dialog => {
    alertMessage = dialog.message();
    await dialog.accept();
  });

  await page.goto('/');

  // Expect to see the menu
  await expect(page.locator('text=Handcrafted Drink Menu')).toBeVisible();

  // Click the Bakery category tab
  await page.click('button:has-text("Bakery")');

  // Find the Croissant product
  const croissantAddButton = page.locator('button:has-text("Add to Cart +")').first();
  await croissantAddButton.click();

  // Wait for Customization Modal
  await expect(page.locator('text=Special Instructions')).toBeVisible({ timeout: 5000 });

  // In the product modal, increment quantity to 11
  const increaseButton = page.locator('button', { hasText: '+' }).nth(1); 
  // Wait, the Add to Cart + button is still on page. Let's use exact text for the quantity button
  const plusButton = page.locator('button:text-is("+")');
  
  for (let i = 0; i < 10; i++) {
    await plusButton.click();
  }

  // Add to order
  await page.locator('button:has-text("Add to Order")').click();

  // Open Cart Drawer - wait, it auto opens! 
  // Just proceed to Checkout
  await page.click('button:has-text("Checkout Securely")');

  // In Payment modal, click Pay
  await page.click('button:has-text("Pay with Card")');

  // Wait a bit for the API call to fail and trigger the alert
  await page.waitForTimeout(3000);

  // Assert the alert message contained the failure message
  expect(alertMessage).toContain('Failed to process order');
});
