import { test, expect } from '@playwright/test';
test('Distribution smoke', async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Distribution/i })).toBeVisible();
  await page.getByRole('link', { name: /Distribution/i }).click();
  await expect(page.getByRole('heading', { name: /Distribution/i })).toBeVisible();
});
