import { test, expect } from '@playwright/test';

test.describe('Phase 4: Real 4-Player Multiplayer Match with Full Animations', () => {
  test('runs complete 4-player multiplayer match across 4 browser sessions to Bhabhi finish', async ({
    browser,
  }) => {
    // 4 minutes timeout for full 52-card match
    test.setTimeout(240000);

    // 1. Create 4 isolated browser contexts (simulating 4 separate devices/users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();
    const context4 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    const page3 = await context3.newPage();
    const page4 = await context4.newPage();

    const allPages = [page1, page2, page3, page4];

    // Configure distinct player profiles with Phase 4 animations and sound enabled
    const players = [
      { page: page1, nickname: 'FarhanHost', avatar: 'avatar-1' },
      { page: page2, nickname: 'ZainabPlayer', avatar: 'avatar-2' },
      { page: page3, nickname: 'HamzaPlayer', avatar: 'avatar-3' },
      { page: page4, nickname: 'AyeshaPlayer', avatar: 'avatar-4' },
    ];

    for (const p of players) {
      await p.page.addInitScript(
        ({ nickname, avatar }) => {
          localStorage.setItem(
            'bhabhi_guest_settings',
            JSON.stringify({
              nickname,
              avatar,
              soundEnabled: true,
              volume: 75,
              reducedMotion: false,
              animationSpeed: 'normal',
              muteEmotes: false,
              muteQuickChat: false,
            })
          );
        },
        { nickname: p.nickname, avatar: p.avatar }
      );
    }

    // 2. Host (page1) creates a 4-player room
    await page1.goto('/create');
    await expect(page1.getByRole('heading', { name: /create game room/i })).toBeVisible();

    // Verify 4 players is selected by default and submit
    await page1.getByRole('button', { name: 'Create Room', exact: true }).click();

    // Wait for lobby navigation
    await expect(page1).toHaveURL(/\/lobby\/([A-Z0-9]{6})/);
    const roomUrl = page1.url();
    const roomCodeMatch = roomUrl.match(/\/lobby\/([A-Z0-9]{6})/);
    expect(roomCodeMatch).not.toBeNull();
    const roomCode = roomCodeMatch![1];

    console.log(`[E2E] Room created successfully: ${roomCode}`);

    // Verify Host is in lobby
    await expect(page1.getByText(new RegExp(`Room ${roomCode}`, 'i'))).toBeVisible();
    await expect(page1.getByRole('main').getByText('FarhanHost')).toBeVisible();

    // 3. Players 2, 3, and 4 join via room code
    for (let i = 1; i < players.length; i++) {
      const p = players[i]!;
      await p.page.goto('/join');
      await expect(p.page.getByRole('heading', { name: /join game room/i })).toBeVisible();

      // Enter room code and join
      const input = p.page.getByPlaceholder(/e\.g\. 7x9k2a/i);
      await input.fill(roomCode);
      await p.page.getByRole('button', { name: 'Enter Room', exact: true }).click();

      // Wait for lobby entry
      await expect(p.page).toHaveURL(new RegExp(`/lobby/${roomCode}`));
      await expect(p.page.getByRole('main').getByText(p.nickname)).toBeVisible();

      // Click Ready
      const readyBtn = p.page.getByRole('button', { name: /click to ready/i });
      await expect(readyBtn).toBeVisible();
      await readyBtn.click();
      await expect(p.page.getByText('Ready ✓')).toBeVisible();
      console.log(`[E2E] Player ${p.nickname} joined and marked ready`);
    }

    // 4. Host verifies all 4 players connected and starts match
    await expect(page1.getByText('4 / 4 Players')).toBeVisible();
    const startMatchBtn = page1.getByRole('button', { name: /start match/i });
    await expect(startMatchBtn).toBeEnabled({ timeout: 5000 });
    await startMatchBtn.click();
    console.log(`[E2E] Host launched the match!`);

    // 5. All 4 browser sessions navigate to /multiplayer
    for (const p of players) {
      await expect(p.page).toHaveURL(/\/multiplayer/, { timeout: 10000 });
      console.log(`[E2E] Player ${p.nickname} entered multiplayer view`);
    }

    // 6. Verify Phase 4 Dealing Overlay in action
    // Check dealing overlay text appears or completes
    const skipBtn1 = page1.getByText(/click anywhere to skip/i);
    if (await skipBtn1.isVisible({ timeout: 1500 }).catch(() => false)) {
      await skipBtn1.click();
    }

    for (const p of players) {
      const skip = p.page.getByText(/click anywhere to skip/i);
      if (await skip.isVisible({ timeout: 1000 }).catch(() => false)) {
        await skip.click();
      }
      // Verify hand and table rendered
      await expect(p.page.getByRole('region', { name: /player hand/i })).toBeVisible({
        timeout: 5000,
      });
      await expect(p.page.getByText(/cards remaining/i)).toBeVisible();
    }

    // 7. Test live multiplayer reactions across sessions
    console.log(`[E2E] Testing live multiplayer emote reaction broadcast...`);
    const emoteBarTrigger = page1.getByRole('button', { name: /reactions and quick chat/i });
    await expect(emoteBarTrigger).toBeVisible();
    await emoteBarTrigger.click();

    // Select Fire emoji
    const fireBtn = page1.getByRole('button', { name: /fire/i });
    await expect(fireBtn).toBeVisible();
    await fireBtn.click();

    // Verify fire reaction floating on Player 2's screen
    await expect(page2.getByRole('img', { name: 'fire' })).toBeVisible({ timeout: 5000 });
    console.log(`[E2E] Live emote reaction successfully broadcasted to session 2!`);

    // 8. Automated gameplay loop: play turns sequentially until match completion
    console.log(`[E2E] Starting turn play loop across all 4 browser sessions...`);
    let turnsPlayed = 0;
    const maxTurns = 300; // Safeguard against infinite loops

    while (turnsPlayed < maxTurns) {
      // Check if any player sees the finished screen
      const isFinished = await page1
        .getByText(/bhabhi mil gayi!/i)
        .isVisible()
        .catch(() => false);

      if (isFinished) {
        console.log(`[E2E] Match finish detected after ${turnsPlayed} card plays!`);
        break;
      }

      // Identify which player's turn it is
      let activePlayer: (typeof players)[0] | null = null;

      for (const p of players) {
        const isTurn = await p.page
          .getByText('YOUR TURN')
          .isVisible()
          .catch(() => false);
        if (isTurn) {
          activePlayer = p;
          break;
        }
      }

      if (!activePlayer) {
        // Wait a moment for animations or trick sweep to settle
        await page1.waitForTimeout(300);
        continue;
      }

      // Active player found! Play a legal card
      const handRegion = activePlayer.page.getByRole('region', { name: /player hand/i });
      const legalCards = handRegion.locator('[role="button"][aria-disabled="false"]');
      const legalCount = await legalCards.count();

      if (legalCount === 0) {
        await page1.waitForTimeout(200);
        continue;
      }

      // Click first legal card (use top-left offset & force: true so overlapping cards in large hands never block click)
      const targetCard = legalCards.first();
      await targetCard.click({ position: { x: 15, y: 15 }, force: true });

      // Click "Play Card"
      const playCardBtn = activePlayer.page.getByRole('button', { name: /play card/i });
      await expect(playCardBtn).toBeEnabled({ timeout: 2000 });
      await playCardBtn.click();

      turnsPlayed++;
      if (turnsPlayed % 5 === 0) {
        console.log(`[E2E] Turn ${turnsPlayed}: ${activePlayer.nickname} played card`);
      }

      // Brief pause to allow Phase 4 animation and socket sync
      await activePlayer.page.waitForTimeout(200);
    }

    // 9. Verify all 4 sessions display ResultModal ("BHABHI MIL GAYI!")
    console.log(`[E2E] Verifying result modal across all 4 browser sessions...`);
    for (const p of players) {
      await expect(p.page.getByText(/bhabhi mil gayi!/i)).toBeVisible({ timeout: 15000 });
      await expect(p.page.getByRole('button', { name: /vote rematch/i })).toBeVisible();
      console.log(`[E2E] Session ${p.nickname} verified game finished with Bhabhi results!`);
    }

    // 10. Verify Rematch Voting in session 1
    const rematchBtn = page1.getByRole('button', { name: /vote rematch/i });
    await rematchBtn.click();
    await expect(page1.getByText(/voted for rematch/i)).toBeVisible();
    console.log(`[E2E] Rematch voting verified in session 1!`);

    // Clean up all contexts
    await context1.close();
    await context2.close();
    await context3.close();
    await context4.close();
  });
});
