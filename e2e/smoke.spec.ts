import { test, expect } from '@playwright/test';

test.describe('Bhabhi Thulla Web Smoke Tests', () => {
  test('loads landing page and displays title, actions, and card showcase', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Bhabhi Thulla/i);
    await expect(page.getByRole('heading', { name: /bhabhi thulla/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /play vs bots/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create room/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /join room/i })).toBeVisible();
  });

  test('opens practice setup modal and launches practice match', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /play vs bots/i }).click();

    // Verify modal appears
    await expect(page.getByText(/play vs bots \(practice mode\)/i)).toBeVisible();

    // Start practice match
    await page.getByRole('button', { name: /start practice match/i }).click();

    // Verify practice game table renders
    await expect(page.getByText(/practice vs bots/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /play card/i })).toBeVisible();
  });

  test('navigates to how to play and shows Thulla walkthrough', async ({ page }) => {
    await page.goto('/rules');
    await expect(page.getByRole('heading', { name: /how to play/i })).toBeVisible();
    await expect(page.getByText(/giving a "thulla"/i)).toBeVisible();
    await expect(page.getByText(/king of spades/i).first()).toBeVisible();
  });

  test('navigates to game table preview and supports card interaction', async ({ page }) => {
    await page.goto('/table');
    await expect(page.getByText(/bhabhi thulla trick pile/i)).toBeVisible();

    // Check play card button
    const playBtn = page.getByRole('button', { name: /play card/i });
    await expect(playBtn).toBeVisible();
    await playBtn.click();

    // Player action turn indicator
    await expect(page.getByText(/your turn/i)).toBeVisible();
  });
});
