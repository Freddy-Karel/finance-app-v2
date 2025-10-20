import { test, expect } from '@playwright/test';
test('Entrées smoke', async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Entrées/i })).toBeVisible();
  await page.getByRole('link', { name: /Entrées/i }).click();
  await expect(page.getByRole('heading', { name: /Entrées/i })).toBeVisible();
});
