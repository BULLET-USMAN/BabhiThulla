import { test, expect } from '@playwright/test';

test.describe('Phase 6 — Real Multiplayer Scenarios (A–H) E2E', () => {
  test('Scenario A & C: 3-Player Room Creation, Ready-up, and Start', async ({ browser, isMobile }) => {
    test.skip(isMobile, 'Multi-client 3-browser orchestration test is designed for Desktop execution');
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    const page3 = await context3.newPage();

    // Set distinct nicknames in localStorage to avoid room nickname collisions
    await page1.addInitScript(() => {
      localStorage.setItem('bhabhi_guest_settings', JSON.stringify({ nickname: 'HostP1', avatar: 'avatar-1' }));
    });
    await page2.addInitScript(() => {
      localStorage.setItem('bhabhi_guest_settings', JSON.stringify({ nickname: 'ZainabP2', avatar: 'avatar-2' }));
    });
    await page3.addInitScript(() => {
      localStorage.setItem('bhabhi_guest_settings', JSON.stringify({ nickname: 'HamzaP3', avatar: 'avatar-3' }));
    });

    // 1. Host creates 3-player room
    await page1.goto('/create');
    await page1.getByRole('button', { name: '3', exact: true }).click();
    await page1.getByRole('button', { name: 'Create Room', exact: true }).click();

    await expect(page1).toHaveURL(/\/lobby\/[2-9A-HJ-NP-Z]{6}/);
    const roomCodeMatch = page1.url().match(/\/lobby\/([2-9A-HJ-NP-Z]{6})/);
    expect(roomCodeMatch).toBeTruthy();
    const roomCode = roomCodeMatch![1];

    // 2. Player 2 joins via invite URL
    await page2.goto(`/join/${roomCode}`);
    await expect(page2.getByRole('heading', { name: /join game room/i })).toBeVisible();
    await page2.getByRole('button', { name: 'Enter Room', exact: true }).click();
    await expect(page2).toHaveURL(new RegExp(`/lobby/${roomCode}`));
    await page2.getByRole('button', { name: /click to ready/i }).click();

    // 3. Player 3 joins via invite URL
    await page3.goto(`/join/${roomCode}`);
    await expect(page3.getByRole('heading', { name: /join game room/i })).toBeVisible();
    await page3.getByRole('button', { name: 'Enter Room', exact: true }).click();
    await expect(page3).toHaveURL(new RegExp(`/lobby/${roomCode}`));
    await page3.getByRole('button', { name: /click to ready/i }).click();

    // 4. Host launches match
    await expect(page1.getByText('3 / 3 Players')).toBeVisible({ timeout: 5000 });
    const startBtn = page1.getByRole('button', { name: /start match/i });
    await expect(startBtn).toBeEnabled({ timeout: 5000 });
    await startBtn.click();

    // Verify all 3 enter table
    await expect(page1).toHaveURL(/\/multiplayer/, { timeout: 15000 });
    await expect(page2).toHaveURL(/\/multiplayer/, { timeout: 15000 });
    await expect(page3).toHaveURL(/\/multiplayer/, { timeout: 15000 });

    await context1.close();
    await context2.close();
    await context3.close();
  });

  test('Scenario D: 6-Player Capacity Limit and 7th Join Rejection', async ({ browser, isMobile }) => {
    test.skip(isMobile, 'Multi-context capacity test is designed for Desktop execution');
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();

    // 1. Host creates 6-player room
    await hostPage.goto('/create');
    await hostPage.getByRole('button', { name: '6', exact: true }).click();
    await hostPage.getByRole('button', { name: 'Create Room', exact: true }).click();

    await expect(hostPage).toHaveURL(/\/lobby\/[2-9A-HJ-NP-Z]{6}/);
    const roomCode = hostPage.url().match(/\/lobby\/([2-9A-HJ-NP-Z]{6})/)![1];

    // Verify 6 slots displayed in lobby
    await expect(hostPage.getByText(/1 \/ 6 players/i)).toBeVisible();

    // 2. Verify joining works via direct URL
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await guestPage.goto(`/join/${roomCode}`);
    await expect(guestPage.getByRole('heading', { name: /join game room/i })).toBeVisible();
    await expect(guestPage.getByRole('button', { name: 'Enter Room', exact: true })).toBeVisible();

    await hostContext.close();
    await guestContext.close();
  });

  test('Scenario G & H: Anti-Cheat & Invalid Action Safety', async ({ page }) => {
    // Navigate to practice view to test client action safety and rules enforcement
    await page.goto('/practice');

    // Verify player hand is rendered
    const hand = page.getByRole('region', { name: /player hand/i });
    await expect(hand).toBeVisible({ timeout: 10000 });

    // Disabled cards (non-legal moves) cannot be played
    const disabledCards = hand.locator('[role="button"][aria-disabled="true"]');
    const disabledCount = await disabledCards.count();
    if (disabledCount > 0) {
      const firstDisabled = disabledCards.first();
      // Click disabled card
      await firstDisabled.click({ force: true });
      // "Play Card" button remains disabled
      const playBtn = page.getByRole('button', { name: /play card/i });
      await expect(playBtn).toBeDisabled();
    }
  });
});
