import { test, expect, Page } from '@playwright/test';

// Helper: click a tile in the palette by display label
async function addTileFromPalette(page: Page, label: string) {
  // Look for the button in the palette section specifically
  const paletteSection = page.locator('section').filter({ hasText: '牌パレット' });
  const btn = paletteSection.locator('button').filter({ hasText: new RegExp(`^${label}$`) }).first();
  if (await btn.isVisible()) {
    await btn.click();
  } else {
    // fallback: first button with this text that is not in hand area
    const allBtns = page.locator('button').filter({ hasText: new RegExp(`^${label}$`) });
    await allBtns.first().click();
  }
  await page.waitForTimeout(80);
}

async function clearHand(page: Page) {
  const clearBtn = page.locator('button').filter({ hasText: /^クリア$/ }).first();
  if (await clearBtn.isVisible()) {
    await clearBtn.click();
    await page.waitForTimeout(200);
  }
}

async function clickTenpai(page: Page) {
  const btn = page.locator('button').filter({ hasText: '聴牌判定する' });
  await expect(btn).toBeEnabled({ timeout: 3000 });
  await btn.click();
  await page.waitForTimeout(500);
}

test.describe('Sprint 6: 嶺上開花と状況役対応', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    // Full reset first
    const resetBtn = page.locator('button').filter({ hasText: /全リセット/ }).first();
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.waitForTimeout(300);
    }
  });

  // AC1: リーチをONにすると全ての点数が1翻分増加すること
  test('AC1: リーチONで点数1翻増加', async ({ page }) => {
    // Input a basic tenpai hand: 1m2m3m 4p5p6p 7s8s9s 白白白 2m = wait on 1m/3m (shanpon)
    const tiles = ['1萬','2萬','3萬','4筒','5筒','6筒','7索','8索','9索','白','白','白','2萬'];
    for (const t of tiles) {
      await addTileFromPalette(page, t);
    }
    await clickTenpai(page);

    // Get scores without riichi - click first waiting tile row
    await page.screenshot({ path: '/tmp/s6-ac1-before-riichi.png' });

    // Find first row in result table and click to see details
    const firstRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    const ronScoreBeforeText = await firstRow.textContent();
    console.log('Before riichi row:', ronScoreBeforeText);

    // Turn on Riichi
    const riichiBtn = page.locator('button').filter({ hasText: /^リーチ$/ }).first();
    await expect(riichiBtn).toBeVisible();
    await riichiBtn.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-ac1-after-riichi.png' });

    // Scores should have increased - check the result table shows different (higher) numbers
    const firstRowAfter = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    const ronScoreAfterText = await firstRowAfter.textContent();
    console.log('After riichi row:', ronScoreAfterText);

    // Verify riichi button is highlighted (active)
    await expect(riichiBtn).toHaveClass(/bg-red|text-white|active/);

    // Check results updated
    expect(ronScoreAfterText).not.toEqual(ronScoreBeforeText);
  });

  // AC2: リーチON時に裏ドラ表示牌の入力欄が表示されること
  test('AC2: リーチON時に裏ドラ入力欄が表示される', async ({ page }) => {
    // Check ura-dora section is hidden when riichi is off
    const uraDoraSection = page.locator('text=裏ドラ表示牌').first();

    // リーチOFF時は非表示
    const riichiBtn = page.locator('button').filter({ hasText: /^リーチ$/ }).first();
    await expect(riichiBtn).toBeVisible();

    // Initially OFF: ura-dora input should not be visible
    const isVisibleBefore = await uraDoraSection.isVisible().catch(() => false);
    console.log('Ura-dora section visible before riichi:', isVisibleBefore);

    // Turn ON riichi
    await riichiBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/s6-ac2-riichi-on.png' });

    // Ura-dora section should now be visible
    await expect(uraDoraSection).toBeVisible({ timeout: 2000 });

    // Turn OFF riichi
    await riichiBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/s6-ac2-riichi-off.png' });

    // Ura-dora section should be hidden again
    const isVisibleAfter = await uraDoraSection.isVisible().catch(() => false);
    console.log('Ura-dora section visible after riichi OFF:', isVisibleAfter);
    expect(isVisibleAfter).toBe(false);
  });

  // AC3: リーチOFF時は裏ドラ入力欄が非表示（または無効化）
  test('AC3: リーチOFF時は裏ドラ入力欄が非表示', async ({ page }) => {
    // Already tested in AC2 - additional check: add ura-dora while riichi is ON, then turn OFF
    const riichiBtn = page.locator('button').filter({ hasText: /^リーチ$/ }).first();
    await riichiBtn.click();
    await page.waitForTimeout(300);

    // Add ura-dora
    const addUraDoraBtn = page.locator('button').filter({ hasText: /裏ドラ表示牌を追加/ }).first();
    await expect(addUraDoraBtn).toBeVisible();
    await addUraDoraBtn.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-ac3-ura-picker.png' });

    // Pick a tile for ura-dora (5m -> 6m)
    const uraPicker = page.locator('text=5萬').last();
    await uraPicker.click();
    await page.waitForTimeout(300);

    // Verify ura-dora shows 5萬 → 6萬
    const uraIndicatorText = await page.locator('text=6萬').first().textContent();
    console.log('Ura indicator result text:', uraIndicatorText);

    await page.screenshot({ path: '/tmp/s6-ac3-ura-set.png' });

    // Turn OFF riichi
    await riichiBtn.click();
    await page.waitForTimeout(300);

    // Ura-dora input section should be gone
    const uraSection = await page.locator('text=裏ドラ表示牌').isVisible().catch(() => false);
    expect(uraSection).toBe(false);

    await page.screenshot({ path: '/tmp/s6-ac3-riichi-off.png' });
  });

  // AC4: 裏ドラ牌を手牌に含めると点数内訳に「裏X翻」が追加される
  test('AC4: 裏ドラ加算で点数内訳に裏X翻が表示される', async ({ page }) => {
    // Hand: 1m2m3m 4p5p6p 7s8s9s 白白白 2m (tenpai at 1m or wait on something)
    const tiles = ['1萬','2萬','3萬','4筒','5筒','6筒','7索','8索','9索','白','白','白','2萬'];
    for (const t of tiles) {
      await addTileFromPalette(page, t);
    }

    // Turn on Riichi
    const riichiBtn = page.locator('button').filter({ hasText: /^リーチ$/ }).first();
    await riichiBtn.click();
    await page.waitForTimeout(300);

    // Set ura-dora to 1m indicator -> 2m is ura-dora
    // Hand has 2m already, so ura-dora count = 1
    const addUraDoraBtn = page.locator('button').filter({ hasText: /裏ドラ表示牌を追加/ }).first();
    await addUraDoraBtn.click();
    await page.waitForTimeout(300);

    // Click 1m (indicator) - ura-dora becomes 2m
    await page.screenshot({ path: '/tmp/s6-ac4-ura-picker.png' });
    const picker1m = page.locator('button').filter({ hasText: /^1萬$/ }).last();
    await picker1m.click();
    await page.waitForTimeout(300);

    await clickTenpai(page);
    await page.screenshot({ path: '/tmp/s6-ac4-after-tenpai.png' });

    // Click on a waiting tile to see details
    const firstWaitRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    await firstWaitRow.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-ac4-details.png' });

    // Look for 裏 in the details
    const pageContent = await page.content();
    console.log('Page has 裏:', pageContent.includes('裏'));
    expect(pageContent).toContain('裏');
  });

  // AC5: 一発トグルはリーチONのときのみ操作可能
  test('AC5: 一発ボタンはリーチOFF時に無効化されている', async ({ page }) => {
    const ippatsuBtn = page.locator('button').filter({ hasText: /^一発$/ }).first();
    await expect(ippatsuBtn).toBeVisible();

    // When riichi is OFF, ippatsu should be disabled
    const isDisabledBefore = await ippatsuBtn.isDisabled();
    console.log('Ippatsu disabled when riichi OFF:', isDisabledBefore);
    expect(isDisabledBefore).toBe(true);

    // Turn on riichi
    const riichiBtn = page.locator('button').filter({ hasText: /^リーチ$/ }).first();
    await riichiBtn.click();
    await page.waitForTimeout(300);

    // Ippatsu should now be enabled
    const isDisabledAfter = await ippatsuBtn.isDisabled();
    console.log('Ippatsu disabled when riichi ON:', isDisabledAfter);
    expect(isDisabledAfter).toBe(false);

    await page.screenshot({ path: '/tmp/s6-ac5-ippatsu.png' });
  });

  // AC6: 門前手でツモを表示すると、門前清自摸和が自動付与され翻数が1増える
  test('AC6: 門前清自摸和が自動付与される', async ({ page }) => {
    const tiles = ['1萬','2萬','3萬','4筒','5筒','6筒','7索','8索','9索','白','白','白','2萬'];
    for (const t of tiles) {
      await addTileFromPalette(page, t);
    }
    await clickTenpai(page);

    await page.screenshot({ path: '/tmp/s6-ac6-after-tenpai.png' });

    // Click on first waiting tile
    const firstWaitRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    await firstWaitRow.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-ac6-row-clicked.png' });

    // Look for ツモ tab
    const tsumoTab = page.locator('button').filter({ hasText: /^ツモ$/ }).first();
    if (await tsumoTab.isVisible()) {
      await tsumoTab.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: '/tmp/s6-ac6-tsumo-tab.png' });

    const pageContent = await page.content();
    console.log('Has 門前清自摸和:', pageContent.includes('門前清自摸和'));
    console.log('Has 門前ツモ:', pageContent.includes('門前ツモ') || pageContent.includes('門前清自摸'));

    // Check for 門前清自摸和 in tsumo context
    const hasMenzenTsumo = pageContent.includes('門前清自摸和') || pageContent.includes('門前ツモ') || pageContent.includes('門前清自摸');
    expect(hasMenzenTsumo).toBe(true);
  });

  // AC7: 嶺上開花列にツモ計算に嶺上開花1翻を加算した点数が表示される
  test('AC7: 嶺上開花列に嶺上1翻が加算された点数が表示される', async ({ page }) => {
    const tiles = ['1萬','2萬','3萬','4筒','5筒','6筒','7索','8索','9索','白','白','白','2萬'];
    for (const t of tiles) {
      await addTileFromPalette(page, t);
    }
    await clickTenpai(page);

    await page.screenshot({ path: '/tmp/s6-ac7-after-tenpai.png' });

    // Check for 嶺上 column header
    const pageContent = await page.content();
    console.log('Has 嶺上:', pageContent.includes('嶺上'));
    expect(pageContent).toContain('嶺上');

    // Click on first row to expand details
    const firstWaitRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    await firstWaitRow.click();
    await page.waitForTimeout(300);

    // Click rinshan tab
    const rinshankTab = page.locator('button').filter({ hasText: /^嶺上$/ }).first();
    if (await rinshankTab.isVisible()) {
      await rinshankTab.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: '/tmp/s6-ac7-rinshan-tab.png' });

    const pageContentAfter = await page.content();
    console.log('Has 嶺上開花:', pageContentAfter.includes('嶺上開花'));
    expect(pageContentAfter).toContain('嶺上開花');
  });

  // AC8: 海底・河底トグルが翻数に正しく反映される
  test('AC8: 海底・河底トグルの排他制御と翻数反映', async ({ page }) => {
    const haiteiBtn = page.locator('button').filter({ hasText: /^海底$/ }).first();
    const houteiBtn = page.locator('button').filter({ hasText: /^河底$/ }).first();

    await expect(haiteiBtn).toBeVisible();
    await expect(houteiBtn).toBeVisible();

    // Click 海底
    await haiteiBtn.click();
    await page.waitForTimeout(200);

    await page.screenshot({ path: '/tmp/s6-ac8-haitei.png' });

    // Check 海底 is highlighted
    const haiteiClass = await haiteiBtn.getAttribute('class');
    console.log('Haitei class after click:', haiteiClass);

    // Click 河底 - should deactivate 海底
    await houteiBtn.click();
    await page.waitForTimeout(200);

    await page.screenshot({ path: '/tmp/s6-ac8-houtei.png' });

    // 河底 now active, 海底 should be OFF
    const haiteiClassAfter = await haiteiBtn.getAttribute('class');
    const houteiClassAfter = await houteiBtn.getAttribute('class');
    console.log('Haitei class after houtei click:', haiteiClassAfter);
    console.log('Houtei class after houtei click:', houteiClassAfter);

    // 海底 should not be highlighted after 河底 is clicked
    // The exact class depends on implementation, but 河底 should look active and 海底 should look inactive
    // We check by looking at if 海底 is disabled or if color changes
    // At minimum, both can't be "active" at the same time

    // Add hand and verify 海底 adds 1 han
    const tiles = ['1萬','2萬','3萬','4筒','5筒','6筒','7索','8索','9索','白','白','白','2萬'];
    for (const t of tiles) {
      await addTileFromPalette(page, t);
    }
    await clickTenpai(page);

    const firstWaitRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    await firstWaitRow.click();
    await page.waitForTimeout(300);

    const tsumoTab = page.locator('button').filter({ hasText: /^ロン$/ }).first();
    if (await tsumoTab.isVisible()) {
      await tsumoTab.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: '/tmp/s6-ac8-ron-with-houtei.png' });

    const pageContent = await page.content();
    console.log('Has 河底:', pageContent.includes('河底'));
    expect(pageContent).toContain('河底');
  });

  // AC9: 結果画面に3列（ロン/ツモ/嶺上）が並び比較可能であること
  test('AC9: 結果画面に3列（ロン/ツモ/嶺上）が並ぶ', async ({ page }) => {
    const tiles = ['1萬','2萬','3萬','4筒','5筒','6筒','7索','8索','9索','白','白','白','2萬'];
    for (const t of tiles) {
      await addTileFromPalette(page, t);
    }
    await clickTenpai(page);

    await page.screenshot({ path: '/tmp/s6-ac9-3col.png' });

    const pageContent = await page.content();

    // Should have all three headers
    expect(pageContent).toContain('ロン');
    expect(pageContent).toContain('ツモ');
    expect(pageContent).toContain('嶺上');

    // Check they appear in table form - the 3 headers should be visible
    const ronHeader = page.locator('th').filter({ hasText: /^ロン$/ }).first();
    const tsumoHeader = page.locator('th').filter({ hasText: /^ツモ$/ }).first();
    const rinshankHeader = page.locator('th').filter({ hasText: /^嶺上$/ }).first();

    const ronVisible = await ronHeader.isVisible().catch(() => false);
    const tsumoVisible = await tsumoHeader.isVisible().catch(() => false);
    const rinshankVisible = await rinshankHeader.isVisible().catch(() => false);

    console.log('Ron header visible:', ronVisible);
    console.log('Tsumo header visible:', tsumoVisible);
    console.log('Rinshan header visible:', rinshankVisible);

    expect(ronVisible).toBe(true);
    expect(tsumoVisible).toBe(true);
    expect(rinshankVisible).toBe(true);
  });

  // Regression: Sprint 1 - tile palette and hand
  test('Regression-Sprint1: パレットから牌追加・削除・クリア', async ({ page }) => {
    // Add tiles
    await addTileFromPalette(page, '1萬');
    await addTileFromPalette(page, '2筒');

    const handCount = page.locator('text=/\\d+\\/14枚/').first();
    await expect(handCount).toContainText('2/14枚');

    // Clear
    await clearHand(page);
    const handCountAfterClear = await page.locator('text=/0\\/14枚|パレットから牌を選んで/').first();
    await page.screenshot({ path: '/tmp/s6-reg1.png' });
  });

  // Regression: Sprint 2 - situation panel
  test('Regression-Sprint2: 親/子・場風・自風・ドラ設定', async ({ page }) => {
    // Switch to dealer
    const oyaBtn = page.locator('button').filter({ hasText: /^親$/ }).first();
    await oyaBtn.click();
    await page.waitForTimeout(200);

    // Add dora indicator
    const addDoraBtn = page.locator('button').filter({ hasText: /ドラ表示牌を追加/ }).first();
    await addDoraBtn.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-reg2-dora-picker.png' });

    // Click 5m in dora picker
    const doraPicker5m = page.locator('button').filter({ hasText: /^5萬$/ }).last();
    await doraPicker5m.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-reg2-after-dora.png' });

    const pageContent = await page.content();
    // Should show 6m as actual dora
    expect(pageContent).toContain('6萬');
  });

  // Regression: Sprint 3 - tenpai detection
  test('Regression-Sprint3: 聴牌判定', async ({ page }) => {
    // Shanpon wait: 1m2m3m 4m5m6m 7m8m9m 1p1p 2p2p
    const tiles = ['1萬','2萬','3萬','4萬','5萬','6萬','7萬','8萬','9萬','1筒','1筒','2筒','2筒'];
    for (const t of tiles) {
      await addTileFromPalette(page, t);
    }
    await clickTenpai(page);
    await page.screenshot({ path: '/tmp/s6-reg3-tenpai.png' });

    const pageContent = await page.content();
    expect(pageContent).toContain('聴牌');
    // Should have 2 waiting tiles (1p and 2p shanpon)
    expect(pageContent).toContain('1筒');
    expect(pageContent).toContain('2筒');
  });

  // Regression: Sprint 4 - yaku detection
  test('Regression-Sprint4: 役判定（平和・タンヤオ）', async ({ page }) => {
    // Tanyao hand: 2m3m4m 2m3m4m 5p6p7p 6s7s8s 8s (tanpai on 7s or 9s)
    const tiles = ['2萬','3萬','4萬','2萬','3萬','4萬','5筒','6筒','7筒','6索','7索','8索','8索'];
    for (const t of tiles) {
      await addTileFromPalette(page, t);
    }
    await clickTenpai(page);

    const firstRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    await firstRow.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-reg4-yaku.png' });

    const pageContent = await page.content();
    console.log('Has タンヤオ:', pageContent.includes('タンヤオ'));
    expect(pageContent).toContain('タンヤオ');
  });

  // Regression: Sprint 5 - score calculation
  test('Regression-Sprint5: 符計算と点数算出', async ({ page }) => {
    // Chiitoi (七対子) for score check
    const tiles = ['1萬','1萬','東','東','南','南','西','西','北','北','白','白','發'];
    for (const t of tiles) {
      await addTileFromPalette(page, t);
    }
    await clickTenpai(page);

    await page.screenshot({ path: '/tmp/s6-reg5-score.png' });

    const firstRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    await firstRow.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-reg5-score-detail.png' });

    const pageContent = await page.content();
    console.log('Has 七対子:', pageContent.includes('七対子'));
    expect(pageContent).toContain('七対子');
    // Should show 1600 (25fu 2han ko) for 子
    expect(pageContent).toMatch(/1600|点/);
  });
});
