import { test, expect } from '@playwright/test';

test.describe('Phase 5 — Player Statistics & Room Leaderboard E2E', () => {
  test('navigates to statistics view and validates player KPI metrics and history layout', async ({ page }) => {
    await page.goto('/');

    // Check Home page contains Statistics navigation
    const statsNavLink = page.getByRole('link', { name: /statistics/i }).first();
    await expect(statsNavLink).toBeVisible();
    await statsNavLink.click();

    // Verify URL
    await expect(page).toHaveURL(/\/stats/);

    // Verify Profile Overview Card
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/Guest Identity ID/i)).toBeVisible();
    await expect(page.getByText(/Escape Rate/i)).toBeVisible();
    await expect(page.getByText(/Bhabhi Rate/i)).toBeVisible();

    // Verify 6 KPI stat cards
    await expect(page.getByText(/Games Played/i)).toBeVisible();
    await expect(page.getByText(/Escapes/i).first()).toBeVisible();
    await expect(page.getByText(/Bhabhi Count/i)).toBeVisible();
    await expect(page.getByText(/Thullas Given/i)).toBeVisible();
    await expect(page.getByText(/Piles Collected/i)).toBeVisible();
    await expect(page.getByText(/Cards Picked/i)).toBeVisible();

    // Verify Match History section and refresh button
    await expect(page.getByText(/Recent Match History/i)).toBeVisible();
    const refreshBtn = page.getByRole('button', { name: /refresh/i });
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();

    // Return to Home
    await page.getByRole('link', { name: /back to home/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('lobby view displays room standings modal when Standings button is clicked', async ({ page }) => {
    await page.goto('/lobby/TEST01?host=true&players=4');

    // Verify Standings button exists in lobby
    const standingsBtn = page.getByRole('button', { name: /standings/i });
    await expect(standingsBtn).toBeVisible();
    await standingsBtn.click();

    // Verify Room Standings Modal opens
    await expect(page.getByRole('heading', { name: /Room TEST01 Standings/i })).toBeVisible();
    await expect(page.getByText(/Ranked by Escape Rate & Games Played/i)).toBeVisible();

    // Close modal
    const closeBtn = page.getByRole('button', { name: 'Close', exact: true });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(page.getByRole('heading', { name: /Room TEST01 Standings/i })).not.toBeVisible();
  });
});
