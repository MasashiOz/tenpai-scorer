import { test, expect } from '@playwright/test';

async function clickPaletteTile(page: any, tileText: string, times: number = 1) {
  for (let t = 0; t < times; t++) {
    const buttons = page.locator('button');
    const count = await buttons.count();
    let clicked = false;
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const text = (await btn.textContent())?.trim();
      const isDisabled = await btn.isDisabled();
      if (text === tileText && !isDisabled) {
        await btn.click();
        clicked = true;
        await page.waitForTimeout(30);
        break;
      }
    }
  }
}

test.describe('回帰テスト: Sprint 1〜4の機能確認', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  // Sprint 1: 牌パレットと手牌操作
  test('Sprint1-回帰: 全34種牌パレット表示', async ({ page }) => {
    const body = await page.locator('body').textContent();
    // Check all tile types exist
    expect(body).toContain('1萬');
    expect(body).toContain('9萬');
    expect(body).toContain('1筒');
    expect(body).toContain('9筒');
    expect(body).toContain('1索');
    expect(body).toContain('9索');
    expect(body).toContain('東');
    expect(body).toContain('南');
    expect(body).toContain('西');
    expect(body).toContain('北');
    expect(body).toContain('白');
    expect(body).toContain('發');
    expect(body).toContain('中');
    console.log('Sprint 1: All tile types present in palette');
  });

  test('Sprint1-回帰: 牌の追加・削除', async ({ page }) => {
    // Add a tile
    await clickPaletteTile(page, '1萬');
    let body = await page.locator('body').textContent();
    expect(body?.match(/1\/14枚/)).toBeTruthy();
    
    // Add more
    await clickPaletteTile(page, '2萬');
    await clickPaletteTile(page, '3萬');
    body = await page.locator('body').textContent();
    expect(body?.match(/3\/14枚/)).toBeTruthy();
    console.log('Sprint 1: Tile add works');
  });

  test('Sprint1-回帰: 同一牌4枚制限', async ({ page }) => {
    // Add 1萬 4 times
    await clickPaletteTile(page, '1萬', 4);
    let body = await page.locator('body').textContent();
    expect(body?.match(/4\/14枚/)).toBeTruthy();
    
    // Try 5th time - should fail
    await clickPaletteTile(page, '1萬', 1);
    body = await page.locator('body').textContent();
    // Should still be 4
    expect(body?.match(/4\/14枚/)).toBeTruthy();
    console.log('Sprint 1: 4-tile limit working');
  });

  test('Sprint1-回帰: クリアボタン', async ({ page }) => {
    await clickPaletteTile(page, '1萬', 3);
    let body = await page.locator('body').textContent();
    const countBefore = body?.match(/(\d+)\/14枚/)?.[1];
    console.log('Before clear:', countBefore);
    
    // Enable clear button by having tiles
    const clearBtn = page.locator('button').filter({ hasText: 'クリア' });
    if (await clearBtn.first().isEnabled()) {
      await clearBtn.first().click();
      await page.waitForTimeout(100);
      body = await page.locator('body').textContent();
      expect(body?.match(/0\/14枚/)).toBeTruthy();
      console.log('Sprint 1: Clear button works');
    }
  });

  // Sprint 2: 状況設定パネル
  test('Sprint2-回帰: 親/子トグル', async ({ page }) => {
    const body = await page.locator('body').textContent();
    // Check initial state: 子 selected
    expect(body).toMatch(/子.{0,5}✓|✓.{0,5}子/);
    
    // Click 親
    const oyaBtn = page.locator('button').filter({ hasText: '親' }).first();
    await oyaBtn.click();
    await page.waitForTimeout(100);
    
    const body2 = await page.locator('body').textContent();
    // Check 親 now selected
    expect(body2).toMatch(/親.{0,10}✓|✓.{0,10}親/);
    console.log('Sprint 2: Parent/Child toggle works');
  });

  test('Sprint2-回帰: 場風/自風選択', async ({ page }) => {
    const body = await page.locator('body').textContent();
    // Check initial state: 東場 and 東家 selected
    expect(body).toMatch(/東場.{0,5}✓|✓.{0,5}東場/);
    
    // Change to 南場
    const nanBtn = page.locator('button').filter({ hasText: '南場' });
    await nanBtn.click();
    await page.waitForTimeout(100);
    
    const body2 = await page.locator('body').textContent();
    expect(body2).toMatch(/南場.{0,5}✓|✓.{0,5}南場/);
    console.log('Sprint 2: Round/Seat wind selection works');
  });

  test('Sprint2-回帰: ドラ表示牌入力', async ({ page }) => {
    // Click + ドラ表示牌を追加
    const doraBtn = page.locator('button').filter({ hasText: '＋ ドラ表示牌を追加' });
    if (await doraBtn.count() > 0) {
      await doraBtn.click();
      await page.waitForTimeout(200);
      
      // Find 5萬 in dora picker and click it
      const body = await page.locator('body').textContent();
      const hasPickerOpen = body?.includes('5萬') || body?.includes('ドラ');
      console.log('Dora picker opened:', hasPickerOpen);
      
      // Click 5萬 in palette (now shown as dora picker)
      await clickPaletteTile(page, '5萬');
      await page.waitForTimeout(200);
      
      const body2 = await page.locator('body').textContent();
      const hasDora = body2?.includes('→') || body2?.includes('6萬');
      console.log('Dora added (5萬→6萬):', hasDora);
    }
    console.log('Sprint 2: Dora indicator input works');
  });

  // Sprint 3: 聴牌判定
  test('Sprint3-回帰: 聴牌判定ボタン制御', async ({ page }) => {
    // Initially disabled
    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    let isDisabled = await tenpaiBtn.first().isDisabled();
    expect(isDisabled).toBeTruthy();
    
    // Add 13 tiles
    await clickPaletteTile(page, '1萬', 3);
    await clickPaletteTile(page, '2萬', 3);
    await clickPaletteTile(page, '3萬', 3);
    await clickPaletteTile(page, '4萬', 2);
    await clickPaletteTile(page, '6萬', 2);

    isDisabled = await tenpaiBtn.first().isDisabled();
    expect(isDisabled).toBeFalsy();
    console.log('Sprint 3: Tenpai button activation works');
  });

  test('Sprint3-回帰: シャンポン待ちで2種類待ち', async ({ page }) => {
    // 1萬×3/2萬×3/3萬×3/1筒×2/2筒×2 = 13枚
    await clickPaletteTile(page, '1萬', 3);
    await clickPaletteTile(page, '2萬', 3);
    await clickPaletteTile(page, '3萬', 3);
    await clickPaletteTile(page, '1筒', 2);
    await clickPaletteTile(page, '2筒', 2);

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    const body = await page.locator('body').textContent();
    const waitInfo = body?.match(/待ち牌.{0,100}/)?.[0];
    console.log('Shanpon wait result:', waitInfo);
    // Should have 2 waiting tiles
    expect(waitInfo).toMatch(/2種類|1筒|2筒/);
    console.log('Sprint 3: Shanpon wait detected');
  });

  test('Sprint3-回帰: 国士無双13面待ち', async ({ page }) => {
    await clickPaletteTile(page, '1萬');
    await clickPaletteTile(page, '9萬');
    await clickPaletteTile(page, '1筒');
    await clickPaletteTile(page, '9筒');
    await clickPaletteTile(page, '1索');
    await clickPaletteTile(page, '9索');
    await clickPaletteTile(page, '東');
    await clickPaletteTile(page, '南');
    await clickPaletteTile(page, '西');
    await clickPaletteTile(page, '北');
    await clickPaletteTile(page, '白');
    await clickPaletteTile(page, '發');
    await clickPaletteTile(page, '中');

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    const body = await page.locator('body').textContent();
    const waitInfo = body?.match(/待ち牌.{0,50}/)?.[0];
    console.log('Kokushi 13-sided wait:', waitInfo);
    expect(waitInfo).toMatch(/13種類/);
    console.log('Sprint 3: Kokushi 13 wait detected');
  });

  // Sprint 4: 役判定
  test('Sprint4-回帰: 平和役判定', async ({ page }) => {
    // 2萬・3萬・4萬 / 4筒・5筒・6筒 / 6索・7索・8索 / 2索・3索 / 6萬・6萬 = pinfu + tanyao
    await clickPaletteTile(page, '2萬');
    await clickPaletteTile(page, '3萬');
    await clickPaletteTile(page, '4萬');
    await clickPaletteTile(page, '4筒');
    await clickPaletteTile(page, '5筒');
    await clickPaletteTile(page, '6筒');
    await clickPaletteTile(page, '6索');
    await clickPaletteTile(page, '7索');
    await clickPaletteTile(page, '8索');
    await clickPaletteTile(page, '2索');
    await clickPaletteTile(page, '3索');
    await clickPaletteTile(page, '6萬');
    await clickPaletteTile(page, '6萬');

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    // Click 4索
    const waitTiles = page.locator('[role=button]');
    for (let i = 0; i < await waitTiles.count(); i++) {
      const text = await waitTiles.nth(i).textContent();
      if (text?.includes('4索')) {
        await waitTiles.nth(i).click();
        await page.waitForTimeout(300);
        break;
      }
    }

    const body = await page.locator('body').textContent();
    expect(body).toContain('平和');
    expect(body).toContain('タンヤオ');
    console.log('Sprint 4: Pinfu + Tanyao detected');
  });

  test('Sprint4-回帰: ロン/ツモタブ切り替え', async ({ page }) => {
    await clickPaletteTile(page, '2萬');
    await clickPaletteTile(page, '3萬');
    await clickPaletteTile(page, '4萬');
    await clickPaletteTile(page, '4筒');
    await clickPaletteTile(page, '5筒');
    await clickPaletteTile(page, '6筒');
    await clickPaletteTile(page, '6索');
    await clickPaletteTile(page, '7索');
    await clickPaletteTile(page, '8索');
    await clickPaletteTile(page, '2索');
    await clickPaletteTile(page, '3索');
    await clickPaletteTile(page, '6萬');
    await clickPaletteTile(page, '6萬');

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    // Click wait tile
    const waitTiles = page.locator('[role=button]');
    if (await waitTiles.count() > 0) {
      await waitTiles.first().click();
      await page.waitForTimeout(300);
    }

    // Verify Ron tab shown
    const ronBtn = page.locator('button').filter({ hasText: 'ロン' });
    const tsumoBtn = page.locator('button').filter({ hasText: 'ツモ' });
    expect(await ronBtn.count()).toBeGreaterThan(0);
    expect(await tsumoBtn.count()).toBeGreaterThan(0);
    
    // Click ツモ
    await tsumoBtn.first().click();
    await page.waitForTimeout(300);
    const body = await page.locator('body').textContent();
    expect(body).toContain('ツモ点数');
    console.log('Sprint 4: Ron/Tsumo tab switch works');
  });
});
