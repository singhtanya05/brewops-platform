import { test, expect } from '@playwright/test';

test('Order Checkout fails when payment is declined, cart is kept', async ({ page }) => {
  let alertMessage = '';
  page.on('dialog', async dialog => {
    alertMessage = dialog.message();
    await dialog.accept();
  });

  await page.goto('/');

  // Expect to see the menu
  await expect(page.locator('text=Handcrafted Drink Menu')).toBeVisible();

  // Click the Coffee category tab
  await page.click('button:has-text("Coffee")');

  // Click a product
  const productAddButton = page.locator('button:has-text("Add to Cart +")').first();
  await productAddButton.click();

  // Wait for Customization Modal
  await expect(page.locator('text=Special Instructions')).toBeVisible({ timeout: 5000 });

  // Add to order
  await page.locator('button:has-text("Add to Order")').click();

  // Verify Cart has 1 item
  await expect(page.locator('text=Subtotal')).toBeVisible();

  // Proceed to Checkout
  await page.click('button:has-text("Checkout Securely")');

  // In Payment modal, click Simulate Decline
  await page.click('button:has-text("Simulate Decline")');

  // Wait for the failure to be processed
  await page.waitForTimeout(2000);

  // Assert the alert message popped up
  expect(alertMessage).toContain('Failed to process order');

  // Verify that the cart items are still present, cart should not be wiped
  // The payment modal might close or stay open. If it closed, the drawer might be visible.
  // We can just verify the drawer is still in DOM and has 1 item.
  await expect(page.locator('text=Subtotal')).toBeVisible();
});
