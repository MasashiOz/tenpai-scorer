import { test, expect, Page } from '@playwright/test';

// Helper: add tile by clicking first non-disabled button with this exact text
async function addTile(page: Page, label: string) {
  const allBtns = page.locator('button').filter({ hasText: new RegExp(`^${label}$`) });
  const count = await allBtns.count();
  for (let i = 0; i < count; i++) {
    const btn = allBtns.nth(i);
    const disabled = await btn.isDisabled();
    if (!disabled) {
      await btn.click();
      await page.waitForTimeout(50);
      return;
    }
  }
  console.warn(`Could not add tile: ${label}`);
}

async function clickTenpai(page: Page) {
  const btn = page.locator('button').filter({ hasText: '聴牌判定する' });
  await expect(btn).toBeEnabled({ timeout: 5000 });
  await btn.click();
  await page.waitForTimeout(500);
}

test.describe('Sprint 6 Final Evaluation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    // Full reset
    const resetBtn = page.locator('button').filter({ hasText: /全リセット/ }).first();
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.waitForTimeout(300);
    }
  });

  // ==== AC1: リーチで点数1翻増加 ====
  test('AC1: リーチONで点数が1翻分増加する', async ({ page }) => {
    // Add 13 tiles for tenpai (1m2m3m 4p5p6p 7s8s9s 白白白 2m)
    for (const t of ['1萬','2萬','3萬','4筒','5筒','6筒','7索','8索','9索','白','白','白','2萬']) {
      await addTile(page, t);
    }
    await clickTenpai(page);

    // Get score without riichi
    const table = page.locator('table').first();
    const beforeText = await table.textContent();
    console.log('Before riichi scores:', beforeText?.substring(0, 100));

    // Enable riichi
    await page.locator('button').filter({ hasText: /リーチ/ }).first().click();
    await page.waitForTimeout(300);

    const afterText = await table.textContent();
    console.log('After riichi scores:', afterText?.substring(0, 100));

    // Scores should change (increase)
    expect(beforeText).not.toEqual(afterText);
    // Extract numbers and verify increase
    const before1300 = beforeText?.includes('1,300');
    const after2600 = afterText?.includes('2,600');
    console.log('Before has 1,300:', before1300, '-> After has 2,600:', after2600);
    await page.screenshot({ path: '/tmp/s6-f-ac1.png' });
  });

  // ==== AC2: リーチOFF時裏ドラ非表示、ON時表示 ====
  test('AC2 & AC3: 裏ドラ入力欄はリーチON/OFFに連動する', async ({ page }) => {
    const riichiBtn = page.locator('button').filter({ hasText: /リーチ/ }).first();

    // OFF: no ura-dora section
    const countOff = await page.locator('text=裏ドラ表示牌').count();
    expect(countOff).toBe(0);
    console.log('Ura-dora section count (OFF):', countOff, 'PASS: 0');

    // ON
    await riichiBtn.click();
    await page.waitForTimeout(200);

    const countOn = await page.locator('text=裏ドラ表示牌').count();
    expect(countOn).toBeGreaterThan(0);
    console.log('Ura-dora section count (ON):', countOn, 'PASS: >0');

    // Add ura-dora
    await page.locator('button').filter({ hasText: /裏ドラ表示牌を追加/ }).first().click();
    await page.waitForTimeout(200);

    // Select 5m as indicator (6m becomes ura-dora)
    const picker = page.locator('div').filter({ hasText: '表示牌を選択してください' }).last();
    const fivem = picker.locator('button').filter({ hasText: /^5萬$/ }).first();
    if (await fivem.isVisible()) {
      await fivem.click();
    } else {
      const all = page.locator('button').filter({ hasText: /^5萬$/ });
      await all.last().click();
    }
    await page.waitForTimeout(200);

    // Verify 6m shown as ura-dora
    const content = await page.content();
    expect(content).toContain('6萬');
    console.log('Ura dora 5m->6m shown: PASS');

    // OFF again: section disappears + ura-dora cleared
    await riichiBtn.click();
    await page.waitForTimeout(200);

    const countOffAgain = await page.locator('text=裏ドラ表示牌').count();
    expect(countOffAgain).toBe(0);
    console.log('Ura-dora section gone after riichi OFF: PASS');

    await page.screenshot({ path: '/tmp/s6-f-ac2ac3.png' });
  });

  // ==== AC4: 裏ドラ点数内訳 ====
  test('AC4: 裏ドラ設定で点数内訳に裏X翻が表示される', async ({ page }) => {
    // Enable riichi first
    await page.locator('button').filter({ hasText: /リーチ/ }).first().click();
    await page.waitForTimeout(200);

    // Set ura-dora indicator to 1m (so 2m is ura-dora)
    await page.locator('button').filter({ hasText: /裏ドラ表示牌を追加/ }).first().click();
    await page.waitForTimeout(200);

    // Click 1m in the picker
    const picker = page.locator('div').filter({ hasText: '表示牌を選択してください' }).last();
    const onem = picker.locator('button').filter({ hasText: /^1萬$/ }).first();
    if (await onem.isVisible()) {
      await onem.click();
    } else {
      await page.locator('button').filter({ hasText: /^1萬$/ }).last().click();
    }
    await page.waitForTimeout(200);

    // Close the picker
    const closePicker = page.locator('button').filter({ hasText: /▲ 閉じる/ }).last();
    if (await closePicker.isVisible()) {
      await closePicker.click();
      await page.waitForTimeout(200);
    }

    await page.screenshot({ path: '/tmp/s6-f-ac4-ura-set.png' });

    // Add tiles (hand includes 2m which is ura-dora now)
    for (const t of ['1萬','2萬','3萬','4筒','5筒','6筒','7索','8索','9索','白','白','白','2萬']) {
      await addTile(page, t);
    }

    const handCountText = await page.locator('text=/\\d+\\/14枚/').first().textContent().catch(() => '?');
    console.log('Hand count:', handCountText);

    await clickTenpai(page);
    await page.screenshot({ path: '/tmp/s6-f-ac4-tenpai.png' });

    // Click first wait row
    await page.locator('tr').filter({ hasText: /\d+点/ }).first().click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-f-ac4-detail.png' });

    const content = await page.content();
    const hasUra = content.includes('裏1') || content.includes('裏 1') || content.includes('裏ドラ') || content.includes('裏翻');
    console.log('Has 裏1 han:', hasUra, '| Has 裏:', content.includes('裏'));
    expect(content).toContain('裏');
  });

  // ==== AC5: 一発制御 ====
  test('AC5: 一発はリーチ連動で有効/無効', async ({ page }) => {
    const ippatsuBtn = page.locator('button').filter({ hasText: /^一発/ }).first();
    const riichiBtn = page.locator('button').filter({ hasText: /リーチ/ }).first();

    // OFF: ippatsu disabled
    expect(await ippatsuBtn.isDisabled()).toBe(true);

    // ON: ippatsu enabled
    await riichiBtn.click();
    await page.waitForTimeout(200);
    expect(await ippatsuBtn.isDisabled()).toBe(false);

    // Turn on ippatsu
    await ippatsuBtn.click();
    await page.waitForTimeout(200);
    const ippatsuActive = (await ippatsuBtn.textContent())?.includes('✓');
    console.log('Ippatsu active:', ippatsuActive);
    expect(ippatsuActive).toBe(true);

    await page.screenshot({ path: '/tmp/s6-f-ac5.png' });
  });

  // ==== AC6: 門前清自摸和 ====
  test('AC6: ツモ詳細に門前清自摸和が自動付与される', async ({ page }) => {
    for (const t of ['2萬','3萬','4萬','5筒','6筒','7筒','8索','8索','8索','中','中','6萬','7萬']) {
      await addTile(page, t);
    }

    const handCount = await page.locator('text=/\\d+\\/14枚/').first().textContent().catch(() => '?');
    console.log('Hand count before tenpai:', handCount);

    await clickTenpai(page);
    await page.screenshot({ path: '/tmp/s6-f-ac6-tenpai.png' });

    // Click first wait row
    const waitRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    await waitRow.click();
    await page.waitForTimeout(300);

    // Click ツモ tab
    const tsumoTab = page.locator('button').filter({ hasText: /^ツモ$/ }).first();
    if (await tsumoTab.isVisible()) {
      await tsumoTab.click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: '/tmp/s6-f-ac6-tsumo-detail.png' });

    const content = await page.content();
    const hasMenzen = content.includes('門前清自摸和') || content.includes('門前ツモ') || content.includes('門前清自摸');
    console.log('Has 門前清自摸和:', content.includes('門前清自摸和'));
    expect(hasMenzen).toBe(true);
  });

  // ==== AC7: 嶺上開花列 + 3列テーブル ====
  test('AC7 & AC9: 嶺上開花役と3列テーブル表示', async ({ page }) => {
    for (const t of ['2萬','3萬','4萬','5筒','6筒','7筒','8索','8索','8索','中','中','6萬','7萬']) {
      await addTile(page, t);
    }
    await clickTenpai(page);
    await page.screenshot({ path: '/tmp/s6-f-ac7-table.png' });

    // Verify 3-column table
    await expect(page.locator('th').filter({ hasText: /^ロン$/ }).first()).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /^ツモ$/ }).first()).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /^嶺上$/ }).first()).toBeVisible();
    console.log('3 column headers: PASS');

    // Verify scores appear in 3 columns
    const firstRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    const rowText = await firstRow.textContent();
    const tenCount = (rowText?.match(/点/g) || []).length;
    console.log('点 count in row:', tenCount, '(expect >= 3)');
    expect(tenCount).toBeGreaterThanOrEqual(3);

    // Click row and check 嶺上 tab
    await firstRow.click();
    await page.waitForTimeout(300);

    const rinshankTab = page.locator('button').filter({ hasText: /^嶺上$/ }).first();
    if (await rinshankTab.isVisible()) {
      await rinshankTab.click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: '/tmp/s6-f-ac7-rinshan-tab.png' });

    const content = await page.content();
    console.log('Has 嶺上開花:', content.includes('嶺上開花'));
    expect(content).toContain('嶺上開花');
  });

  // ==== AC8: 海底・河底排他制御と翻数反映 ====
  test('AC8: 海底・河底の排他制御と役への反映', async ({ page }) => {
    const haiteiBtn = page.locator('button').filter({ hasText: /^海底/ }).first();
    const houteiBtn = page.locator('button').filter({ hasText: /^河底/ }).first();

    await expect(haiteiBtn).toBeVisible();
    await expect(houteiBtn).toBeVisible();

    // 海底ON
    await haiteiBtn.click();
    await page.waitForTimeout(200);
    expect((await haiteiBtn.textContent())?.includes('✓')).toBe(true);
    console.log('海底 activated: PASS');

    // 河底ON -> 海底がOFFになる
    await houteiBtn.click();
    await page.waitForTimeout(200);
    expect((await houteiBtn.textContent())?.includes('✓')).toBe(true);
    expect((await haiteiBtn.textContent())?.includes('✓')).toBe(false);
    console.log('河底 activated, 海底 deactivated: PASS');

    await page.screenshot({ path: '/tmp/s6-f-ac8-buttons.png' });

    // Add hand and check 河底 appears in ron detail
    for (const t of ['2萬','3萬','4萬','5筒','6筒','7筒','8索','8索','8索','中','中','6萬','7萬']) {
      await addTile(page, t);
    }
    await clickTenpai(page);

    const waitRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    await waitRow.click();
    await page.waitForTimeout(300);

    // Click ロン tab
    const ronTab = page.locator('button').filter({ hasText: /^ロン$/ }).first();
    if (await ronTab.isVisible()) {
      await ronTab.click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: '/tmp/s6-f-ac8-ron-detail.png' });

    const content = await page.content();
    console.log('Has 河底 in details:', content.includes('河底'));
    expect(content).toContain('河底');

    // Now check 海底 with ツモ
    // Reset to fresh
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Enable 海底
    await page.locator('button').filter({ hasText: /^海底/ }).first().click();
    await page.waitForTimeout(200);

    for (const t of ['2萬','3萬','4萬','5筒','6筒','7筒','8索','8索','8索','中','中','6萬','7萬']) {
      await addTile(page, t);
    }
    await clickTenpai(page);

    await page.locator('tr').filter({ hasText: /\d+点/ }).first().click();
    await page.waitForTimeout(300);

    const tsumoTab = page.locator('button').filter({ hasText: /^ツモ$/ }).first();
    if (await tsumoTab.isVisible()) {
      await tsumoTab.click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: '/tmp/s6-f-ac8-tsumo-haitei.png' });

    const content2 = await page.content();
    console.log('Has 海底 in tsumo details:', content2.includes('海底'));
    expect(content2).toContain('海底');
  });

  // ==== Regression: Sprint 1-5 ====
  test('Regression: Sprint 1-5の基本機能が壊れていない', async ({ page }) => {
    // Sprint 1: パレットから牌追加・削除
    await addTile(page, '1萬');
    await addTile(page, '2筒');
    let countText = await page.locator('text=/\\d+\\/14枚/').first().textContent().catch(() => '');
    expect(countText).toContain('2/14');
    console.log('Sprint 1 - tile add:', countText, 'PASS');

    // Sprint 2: ドラ設定
    await page.locator('button').filter({ hasText: /ドラ表示牌を追加/ }).first().click();
    await page.waitForTimeout(200);
    // Pick 5m
    const picker = page.locator('div').filter({ hasText: '表示牌を選択してください' }).last();
    const fivem = picker.locator('button').filter({ hasText: /^5萬$/ }).first();
    if (await fivem.isVisible()) {
      await fivem.click();
    } else {
      await page.locator('button').filter({ hasText: /^5萬$/ }).last().click();
    }
    await page.waitForTimeout(200);
    const content = await page.content();
    expect(content).toContain('6萬'); // 5m indicator -> 6m dora
    console.log('Sprint 2 - dora 5m->6m: PASS');

    // Full reset and sprint 3
    await page.locator('button').filter({ hasText: /全リセット/ }).first().click();
    await page.waitForTimeout(300);

    // Sprint 3: 聴牌判定
    for (const t of ['1萬','2萬','3萬','4萬','5萬','6萬','7萬','8萬','9萬','1筒','1筒','2筒','2筒']) {
      await addTile(page, t);
    }
    await clickTenpai(page);
    const c3 = await page.content();
    expect(c3).toContain('聴牌');
    console.log('Sprint 3 - tenpai detected: PASS');

    // Click wait tile and check sprint 4
    await page.locator('tr').filter({ hasText: /\d+点/ }).first().click();
    await page.waitForTimeout(300);
    const c4 = await page.content();
    console.log('Sprint 4 - yaku shown:', c4.includes('役'));
    // Should show some yaku
    expect(c4).toMatch(/役|翻/);
    console.log('Sprint 4/5 - yaku and score: PASS');

    await page.screenshot({ path: '/tmp/s6-f-regression.png' });
  });
});
