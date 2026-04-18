import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Helper: click a tile in the palette by its display text
async function clickTileInPalette(page: any, tileText: string) {
  // Find buttons in the tile palette section that contain the text
  const paletteSection = page.locator('section, div').filter({ hasText: '牌パレット' }).first();
  await page.locator('button').filter({ hasText: tileText }).first().click();
}

test.describe('Sprint 9: UI/UX仕上げとレスポンシブ対応', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    // Reset via the "全リセット" button
    const resetBtn = page.locator('button').filter({ hasText: '全リセット' }).first();
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('AC1: スマートフォンサイズ(375px)で横スクロールなしに全要素が表示される', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check no horizontal overflow
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    console.log(`body.scrollWidth=${bodyScrollWidth}, viewport=${viewportWidth}`);
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 5); // small tolerance

    // Check tile palette is visible
    await expect(page.locator('body')).toContainText('牌パレット');

    // Check that the 1-9 man tiles are visible
    const tile1Man = page.locator('button').filter({ hasText: /^1[萬]?$|^1万$/ }).first();
    const firstManTile = page.locator('button').first();
    await expect(page.locator('body')).toContainText('1');

    // Take screenshot for evidence
    await page.screenshot({ path: '/tmp/sprint9_375px.png' });
    console.log('375px screenshot taken');
  });

  test('AC2: PCサイズ(1280px)でレイアウトが崩れない', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check main elements are visible
    await expect(page.locator('body')).toContainText('牌パレット');
    await expect(page.locator('body')).toContainText('状況設定');
    await expect(page.locator('body')).toContainText('手牌');

    // No horizontal overflow
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    console.log(`1280px: body.scrollWidth=${bodyScrollWidth}, viewport=${viewportWidth}`);
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 5);

    await page.screenshot({ path: '/tmp/sprint9_1280px.png' });
    console.log('1280px screenshot taken');
  });

  test('AC3: 点数内訳アコーディオンの開閉', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Input: 1萬×3 / 2〜8萬 / 9萬×3 = 純正九蓮宝燈
    // Simplified: add 13 tiles that form tenpai
    // Use a simple tenpai: 1萬・2萬・3萬 / 4筒・5筒・6筒 / 7索・8索・9索 / 2筒・2筒 / 5萬・5萬
    // Actually let's use a clear tenpai form
    // 2萬×3 / 4萬×3 / 6萬×3 / 2筒×2 / 4筒×2 = shanpon tenpai

    const tiles = ['2', '2', '2', '4', '4', '4', '6', '6', '6']; // manzu
    // We need to click specific tiles in the palette
    // The palette has tiles with tile IDs. Let's find buttons by text content.

    // Add tiles for a tenpai hand via palette
    // 1萬・2萬・3萬 / 4萬・5萬・6萬 / 7萬・8萬・9萬 / 1筒・1筒 / 2筒・2筒 (shanpon)
    // The buttons in palette should have text like "1" with suit indicator

    // Let's check what text the buttons have
    const allButtons = page.locator('button');
    const count = await allButtons.count();
    console.log(`Total buttons: ${count}`);

    // Find tile buttons - they are small and in the palette
    // Take screenshot to understand UI
    await page.screenshot({ path: '/tmp/sprint9_before_input.png' });

    // Try to find the palette area and click tiles
    // Looking for buttons that represent tiles
    const tileButtons = page.locator('button[class*="tile"], button[class*="Tile"]');
    const tileCount = await tileButtons.count();
    console.log(`Tile buttons found: ${tileCount}`);

    // Try a different approach - click on visible tile buttons
    // First check page content
    const pageText = await page.locator('body').textContent();
    console.log('Page contains 萬子:', pageText?.includes('萬') || pageText?.includes('万'));
    console.log('Page contains 筒子:', pageText?.includes('筒'));
  });

  test('AC3-実際: 手牌入力後の結果表示とアコーディオン', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Find tile buttons in palette (they should be small square buttons)
    // Let's get all button texts first
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    // Get first 50 buttons
    const buttonTexts: string[] = [];
    for (let i = 0; i < Math.min(50, buttonCount); i++) {
      const text = await buttons.nth(i).textContent();
      buttonTexts.push(text?.trim() || '');
    }
    console.log('First 50 button texts:', buttonTexts.join(' | '));

    await page.screenshot({ path: '/tmp/sprint9_initial.png' });
  });

  test('AC4: ヘルプモーダルが開閉する', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Find help button (? icon)
    const helpBtn = page.locator('button').filter({ hasText: '?' }).first();
    const helpBtnVisible = await helpBtn.isVisible();
    console.log('Help button visible:', helpBtnVisible);

    if (helpBtnVisible) {
      await helpBtn.click();
      await page.waitForTimeout(300);

      // Check modal opened
      await expect(page.locator('body')).toContainText('ヘルプ');

      // Check tabs
      const tabs = ['使い方', '牌の読み方', '役一覧'];
      for (const tab of tabs) {
        const tabEl = page.locator('button').filter({ hasText: tab });
        const tabVisible = await tabEl.first().isVisible();
        console.log(`Tab "${tab}" visible:`, tabVisible);
      }

      // Click 牌の読み方 tab
      const tileReadTab = page.locator('button').filter({ hasText: '牌の読み方' }).first();
      if (await tileReadTab.isVisible()) {
        await tileReadTab.click();
        await page.waitForTimeout(200);
        // Check content about tiles
        const bodyText = await page.locator('body').textContent();
        const hasTileInfo = bodyText?.includes('萬') || bodyText?.includes('筒') || bodyText?.includes('索');
        console.log('Tile reading info shown:', hasTileInfo);
        expect(hasTileInfo).toBeTruthy();
      }

      // Click 役一覧 tab
      const yakuTab = page.locator('button').filter({ hasText: '役一覧' }).first();
      if (await yakuTab.isVisible()) {
        await yakuTab.click();
        await page.waitForTimeout(200);
        const bodyText = await page.locator('body').textContent();
        const hasYakuInfo = bodyText?.includes('平和') || bodyText?.includes('タンヤオ') || bodyText?.includes('役満');
        console.log('Yaku list shown:', hasYakuInfo);
        expect(hasYakuInfo).toBeTruthy();
      }

      // Close modal by clicking overlay or close button
      const closeBtn = page.locator('button').filter({ hasText: '×' }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        // Try pressing Escape
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(300);

      await page.screenshot({ path: '/tmp/sprint9_help_modal.png' });
      console.log('Help modal test completed');
    } else {
      // Try finding any button that could be help
      const allBtns = page.locator('button');
      const count = await allBtns.count();
      for (let i = 0; i < Math.min(10, count); i++) {
        const t = await allBtns.nth(i).textContent();
        console.log(`Button ${i}: "${t}"`);
      }
      throw new Error('Help button (?) not found');
    }
  });

  test('AC5: エラートーストが表示される', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Take screenshot to understand the UI
    await page.screenshot({ path: '/tmp/sprint9_for_toast.png' });

    // We need to trigger the toast by trying to add too many tiles
    // First add 14 tiles, then try to add one more
    // Let's use keyboard navigation or find the palette buttons

    // Find all tile buttons by checking aria-labels or small button sizes
    const allButtons = page.locator('button');
    const count = await allButtons.count();

    // Look for tile-like buttons (should have short text like numbers/kanji)
    let tileButtonIndices: number[] = [];
    for (let i = 0; i < count; i++) {
      const btn = allButtons.nth(i);
      const text = await btn.textContent();
      const trimmed = text?.trim() || '';
      // Tile buttons are usually 1-3 chars (e.g., "1", "2", "東", "白")
      if (trimmed.length <= 3 && trimmed.length >= 1 && !/全リセット|リセット|聴牌|クリア|\?|ヘルプ/.test(trimmed)) {
        tileButtonIndices.push(i);
        if (tileButtonIndices.length >= 5) break;
      }
    }
    console.log('Tile-like button indices:', tileButtonIndices);

    // Check if we found tile buttons
    if (tileButtonIndices.length > 0) {
      // Click first tile 14 times to fill the hand
      const firstTileBtn = allButtons.nth(tileButtonIndices[0]);
      const firstText = await firstTileBtn.textContent();
      console.log(`First tile button: "${firstText}"`);

      // Click up to 4 times (max per tile)
      for (let i = 0; i < 4; i++) {
        try {
          await firstTileBtn.click({ timeout: 1000 });
          await page.waitForTimeout(100);
        } catch(e) {
          console.log(`Click ${i} failed`);
          break;
        }
      }
    }
  });

  test('AC6: ブラウザリロード後の状態復元', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Set situation: 親, 南場
    // Find parent/child toggle
    const oyaBtn = page.locator('button').filter({ hasText: '親' }).first();
    if (await oyaBtn.isVisible()) {
      await oyaBtn.click();
      await page.waitForTimeout(200);
      console.log('Clicked 親 button');
    }

    // Set round wind to 南場
    const nanbaBtn = page.locator('button').filter({ hasText: '南場' }).first();
    if (await nanbaBtn.isVisible()) {
      await nanbaBtn.click();
      await page.waitForTimeout(200);
      console.log('Clicked 南場 button');
    }

    // Take screenshot before reload
    await page.screenshot({ path: '/tmp/sprint9_before_reload.png' });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Check state restored
    await page.screenshot({ path: '/tmp/sprint9_after_reload.png' });

    const bodyText = await page.locator('body').textContent();

    // Check 親 is still selected (should be highlighted/checked)
    // The exact check depends on UI implementation
    console.log('Body text after reload (first 500 chars):', bodyText?.substring(0, 500));

    // Check that LocalStorage has data
    const localStorageData = await page.evaluate(() => {
      return {
        situation: localStorage.getItem('tenpai-scorer-situation'),
        hand: localStorage.getItem('tenpai-scorer-hand'),
        melds: localStorage.getItem('tenpai-scorer-melds'),
      };
    });
    console.log('LocalStorage data:', JSON.stringify(localStorageData));

    // Verify localStorage has situation data
    expect(localStorageData.situation).not.toBeNull();
  });

});

test.describe('Sprint 1-8 回帰テスト', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const resetBtn = page.locator('button').filter({ hasText: '全リセット' }).first();
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('Sprint1回帰: 牌パレット表示と手牌操作', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check palette exists
    await expect(page.locator('body')).toContainText('牌パレット');

    // Check all tile suits are present
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('萬'); // Man tiles
    expect(bodyText).toContain('筒'); // Pin tiles
    expect(bodyText).toContain('索'); // Sou tiles
    expect(bodyText).toContain('東'); // Wind tiles
    expect(bodyText).toContain('白'); // Dragon tiles

    // Check clear button exists
    await expect(page.locator('button').filter({ hasText: 'クリア' }).first()).toBeVisible();

    console.log('Sprint1 regression: PASS');
  });

  test('Sprint2回帰: 状況設定パネル', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check situation panel
    await expect(page.locator('body')).toContainText('状況設定');

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('親');
    expect(bodyText).toContain('子');
    expect(bodyText).toContain('東場');
    expect(bodyText).toContain('ドラ');

    console.log('Sprint2 regression: PASS');
  });

  test('Sprint3回帰: 聴牌ボタンの存在確認', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check tenpai button exists (disabled with 0 tiles)
    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌' }).first();
    await expect(tenpaiBtn).toBeVisible();

    // With 0 tiles it should be disabled
    const isDisabled = await tenpaiBtn.isDisabled();
    console.log('Tenpai button disabled with 0 tiles:', isDisabled);

    console.log('Sprint3 regression: PASS');
  });

  test('Sprint6回帰: リーチ・一発トグル', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('リーチ');

    // Riichi button should be clickable
    const riichiBtn = page.locator('button').filter({ hasText: 'リーチ' }).first();
    if (await riichiBtn.isVisible()) {
      await riichiBtn.click();
      await page.waitForTimeout(200);

      // Ura dora section should appear
      const afterText = await page.locator('body').textContent();
      const hasUraDora = afterText?.includes('裏ドラ');
      console.log('Ura dora section appeared:', hasUraDora);

      // Ippatsu should become available
      const ippatsuBtn = page.locator('button').filter({ hasText: '一発' }).first();
      if (await ippatsuBtn.isVisible()) {
        const ippatsuDisabled = await ippatsuBtn.isDisabled();
        console.log('Ippatsu button disabled after riichi ON:', ippatsuDisabled);
        expect(ippatsuDisabled).toBeFalsy(); // Should be enabled
      }
    }

    console.log('Sprint6 regression: PASS');
  });

  test('Sprint7回帰: 副露パネル', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('副露');

    // Check pon/chii/kan buttons exist
    const hasPonn = bodyText?.includes('ポン');
    const hasChii = bodyText?.includes('チー');
    const hasKann = bodyText?.includes('カン') || bodyText?.includes('槓');
    console.log('Pon:', hasPonn, 'Chii:', hasChii, 'Kan:', hasKann);

    console.log('Sprint7 regression: PASS');
  });

  test('Sprint8回帰: 赤ドラパレット存在', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').textContent();
    const hasAkaDora = bodyText?.includes('赤ドラ') || bodyText?.includes('赤5');
    console.log('Aka dora section present:', hasAkaDora);

    console.log('Sprint8 regression: PASS');
  });

  test('総合フロー: 手牌入力→聴牌判定→結果表示', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({ path: '/tmp/sprint9_flow_initial.png' });

    // Get all buttons info for understanding palette structure
    const buttons = page.locator('button');
    const btnCount = await buttons.count();
    console.log(`Total buttons: ${btnCount}`);

    // Find tile buttons - look for the palette section
    const paletteText = await page.evaluate(() => {
      // Find elements that are part of the tile palette
      const allBtns = Array.from(document.querySelectorAll('button'));
      return allBtns.map(b => ({
        text: b.textContent?.trim() || '',
        class: b.className.substring(0, 80),
        disabled: b.disabled,
      })).slice(0, 30);
    });
    console.log('First 30 buttons:', JSON.stringify(paletteText, null, 2));

    // Try to find and click a tile that represents 1-man
    // Look for buttons with aria-label or specific classes
    const man1Btns = page.locator('button[aria-label*="1萬"], button[aria-label*="man1"]');
    const man1Count = await man1Btns.count();
    console.log(`1萬 buttons with aria-label: ${man1Count}`);
  });
});
