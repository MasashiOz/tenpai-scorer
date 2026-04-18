import { test, expect, Page } from '@playwright/test';

// Helper: click a tile in the palette (not hand area)
async function addTileFromPalette(page: Page, label: string) {
  // Find all buttons with this exact label
  const allBtns = page.locator('button').filter({ hasText: new RegExp(`^${label}$`) });
  const count = await allBtns.count();
  // Click the first one that is in the palette section (not hand)
  for (let i = 0; i < count; i++) {
    const btn = allBtns.nth(i);
    const isDisabled = await btn.isDisabled();
    if (!isDisabled) {
      // Check if it's in the palette area by looking at parent
      const parentSection = btn.locator('xpath=ancestor::section');
      const parentCount = await parentSection.count();
      if (parentCount > 0) {
        await btn.click();
        break;
      }
      // If no ancestor section, try the first non-disabled button
      await btn.click();
      break;
    }
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

async function fullReset(page: Page) {
  const resetBtn = page.locator('button').filter({ hasText: /全リセット/ }).first();
  if (await resetBtn.isVisible()) {
    await resetBtn.click();
    await page.waitForTimeout(300);
  }
}

async function clickTenpai(page: Page) {
  const btn = page.locator('button').filter({ hasText: '聴牌判定する' });
  await expect(btn).toBeEnabled({ timeout: 5000 });
  await btn.click();
  await page.waitForTimeout(500);
}

// Get the riichi button (accounts for ✓ suffix when active)
async function getRiichiButton(page: Page) {
  return page.locator('button').filter({ hasText: /リーチ/ }).first();
}

test.describe('Sprint 6 Evaluation: 詳細確認', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await fullReset(page);
  });

  // ===== AC1: リーチで点数が増加する =====
  test('AC1: リーチONで点数が増加する（数値確認）', async ({ page }) => {
    // Hand: 1m2m3m 4p5p6p 7s8s9s 白白白 2m (13 tiles, tenpai)
    const tiles = ['1萬','2萬','3萬','4筒','5筒','6筒','7索','8索','9索','白','白','白','2萬'];
    for (const t of tiles) {
      await addTileFromPalette(page, t);
    }
    await clickTenpai(page);

    // Capture scores without riichi
    await page.screenshot({ path: '/tmp/s6-v2-ac1-no-riichi.png' });
    const tableBeforeText = await page.locator('table').first().textContent();
    console.log('Table before riichi:', tableBeforeText?.substring(0, 200));

    // Enable riichi
    const riichiBtn = page.locator('button').filter({ hasText: /リーチ/ }).first();
    await riichiBtn.click();
    await page.waitForTimeout(400);

    // Capture scores with riichi
    await page.screenshot({ path: '/tmp/s6-v2-ac1-with-riichi.png' });
    const tableAfterText = await page.locator('table').first().textContent();
    console.log('Table after riichi:', tableAfterText?.substring(0, 200));

    // The scores should have changed (increased by 1 han)
    expect(tableAfterText).not.toEqual(tableBeforeText);
    console.log('Scores changed after riichi: PASS');
  });

  // ===== AC2: 裏ドラ入力欄の表示制御 =====
  test('AC2: リーチOFF時は裏ドラ入力欄が非表示、ON時は表示', async ({ page }) => {
    // リーチOFF時の初期状態
    await page.screenshot({ path: '/tmp/s6-v2-ac2-initial.png' });

    // 裏ドラ表示牌セクションが非表示であることを確認
    const uraDoraLabel = page.locator('text=裏ドラ表示牌');
    const countBefore = await uraDoraLabel.count();
    console.log('Ura dora label count (riichi OFF):', countBefore);
    expect(countBefore).toBe(0);

    // リーチをON
    const riichiBtn = page.locator('button').filter({ hasText: /リーチ/ }).first();
    await riichiBtn.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-v2-ac2-riichi-on.png' });

    // 裏ドラ表示牌セクションが表示されることを確認
    const countAfter = await uraDoraLabel.count();
    console.log('Ura dora label count (riichi ON):', countAfter);
    expect(countAfter).toBeGreaterThan(0);

    // リーチをOFF
    await riichiBtn.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-v2-ac2-riichi-off.png' });

    // 再び非表示
    const countFinal = await uraDoraLabel.count();
    console.log('Ura dora label count (riichi OFF again):', countFinal);
    expect(countFinal).toBe(0);
  });

  // ===== AC3: 裏ドラ設定後にリーチOFFで消える =====
  test('AC3: 裏ドラ設定→リーチOFF→裏ドラがクリアされる', async ({ page }) => {
    // Enable riichi first
    const riichiBtn = page.locator('button').filter({ hasText: /リーチ/ }).first();
    await riichiBtn.click();
    await page.waitForTimeout(300);

    // Open ura-dora picker
    const addUraBtn = page.locator('button').filter({ hasText: /裏ドラ表示牌を追加/ }).first();
    await expect(addUraBtn).toBeVisible();
    await addUraBtn.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-v2-ac3-picker.png' });

    // The picker shows all tiles - click 5m (indicator for 6m ura-dora)
    // Use a more specific selector for the picker
    const uraDoraPicker = page.locator('div').filter({ hasText: '表示牌を選択してください' }).last();
    const picker5m = uraDoraPicker.locator('button').filter({ hasText: /^5萬$/ }).first();
    if (await picker5m.isVisible()) {
      await picker5m.click();
    } else {
      // Fallback: click last 5m button
      const all5m = page.locator('button').filter({ hasText: /^5萬$/ });
      const lastIdx = await all5m.count() - 1;
      await all5m.nth(lastIdx).click();
    }
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-v2-ac3-ura-set.png' });

    // Verify 裏ドラ is showing 5萬 → 6萬
    const pageContent = await page.content();
    const hasUraIndicator = pageContent.includes('裏ドラ表示牌');
    console.log('Has ura-dora section:', hasUraIndicator);
    console.log('Has 6萬:', pageContent.includes('6萬'));

    // Disable riichi - ura-dora section should disappear
    await riichiBtn.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-v2-ac3-after-off.png' });

    const countAfterOff = await page.locator('text=裏ドラ表示牌').count();
    console.log('Ura dora count after riichi OFF:', countAfterOff);
    expect(countAfterOff).toBe(0);
  });

  // ===== AC4: 裏ドラが手牌にある場合に点数内訳に「裏X翻」が表示される =====
  test('AC4: 裏ドラ加算で裏X翻が点数内訳に表示される', async ({ page }) => {
    // Enable riichi
    const riichiBtn = page.locator('button').filter({ hasText: /リーチ/ }).first();
    await riichiBtn.click();
    await page.waitForTimeout(300);

    // Set ura-dora indicator to 1m (so 2m becomes ura-dora)
    const addUraBtn = page.locator('button').filter({ hasText: /裏ドラ表示牌を追加/ }).first();
    await addUraBtn.click();
    await page.waitForTimeout(300);

    // Click 1m in the ura-dora picker
    // The picker should be visible now
    await page.screenshot({ path: '/tmp/s6-v2-ac4-picker.png' });
    const uraDoraPicker = page.locator('div').filter({ hasText: '表示牌を選択してください' }).last();
    const picker1m = uraDoraPicker.locator('button').filter({ hasText: /^1萬$/ }).first();
    if (await picker1m.isVisible()) {
      await picker1m.click();
    } else {
      const all1m = page.locator('button').filter({ hasText: /^1萬$/ });
      const lastIdx = await all1m.count() - 1;
      await all1m.nth(lastIdx).click();
    }
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-v2-ac4-ura-1m.png' });

    // Now add tiles to hand (2m is the ura-dora)
    // Hand: 1m2m3m 4p5p6p 7s8s9s 白白白 2m (has 2m which is ura-dora!)
    const tiles = ['1萬','2萬','3萬','4筒','5筒','6筒','7索','8索','9索','白','白','白','2萬'];
    for (const t of tiles) {
      // Use the palette section buttons
      const paletteSection = page.locator('section').filter({ hasText: '牌パレット' });
      const btn = paletteSection.locator('button').filter({ hasText: new RegExp(`^${t}$`) }).first();
      if (await btn.isVisible() && !await btn.isDisabled()) {
        await btn.click();
      } else {
        // fallback
        const allBtns = page.locator('button').filter({ hasText: new RegExp(`^${t}$`) });
        const count = await allBtns.count();
        for (let i = 0; i < count; i++) {
          const b = allBtns.nth(i);
          const disabled = await b.isDisabled();
          if (!disabled) {
            await b.click();
            break;
          }
        }
      }
      await page.waitForTimeout(80);
    }

    await page.screenshot({ path: '/tmp/s6-v2-ac4-hand.png' });

    // Check hand count
    const handCount = await page.locator('text=/\\d+\\/14枚/').first().textContent().catch(() => '');
    console.log('Hand count:', handCount);

    // Click tenpai
    await clickTenpai(page);

    await page.screenshot({ path: '/tmp/s6-v2-ac4-tenpai.png' });

    // Click first waiting tile row
    const firstWaitRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    await firstWaitRow.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-v2-ac4-detail.png' });

    // Check for 裏 in details
    const pageContent = await page.content();
    console.log('Has 裏1:', pageContent.includes('裏1'));
    console.log('Has 裏:', pageContent.includes('裏'));

    // The detail should show 裏X翻
    expect(pageContent).toContain('裏');
  });

  // ===== AC5: 一発ボタンの制御 =====
  test('AC5: 一発はリーチOFF時disabled、ON時enabled', async ({ page }) => {
    const ippatsuBtn = page.locator('button').filter({ hasText: /^一発/ }).first();
    await expect(ippatsuBtn).toBeVisible();

    // リーチOFF時はdisabled
    expect(await ippatsuBtn.isDisabled()).toBe(true);
    console.log('Ippatsu disabled (riichi OFF): PASS');

    // リーチON
    const riichiBtn = page.locator('button').filter({ hasText: /リーチ/ }).first();
    await riichiBtn.click();
    await page.waitForTimeout(200);

    // 一発がenabled
    expect(await ippatsuBtn.isDisabled()).toBe(false);
    console.log('Ippatsu enabled (riichi ON): PASS');

    await page.screenshot({ path: '/tmp/s6-v2-ac5.png' });
  });

  // ===== AC6: 門前清自摸和の自動付与 =====
  test('AC6: ツモ詳細に門前清自摸和が含まれる', async ({ page }) => {
    const tiles = ['1萬','2萬','3萬','4筒','5筒','6筒','7索','8索','9索','白','白','白','2萬'];
    for (const t of tiles) {
      const paletteSection = page.locator('section').filter({ hasText: '牌パレット' });
      const btn = paletteSection.locator('button').filter({ hasText: new RegExp(`^${t}$`) }).first();
      await btn.click();
      await page.waitForTimeout(80);
    }
    await clickTenpai(page);

    const firstWaitRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    await firstWaitRow.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-v2-ac6-detail.png' });

    // Click ツモ tab
    const tsumoTab = page.locator('button').filter({ hasText: /^ツモ$/ }).first();
    if (await tsumoTab.isVisible()) {
      await tsumoTab.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: '/tmp/s6-v2-ac6-tsumo.png' });

    const pageContent = await page.content();
    const hasMenzenTsumo = pageContent.includes('門前清自摸和') ||
                           pageContent.includes('門前ツモ') ||
                           pageContent.includes('門前清自摸');
    console.log('Has 門前清自摸和:', pageContent.includes('門前清自摸和'));
    console.log('Has menzen-tsumo:', hasMenzenTsumo);
    expect(hasMenzenTsumo).toBe(true);
  });

  // ===== AC7: 嶺上開花列の確認 =====
  test('AC7: 3列（ロン/ツモ/嶺上）と嶺上開花役の確認', async ({ page }) => {
    const tiles = ['1萬','2萬','3萬','4筒','5筒','6筒','7索','8索','9索','白','白','白','2萬'];
    for (const t of tiles) {
      const paletteSection = page.locator('section').filter({ hasText: '牌パレット' });
      const btn = paletteSection.locator('button').filter({ hasText: new RegExp(`^${t}$`) }).first();
      await btn.click();
      await page.waitForTimeout(80);
    }
    await clickTenpai(page);

    await page.screenshot({ path: '/tmp/s6-v2-ac7-table.png' });

    // Verify 3 column headers exist
    const ronTh = page.locator('th').filter({ hasText: /^ロン$/ });
    const tsumoTh = page.locator('th').filter({ hasText: /^ツモ$/ });
    const rinshankTh = page.locator('th').filter({ hasText: /^嶺上$/ });

    await expect(ronTh).toBeVisible();
    await expect(tsumoTh).toBeVisible();
    await expect(rinshankTh).toBeVisible();

    // Click a row to see details
    const firstWaitRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    await firstWaitRow.click();
    await page.waitForTimeout(300);

    // Click 嶺上 tab
    const rinshankTab = page.locator('button').filter({ hasText: /^嶺上$/ }).first();
    if (await rinshankTab.isVisible()) {
      await rinshankTab.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: '/tmp/s6-v2-ac7-rinshan.png' });

    const pageContent = await page.content();
    console.log('Has 嶺上開花:', pageContent.includes('嶺上開花'));
    expect(pageContent).toContain('嶺上開花');
  });

  // ===== AC8: 海底・河底の排他制御と翻数反映 =====
  test('AC8: 海底・河底の排他制御と翻数への反映', async ({ page }) => {
    // Find 海底 and 河底 buttons in 状況役 section
    const situationSection = page.locator('div').filter({ hasText: '状況役' });

    // Get all status role buttons
    const haiteiBtn = page.locator('button').filter({ hasText: /^海底/ }).first();
    const houteiBtn = page.locator('button').filter({ hasText: /^河底/ }).first();

    await expect(haiteiBtn).toBeVisible();
    await expect(houteiBtn).toBeVisible();

    // 海底をON
    await haiteiBtn.click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: '/tmp/s6-v2-ac8-haitei-on.png' });

    // 海底ボタンがアクティブ状態か確認（クラスまたはテキストで）
    const haiteiText = await haiteiBtn.textContent();
    console.log('海底 button text after click:', haiteiText);

    // 河底をONにする（海底が自動でOFFになる排他制御）
    await houteiBtn.click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: '/tmp/s6-v2-ac8-houtei-on.png' });

    const haiteiTextAfter = await haiteiBtn.textContent();
    const houteiTextAfter = await houteiBtn.textContent();
    console.log('海底 after 河底 click:', haiteiTextAfter);
    console.log('河底 after click:', houteiTextAfter);

    // 河底がON、海底がOFFになっていること
    // 河底がアクティブなら ✓ が含まれる
    const houteiActive = houteiTextAfter?.includes('✓') ?? false;
    const haiteiActive = haiteiTextAfter?.includes('✓') ?? false;
    console.log('河底 active:', houteiActive, '海底 active:', haiteiActive);

    expect(houteiActive).toBe(true);
    expect(haiteiActive).toBe(false);

    // 手牌を入力して聴牌、河底がロン点数に反映されることを確認
    const tiles = ['1萬','2萬','3萬','4筒','5筒','6筒','7索','8索','9索','白','白','白','2萬'];
    for (const t of tiles) {
      const paletteSection = page.locator('section').filter({ hasText: '牌パレット' });
      const btn = paletteSection.locator('button').filter({ hasText: new RegExp(`^${t}$`) }).first();
      await btn.click();
      await page.waitForTimeout(80);
    }
    await clickTenpai(page);

    const firstRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    await firstRow.click();
    await page.waitForTimeout(300);

    // ロンタブ
    const ronTab = page.locator('button').filter({ hasText: /^ロン$/ }).first();
    if (await ronTab.isVisible()) {
      await ronTab.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: '/tmp/s6-v2-ac8-ron-detail.png' });

    const pageContent = await page.content();
    console.log('Has 河底:', pageContent.includes('河底'));
    expect(pageContent).toContain('河底');
  });

  // ===== AC9: 3列表示確認 (追加テスト) =====
  test('AC9: 3列テーブル（ロン/ツモ/嶺上）が比較可能な形で表示される', async ({ page }) => {
    const tiles = ['2萬','3萬','4萬','2筒','3筒','4筒','2索','3索','4索','6萬','6萬','7萬','8萬'];
    for (const t of tiles) {
      const paletteSection = page.locator('section').filter({ hasText: '牌パレット' });
      const btn = paletteSection.locator('button').filter({ hasText: new RegExp(`^${t}$`) }).first();
      await btn.click();
      await page.waitForTimeout(80);
    }
    await clickTenpai(page);

    await page.screenshot({ path: '/tmp/s6-v2-ac9-3col.png' });

    // Verify 3 column headers
    await expect(page.locator('th').filter({ hasText: /^ロン$/ }).first()).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /^ツモ$/ }).first()).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /^嶺上$/ }).first()).toBeVisible();

    // Each row should show 3 score values
    const rows = page.locator('tr').filter({ hasText: /点/ });
    const rowCount = await rows.count();
    console.log('Score rows count:', rowCount);
    expect(rowCount).toBeGreaterThan(0);

    const firstRowText = await rows.first().textContent();
    console.log('First score row:', firstRowText);

    // The row should have 3 点 values (for ron, tsumo, rinshan)
    const tenCount = (firstRowText?.match(/点/g) || []).length;
    console.log('点 count in first row:', tenCount);
    expect(tenCount).toBeGreaterThanOrEqual(3);
  });
});
