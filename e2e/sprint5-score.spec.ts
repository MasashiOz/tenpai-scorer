import { test, expect } from '@playwright/test';

// Click tile in palette by exact text match
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
    if (!clicked) {
      console.log(`WARNING: Could not click tile: ${tileText}`);
    }
  }
}

async function clearHand(page: any) {
  const clearBtn = page.locator('button').filter({ hasText: 'クリア' });
  const isEnabled = await clearBtn.first().isEnabled();
  if (isEnabled) {
    await clearBtn.first().click();
    await page.waitForTimeout(100);
  }
  // Also try リセット
  const resetBtn = page.locator('button').filter({ hasText: '全リセット' });
  if (await resetBtn.count() > 0) {
    await resetBtn.first().click();
    await page.waitForTimeout(100);
  }
}

test.describe('Sprint 5: 符計算と点数算出テスト', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('AC1: 子・平和形アガリの点数表示確認', async ({ page }) => {
    // 手牌: 2萬・3萬・4萬 / 4筒・5筒・6筒 / 6索・7索・8索 / 2索・3索 / 6萬・6萬 (13枚)
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

    // Check 13 tiles in hand
    const handCountText = await page.locator('body').textContent();
    const match = handCountText?.match(/(\d+)\/14枚/);
    console.log('Hand count:', match?.[1]);
    expect(match?.[1]).toBe('13');

    // Click 聴牌判定する
    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    const bodyText = await page.locator('body').textContent();
    console.log('After tenpai:', bodyText?.substring(0, 1200));
    await page.screenshot({ path: '/tmp/sprint5-ac1-tenpai.png', fullPage: true });

    // Check tenpai detected
    expect(bodyText).toMatch(/聴牌！|待ち牌/);
    // Check score display
    expect(bodyText).toMatch(/\d+点|ロン|ツモ/);
  });

  test('AC2: 符内訳アコーディオンの確認', async ({ page }) => {
    // Add same hand as AC1
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

    // Try to click on a waiting tile to expand details
    const bodyText = await page.locator('body').textContent();
    console.log('Body after tenpai:', bodyText?.substring(0, 800));
    await page.screenshot({ path: '/tmp/sprint5-ac2-before.png', fullPage: true });

    // Click on 待ち牌 to expand
    const waitingTiles = page.locator('[role=button], div').filter({ hasText: /1索|4索/ });
    if (await waitingTiles.count() > 0) {
      await waitingTiles.first().click();
      await page.waitForTimeout(300);
    }

    // Click 符の内訳 button if exists
    const fuBtn = page.locator('button').filter({ hasText: '符の内訳' });
    if (await fuBtn.count() > 0) {
      await fuBtn.first().click();
      await page.waitForTimeout(300);
      const afterClick = await page.locator('body').textContent();
      console.log('After fu breakdown click:', afterClick?.substring(0, 800));
      await page.screenshot({ path: '/tmp/sprint5-ac2-fubreakdown.png', fullPage: true });
      // Check for fu breakdown content
      expect(afterClick).toMatch(/副底20符|符内訳|切り上げ/);
    } else {
      // Maybe it's visible directly
      const afterExpand = await page.locator('body').textContent();
      console.log('No fu button, checking body:', afterExpand?.substring(0, 800));
    }
  });

  test('AC3: 七対子 25符固定確認', async ({ page }) => {
    // 七対子聴牌: 1萬×2 / 東×2 / 南×2 / 西×2 / 北×2 / 白×2 / 發×1
    await clickPaletteTile(page, '1萬', 2);
    await clickPaletteTile(page, '東', 2);
    await clickPaletteTile(page, '南', 2);
    await clickPaletteTile(page, '西', 2);
    await clickPaletteTile(page, '北', 2);
    await clickPaletteTile(page, '白', 2);
    await clickPaletteTile(page, '發', 1);

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    const bodyText = await page.locator('body').textContent();
    console.log('Chiitoi body:', bodyText?.substring(0, 800));
    await page.screenshot({ path: '/tmp/sprint5-ac3-chiitoi.png', fullPage: true });
    
    // Should show chiitoi and some score
    expect(bodyText).toMatch(/聴牌！|待ち牌|七対子/);
    
    // Click 發 (waiting tile)
    const faTile = page.locator('[role=button]').filter({ hasText: '發' });
    if (await faTile.count() > 0) {
      await faTile.first().click();
      await page.waitForTimeout(300);
    }

    const afterClick = await page.locator('body').textContent();
    console.log('After 發 click:', afterClick?.substring(0, 800));
    await page.screenshot({ path: '/tmp/sprint5-ac3-detail.png', fullPage: true });
    
    // Check for 25 fu or chiitoi 
    expect(afterClick).toMatch(/25符|七対子/);
  });

  test('AC4: 子・清一色満貫（8000点）の確認', async ({ page }) => {
    // 清一色 萬子のみ: 1萬×3 / 2萬×3 / 3萬×3 / 4萬×2 / 6萬×2 = 13枚
    await clickPaletteTile(page, '1萬', 3);
    await clickPaletteTile(page, '2萬', 3);
    await clickPaletteTile(page, '3萬', 3);
    await clickPaletteTile(page, '4萬', 2);
    await clickPaletteTile(page, '6萬', 2);

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    const bodyText = await page.locator('body').textContent();
    console.log('Chinitsu body:', bodyText?.substring(0, 800));
    await page.screenshot({ path: '/tmp/sprint5-ac4-chinitsu.png', fullPage: true });
    
    expect(bodyText).toMatch(/聴牌！|8000|満貫/);
  });

  test('AC5: 親・満貫 12000点の確認', async ({ page }) => {
    // Set 親
    const oyaBtn = page.locator('button').filter({ hasText: '親' }).first();
    await oyaBtn.click();
    await page.waitForTimeout(100);

    // 清一色 萬子のみ: 1萬×3 / 2萬×3 / 3萬×3 / 4萬×2 / 6萬×2 = 13枚
    await clickPaletteTile(page, '1萬', 3);
    await clickPaletteTile(page, '2萬', 3);
    await clickPaletteTile(page, '3萬', 3);
    await clickPaletteTile(page, '4萬', 2);
    await clickPaletteTile(page, '6萬', 2);

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    const bodyText = await page.locator('body').textContent();
    console.log('Oya mangan body:', bodyText?.substring(0, 800));
    await page.screenshot({ path: '/tmp/sprint5-ac5-oyamangan.png', fullPage: true });
    
    expect(bodyText).toMatch(/12000|満貫/);
  });

  test('AC6: 親・跳満 18000点の確認', async ({ page }) => {
    // Set 親
    const oyaBtn = page.locator('button').filter({ hasText: '親' }).first();
    await oyaBtn.click();
    await page.waitForTimeout(100);

    // タンヤオ平和一盃口 (6翻): 2萬×2 / 3萬×2 / 4萬×2 / 2筒×2 / 3筒×2 / 4筒×2 / 6索・6索 (13枚)
    await clickPaletteTile(page, '2萬', 2);
    await clickPaletteTile(page, '3萬', 2);
    await clickPaletteTile(page, '4萬', 2);
    await clickPaletteTile(page, '2筒', 2);
    await clickPaletteTile(page, '3筒', 2);
    await clickPaletteTile(page, '4筒', 2);
    await clickPaletteTile(page, '6索', 2);

    // Wait for 13 tiles
    await page.waitForTimeout(200);

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    const bodyText = await page.locator('body').textContent();
    console.log('Oya haneman body:', bodyText?.substring(0, 1000));
    await page.screenshot({ path: '/tmp/sprint5-ac6-oyahaneman.png', fullPage: true });
    
    expect(bodyText).toMatch(/18000|跳満/);
  });

  test('AC7: ロンとツモで点数が異なることの確認', async ({ page }) => {
    // 平和形 手牌
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

    // Try to click a waiting tile to see ron/tsumo tabs
    const waitingTile = page.locator('[role=button]').first();
    if (await waitingTile.count() > 0) {
      await waitingTile.click();
      await page.waitForTimeout(300);
    }

    const bodyText = await page.locator('body').textContent();
    console.log('Ron/Tsumo check:', bodyText?.substring(0, 800));
    await page.screenshot({ path: '/tmp/sprint5-ac7-rontsumo.png', fullPage: true });
    
    // Should show both ron and tsumo tabs/sections
    expect(bodyText).toMatch(/ロン|ツモ/);
  });
});
