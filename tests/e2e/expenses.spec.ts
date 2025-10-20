import { test, expect } from '@playwright/test';
test('Dépenses smoke', async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Dépenses/i })).toBeVisible();
  await page.getByRole('link', { name: /Dépenses/i }).click();
  await expect(page.getByRole('heading', { name: /Dépenses/i })).toBeVisible();
});
