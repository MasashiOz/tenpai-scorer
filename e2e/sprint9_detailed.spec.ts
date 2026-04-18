import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Helper: click a specific tile button in the palette
async function clickTile(page: any, tileText: string) {
  // Tile buttons are in the palette, they have text like "1萬", "東", etc.
  const btn = page.locator('button').filter({ hasText: new RegExp(`^${tileText}$`) });
  await btn.first().click();
  await page.waitForTimeout(50);
}

// Helper: add multiple tiles
async function addTiles(page: any, tiles: string[]) {
  for (const tile of tiles) {
    await clickTile(page, tile);
  }
}

// Helper: reset
async function resetAll(page: any) {
  const resetBtn = page.locator('button').filter({ hasText: '全リセット' }).first();
  await resetBtn.click();
  await page.waitForTimeout(200);
}

test.describe('Sprint 9 詳細テスト', () => {

  test('AC1: 375pxでの横スクロール確認', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check overflow
    const overflowInfo = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const overflowingEls: string[] = [];
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth + 5) {
          overflowingEls.push(`${el.tagName}.${el.className.substring(0, 30)}: right=${rect.right}`);
        }
      });
      return {
        bodyScrollWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth,
        overflowingElements: overflowingEls.slice(0, 10),
      };
    });

    console.log('375px overflow info:', JSON.stringify(overflowInfo, null, 2));

    // Check main content fits
    expect(overflowInfo.bodyScrollWidth).toBeLessThanOrEqual(375 + 5);
    await page.screenshot({ path: '/tmp/sprint9_375px_detailed.png', fullPage: true });
  });

  test('AC2: 1280pxでのレイアウト確認', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const overflowInfo = await page.evaluate(() => ({
      bodyScrollWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
    }));

    console.log('1280px overflow info:', JSON.stringify(overflowInfo));
    expect(overflowInfo.bodyScrollWidth).toBeLessThanOrEqual(1280 + 5);

    // Verify key sections exist
    await expect(page.locator('body')).toContainText('状況設定');
    await expect(page.locator('body')).toContainText('牌パレット');
    await expect(page.locator('body')).toContainText('手牌');

    await page.screenshot({ path: '/tmp/sprint9_1280px_detailed.png', fullPage: true });
  });

  test('AC3: アコーディオン開閉 - 実際の手牌入力', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await resetAll(page);

    // Add a tenpai hand: 2萬×3 / 4萬×3 / 6萬×3 / 2筒×2 / 4筒×2 (shanpon on 2筒/4筒)
    // But tile buttons are: "2萬", "4萬", etc.
    const tilesToAdd = [
      '2萬', '2萬', '2萬',
      '4萬', '4萬', '4萬',
      '6萬', '6萬', '6萬',
      '2筒', '2筒',
      '4筒', '4筒',
    ];

    for (const tile of tilesToAdd) {
      await page.locator('button').filter({ hasText: new RegExp(`^${tile}$`) }).first().click();
      await page.waitForTimeout(50);
    }

    await page.screenshot({ path: '/tmp/sprint9_accordion_before_tenpai.png' });

    // Check hand count
    const bodyText = await page.locator('body').textContent();
    console.log('Hand area text:', bodyText?.match(/\d+\/14枚/)?.[0] || 'not found');

    // Click tenpai button
    const tenpaiBtn = page.locator('button').filter({ hasText: /聴牌判定/ }).first();
    const isTenpaiEnabled = await tenpaiBtn.isEnabled();
    console.log('Tenpai button enabled:', isTenpaiEnabled);

    if (isTenpaiEnabled) {
      await tenpaiBtn.click();
      await page.waitForTimeout(500);

      await page.screenshot({ path: '/tmp/sprint9_accordion_after_tenpai.png' });

      // Check result table is visible
      const resultText = await page.locator('body').textContent();
      const hasTenpaiResult = resultText?.includes('聴牌') || resultText?.includes('ロン') || resultText?.includes('ツモ');
      console.log('Has tenpai result:', hasTenpaiResult);

      if (hasTenpaiResult) {
        // Try to click a row in the results table to trigger accordion
        // Look for rows with tile data
        const resultRows = page.locator('tr[role="button"], tr[tabindex], div[role="button"]');
        const rowCount = await resultRows.count();
        console.log('Result rows with role=button:', rowCount);

        if (rowCount > 0) {
          await resultRows.first().click();
          await page.waitForTimeout(300);
          await page.screenshot({ path: '/tmp/sprint9_accordion_expanded.png' });

          // Check that detail was expanded
          const expandedText = await page.locator('body').textContent();
          const hasDetail = expandedText?.includes('符') || expandedText?.includes('翻') || expandedText?.includes('役');
          console.log('Accordion detail expanded (has 符/翻/役):', hasDetail);

          // Click again to close
          await resultRows.first().click();
          await page.waitForTimeout(300);
          await page.screenshot({ path: '/tmp/sprint9_accordion_closed.png' });
          console.log('Accordion closed');
        } else {
          // Try clicking table rows directly
          const tableRows = page.locator('table tbody tr');
          const trCount = await tableRows.count();
          console.log('Table rows:', trCount);

          if (trCount > 0) {
            await tableRows.first().click();
            await page.waitForTimeout(300);
            await page.screenshot({ path: '/tmp/sprint9_accordion_tr_expanded.png' });
          }
        }
      }
    } else {
      console.log('Tenpai button not enabled - checking reason');
      const disabledReason = await page.locator('body').textContent();
      console.log('Disabled reason area:', disabledReason?.match(/\d+枚.*\d+枚|ノーテン|枚必要/)?.[0]);
    }
  });

  test('AC4: ヘルプモーダル詳細確認', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Click ? button
    await page.locator('button').filter({ hasText: '?ヘルプ' }).first().click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/sprint9_help_open.png' });

    // Verify modal opened
    await expect(page.locator('body')).toContainText('ヘルプ');

    // Check 3 tabs
    await expect(page.locator('button').filter({ hasText: '使い方' }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '牌の読み方' }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '役一覧' }).first()).toBeVisible();

    // Navigate to 牌の読み方
    await page.locator('button').filter({ hasText: '牌の読み方' }).first().click();
    await page.waitForTimeout(200);
    const tileReadText = await page.locator('body').textContent();
    expect(tileReadText).toMatch(/萬|筒|索|風|三元/);

    await page.screenshot({ path: '/tmp/sprint9_help_tiles.png' });

    // Navigate to 役一覧
    await page.locator('button').filter({ hasText: '役一覧' }).first().click();
    await page.waitForTimeout(200);
    const yakuListText = await page.locator('body').textContent();
    expect(yakuListText).toMatch(/平和|タンヤオ|役満|国士/);

    await page.screenshot({ path: '/tmp/sprint9_help_yaku.png' });

    // Close modal
    // Look for X button or close button inside modal
    const closeButtons = page.locator('button').filter({ hasText: /^×$|^✕$|^close$|^閉じる$/ });
    const closeCount = await closeButtons.count();
    console.log('Close buttons found:', closeCount);

    if (closeCount > 0) {
      await closeButtons.first().click();
    } else {
      // Try clicking outside modal (backdrop)
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(300);

    // Verify modal closed (role list should not contain help content)
    const afterClose = await page.locator('body').textContent();
    const modalStillOpen = afterClose?.includes('使い方') && afterClose?.includes('牌の読み方') && afterClose?.includes('役一覧');
    console.log('Modal still showing all tabs after close:', modalStillOpen);

    await page.screenshot({ path: '/tmp/sprint9_help_closed.png' });
  });

  test('AC5: エラートースト - 14枚超過', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await resetAll(page);

    // Add 14 tiles: 4×1萬, 4×2萬, 4×3萬, 2×4萬
    const tiles14 = [
      '1萬', '1萬', '1萬', '1萬',
      '2萬', '2萬', '2萬', '2萬',
      '3萬', '3萬', '3萬', '3萬',
      '4萬', '4萬',
    ];

    for (const tile of tiles14) {
      await page.locator('button').filter({ hasText: new RegExp(`^${tile}$`) }).first().click();
      await page.waitForTimeout(50);
    }

    // Check we have 14 tiles
    const bodyText14 = await page.locator('body').textContent();
    const hasMax = bodyText14?.includes('14/14') || bodyText14?.includes('満杯') || bodyText14?.includes('14枚');
    console.log('Has 14 tiles indicator:', hasMax);

    await page.screenshot({ path: '/tmp/sprint9_toast_before.png' });

    // Try to add 15th tile - should trigger toast
    await page.locator('button').filter({ hasText: /^5萬$/ }).first().click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: '/tmp/sprint9_toast_after.png' });

    // Check toast appeared
    const bodyAfter = await page.locator('body').textContent();
    const hasToast = bodyAfter?.includes('満杯') || bodyAfter?.includes('追加できません') || bodyAfter?.includes('14枚') || bodyAfter?.includes('これ以上');
    console.log('Toast/error message appeared:', hasToast);

    // Also check for toast element specifically
    const toastEl = page.locator('[role="alert"], .toast, [data-toast]');
    const toastCount = await toastEl.count();
    console.log('Toast elements found:', toastCount);

    // Try scrolling to bottom to find toast
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.screenshot({ path: '/tmp/sprint9_toast_bottom.png' });
  });

  test('AC6: LocalStorage永続化確認', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await resetAll(page);

    // Set situation
    await page.locator('button').filter({ hasText: /^親$/ }).first().click();
    await page.waitForTimeout(200);
    await page.locator('button').filter({ hasText: /^南場$/ }).first().click();
    await page.waitForTimeout(200);

    // Add some tiles
    const tiles = ['1萬', '2萬', '3萬', '4萬', '5萬'];
    for (const t of tiles) {
      await page.locator('button').filter({ hasText: new RegExp(`^${t}$`) }).first().click();
      await page.waitForTimeout(50);
    }

    // Check LocalStorage before reload
    const beforeReload = await page.evaluate(() => ({
      situation: localStorage.getItem('tenpai-scorer-situation'),
      hand: localStorage.getItem('tenpai-scorer-hand'),
    }));
    console.log('Before reload - situation:', beforeReload.situation);
    console.log('Before reload - hand:', beforeReload.hand?.substring(0, 100));

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.screenshot({ path: '/tmp/sprint9_after_reload_detail.png' });

    // Check LocalStorage after reload
    const afterReload = await page.evaluate(() => ({
      situation: localStorage.getItem('tenpai-scorer-situation'),
      hand: localStorage.getItem('tenpai-scorer-hand'),
    }));
    console.log('After reload - situation:', afterReload.situation);
    console.log('After reload - hand:', afterReload.hand?.substring(0, 100));

    // Verify data persisted
    expect(afterReload.situation).not.toBeNull();
    const parsedSituation = JSON.parse(afterReload.situation || '{}');
    console.log('Situation playerPosition after reload:', parsedSituation.playerPosition);
    console.log('Situation roundWind after reload:', parsedSituation.roundWind);

    // Should be dealer (親) and south (南場)
    expect(parsedSituation.playerPosition).toBe('dealer');
    expect(parsedSituation.roundWind).toBe('south');

    // Check hand tiles are also restored
    const parsedHand = JSON.parse(afterReload.hand || '[]');
    console.log('Hand tiles after reload count:', parsedHand.length);
    expect(parsedHand.length).toBe(5);

    // Visual check - 親 button should be highlighted
    const bodyText = await page.locator('body').textContent();
    const hasOyaMark = bodyText?.includes('親✓') || bodyText?.includes('親 ✓');
    console.log('親 highlighted:', hasOyaMark);
  });

  test('全リセット後のLocalStorage確認', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Add some data
    await page.locator('button').filter({ hasText: /^1萬$/ }).first().click();
    await page.waitForTimeout(100);

    // Reset all
    await resetAll(page);

    // Take screenshot to check toast
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/sprint9_reset_toast.png' });

    const bodyAfterReset = await page.locator('body').textContent();
    const hasResetMsg = bodyAfterReset?.includes('リセット') || bodyAfterReset?.includes('クリア');
    console.log('Reset message appeared:', hasResetMsg);

    // After reset, localStorage should have empty state
    const lsData = await page.evaluate(() => ({
      hand: localStorage.getItem('tenpai-scorer-hand'),
    }));
    const parsedHand = JSON.parse(lsData.hand || '[]');
    console.log('Hand after reset:', parsedHand.length, 'tiles');
    expect(parsedHand.length).toBe(0);

    // Reload to verify empty state persists
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    const lsAfterReload = await page.evaluate(() => ({
      hand: localStorage.getItem('tenpai-scorer-hand'),
    }));
    const parsedHandAfterReload = JSON.parse(lsAfterReload.hand || '[]');
    console.log('Hand after reset+reload:', parsedHandAfterReload.length, 'tiles');
    expect(parsedHandAfterReload.length).toBe(0);
  });

  test('Sprint7回帰: ポン・チー・カンボタン確認', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Scroll down to find meld panel
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);

    // Check for meld-related buttons
    const bodyText = await page.locator('body').textContent();
    console.log('Has ポン:', bodyText?.includes('ポン'));
    console.log('Has チー:', bodyText?.includes('チー'));
    console.log('Has カン/槓:', bodyText?.includes('カン') || bodyText?.includes('槓'));

    // Take full page screenshot
    await page.screenshot({ path: '/tmp/sprint9_meld_panel.png', fullPage: true });

    expect(bodyText).toContain('ポン');
    expect(bodyText).toContain('チー');
  });

  test('完全E2Eフロー: 手牌入力→聴牌→役表示', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await resetAll(page);

    // Add a clear tenpai hand: shanpon on 2筒/4筒
    // 2萬×3 / 4萬×3 / 6萬×3 / 2筒×2 / 4筒×2 = 13 tiles, shanpon
    const hand = ['2萬','2萬','2萬','4萬','4萬','4萬','6萬','6萬','6萬','2筒','2筒','4筒','4筒'];
    for (const t of hand) {
      await page.locator('button').filter({ hasText: new RegExp(`^${t}$`) }).first().click();
      await page.waitForTimeout(50);
    }

    // Check tile count
    const bodyText = await page.locator('body').textContent();
    const tileCount = bodyText?.match(/(\d+)\/14枚/)?.[1];
    console.log('Current tile count:', tileCount);

    // Click tenpai button
    const tenpaiBtn = page.locator('button').filter({ hasText: /聴牌判定/ }).first();
    expect(await tenpaiBtn.isEnabled()).toBeTruthy();
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: '/tmp/sprint9_tenpai_result.png' });

    // Check result
    const resultText = await page.locator('body').textContent();
    console.log('Has 聴牌:', resultText?.includes('聴牌'));
    console.log('Has ロン:', resultText?.includes('ロン'));
    console.log('Has ツモ:', resultText?.includes('ツモ'));
    console.log('Has 嶺上:', resultText?.includes('嶺上'));

    expect(resultText).toContain('ロン');
    expect(resultText).toContain('ツモ');
    expect(resultText).toContain('嶺上');

    // Click a row to open accordion
    const rows = page.locator('table tbody tr').filter({ has: page.locator('td') });
    const rowCount = await rows.count();
    console.log('Result table rows:', rowCount);

    if (rowCount > 0) {
      await rows.first().click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: '/tmp/sprint9_accordion_open.png' });

      const expandedText = await page.locator('body').textContent();
      const hasYakuDetail = expandedText?.includes('タンヤオ') || expandedText?.includes('翻') || expandedText?.includes('符');
      console.log('Has yaku detail in accordion:', hasYakuDetail);
      expect(hasYakuDetail).toBeTruthy();

      // Check fu breakdown accordion
      const fuBreakdownBtn = page.locator('button').filter({ hasText: /符の内訳|内訳/ }).first();
      const fuBtnVisible = await fuBreakdownBtn.isVisible();
      console.log('Fu breakdown button visible:', fuBtnVisible);

      if (fuBtnVisible) {
        await fuBreakdownBtn.click();
        await page.waitForTimeout(200);
        await page.screenshot({ path: '/tmp/sprint9_fu_expanded.png' });

        const fuText = await page.locator('body').textContent();
        const hasFuDetail = fuText?.includes('副底') || fuText?.includes('符');
        console.log('Fu detail shown:', hasFuDetail);
      }
    }
  });
});
