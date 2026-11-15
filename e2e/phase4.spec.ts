import { test, expect } from '@playwright/test';

test.describe('Phase 4: Premium Animations, Audio Settings, Emotes & Mobile Polish', () => {
  test('displays dealing overlay on practice start and supports skipping', async ({ page }) => {
    await page.goto('/practice?players=4');

    // Dealing overlay appears or completes
    const skipBtn = page.getByText(/click anywhere to skip/i);
    if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await skipBtn.click();
    }

    // Verify main table is loaded
    await expect(page.getByText(/practice vs bots \(4p\)/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /play card/i })).toBeVisible();
  });

  test('opens emote bar, switches tabs, and sends reactions', async ({ page }) => {
    await page.goto('/practice?players=4');

    // Wait for dealing overlay to complete or skip it
    const skipBtn = page.getByText(/click anywhere to skip/i);
    if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await skipBtn.click();
    }

    const emoteTrigger = page.getByRole('button', { name: /reactions and quick chat/i });
    await expect(emoteTrigger).toBeVisible();
    await emoteTrigger.click();

    // Verify Emotes and Quick Chat tabs
    await expect(page.getByRole('button', { name: /emotes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Quick Chat', exact: true })).toBeVisible();

    // Select Fire emote using button role
    const fireEmote = page.getByRole('button', { name: /fire/i });
    await expect(fireEmote).toBeVisible();
    await fireEmote.click();

    // Panel closes after selection
    await expect(page.getByRole('button', { name: 'Quick Chat', exact: true })).not.toBeVisible();
  });

  test('opens in-game settings modal and updates game preferences', async ({ page }) => {
    await page.goto('/practice?players=4');

    const skipBtn = page.getByText(/tap to skip/i);
    if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await skipBtn.click();
    }

    const settingsBtn = page.getByRole('button', { name: /game settings/i });
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();

    // Verify settings modal options
    await expect(page.getByText('Game Settings')).toBeVisible();
    await expect(page.getByText(/animation speed/i)).toBeVisible();
    await expect(page.getByText(/master sound/i)).toBeVisible();

    // Close settings modal
    const closeBtn = page.getByRole('button', { name: /close settings/i });
    await closeBtn.click();
    await expect(page.getByText('Game Settings')).not.toBeVisible();
  });

  test('renders properly on mobile portrait viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/practice?players=3');

    const skipBtn = page.getByText(/tap to skip/i);
    if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await skipBtn.click();
    }

    // Verify key elements fit on mobile
    await expect(page.getByText(/practice vs bots/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /play card/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /player hand/i })).toBeVisible();
  });

  test('renders properly on mobile landscape viewport', async ({ page }) => {
    await page.setViewportSize({ width: 734, height: 412 });
    await page.goto('/practice?players=3');

    const skipBtn = page.getByText(/tap to skip/i);
    if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await skipBtn.click();
    }

    await expect(page.getByText(/practice vs bots/i)).toBeVisible();
    await expect(page.getByRole('region', { name: /player hand/i })).toBeVisible();
  });
});
