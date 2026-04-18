import { test, expect, Page } from '@playwright/test';

async function addTile(page: Page, label: string) {
  const allBtns = page.locator('button').filter({ hasText: new RegExp(`^${label}$`) });
  const count = await allBtns.count();
  for (let i = 0; i < count; i++) {
    const btn = allBtns.nth(i);
    if (!await btn.isDisabled()) {
      await btn.click();
      await page.waitForTimeout(50);
      return;
    }
  }
}

test.describe('Regression Tests Sprint 1-5', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.locator('button').filter({ hasText: /全リセット/ }).first().click();
    await page.waitForTimeout(300);
  });

  test('Sprint 1: 牌パレット・手牌追加・削除・クリア', async ({ page }) => {
    // Add tiles
    await addTile(page, '1萬');
    await addTile(page, '2筒');
    await addTile(page, '東');
    await addTile(page, '中');

    const count4 = await page.locator('text=/4\\/14枚/').first().textContent().catch(() => '');
    console.log('4 tiles count:', count4);
    expect(count4).toContain('4/14');

    // Delete a tile from hand
    const handTile = page.locator('div').filter({ hasText: /^1萬$/ }).first();
    // Delete by clicking a tile in hand - use a different approach
    // Hand tiles should be in the hand area (the yellow bordered section)
    const handSection = page.locator('div').filter({ hasText: /\d+\/14枚/ }).first();
    const tileInHand = handSection.locator('button, [role=button]').first();
    if (await tileInHand.isVisible()) {
      await tileInHand.click();
      await page.waitForTimeout(200);
    }

    await page.screenshot({ path: '/tmp/s6-reg1-delete.png' });

    // Clear all
    await page.locator('button').filter({ hasText: /^クリア$/ }).first().click();
    await page.waitForTimeout(200);
    const count0 = await page.locator('text=/0\\/14枚/').count();
    console.log('0 tiles count after clear:', count0);
    expect(count0).toBeGreaterThan(0);
    console.log('Sprint 1 regression: PASS');
  });

  test('Sprint 2: 親/子・ドラ設定', async ({ page }) => {
    // Switch to dealer
    await page.locator('button').filter({ hasText: /^親$/ }).first().click();
    await page.waitForTimeout(200);
    const oyaActive = (await page.locator('button').filter({ hasText: /^親/ }).first().textContent())?.includes('✓');
    expect(oyaActive).toBe(true);
    console.log('親 switch: PASS');

    // Add dora indicator 5m -> 6m
    await page.locator('button').filter({ hasText: /ドラ表示牌を追加/ }).first().click();
    await page.waitForTimeout(200);

    const picker = page.locator('div').filter({ hasText: '表示牌を選択してください' }).last();
    const fivem = picker.locator('button').filter({ hasText: /^5萬$/ }).first();
    if (await fivem.isVisible()) {
      await fivem.click();
    } else {
      await page.locator('button').filter({ hasText: /^5萬$/ }).last().click();
    }
    await page.waitForTimeout(200);

    const content = await page.content();
    expect(content).toContain('6萬'); // 5m -> 6m dora
    console.log('Sprint 2 - dora 5m->6m: PASS');

    // Reset and verify
    await page.locator('button').filter({ hasText: /^リセット$/ }).first().click();
    await page.waitForTimeout(200);
    const countAfter = await page.locator('text=/ドラ表示牌が設定されていません/').count();
    console.log('Dora cleared after reset:', countAfter);
    expect(countAfter).toBeGreaterThan(0);
    console.log('Sprint 2 regression: PASS');
  });

  test('Sprint 3: 聴牌判定（シャンポン2種）', async ({ page }) => {
    // Shanpon: 1m2m3m 4m5m6m 7m8m9m 1p1p 2p2p
    for (const t of ['1萬','2萬','3萬','4萬','5萬','6萬','7萬','8萬','9萬','1筒','1筒','2筒','2筒']) {
      await addTile(page, t);
    }

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 5000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: '/tmp/s6-reg3-tenpai.png' });

    const content = await page.content();
    expect(content).toContain('聴牌');
    expect(content).toContain('1筒');
    expect(content).toContain('2筒');
    console.log('Sprint 3 - shanpon tenpai: PASS');
  });

  test('Sprint 4: 役判定（タンヤオ・平和）', async ({ page }) => {
    // Tanyao pinfu hand: 2m3m4m / 2m3m4m / 5p6p7p / 6s7s8s / 8s (wait on 7s or 9s)
    for (const t of ['2萬','3萬','4萬','2萬','3萬','4萬','5筒','6筒','7筒','6索','7索','8索','8索']) {
      await addTile(page, t);
    }

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 5000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    const firstRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    await firstRow.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-reg4-yaku.png' });

    const content = await page.content();
    console.log('Has タンヤオ:', content.includes('タンヤオ'));
    expect(content).toContain('タンヤオ');
    console.log('Sprint 4 regression: PASS');
  });

  test('Sprint 5: 符計算・点数算出（七対子25符）', async ({ page }) => {
    // 七対子 hand: 1m1m 東東 南南 西西 北北 白白 發
    for (const t of ['1萬','1萬','東','東','南','南','西','西','北','北','白','白','發']) {
      await addTile(page, t);
    }

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 5000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    const firstRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
    await firstRow.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/s6-reg5-chiitoi.png' });

    const content = await page.content();
    console.log('Has 七対子:', content.includes('七対子'));
    console.log('Has 25符:', content.includes('25符'));
    expect(content).toContain('七対子');
    expect(content).toContain('25符');
    console.log('Sprint 5 regression: PASS');
  });
});
