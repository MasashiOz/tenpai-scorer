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
    if (!clicked) {
      console.log(`WARNING: Could not click tile [${tileText}], attempt ${t+1}`);
    }
  }
}

test.describe('Sprint 5: Debug Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('AC5-debug: 親ボタンの動作確認', async ({ page }) => {
    // Check all buttons to find 親 button
    const buttons = page.locator('button');
    const count = await buttons.count();
    let parentBtnFound = false;
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const text = (await btn.textContent())?.trim();
      if (text === '親') {
        console.log(`Found 親 button at index ${i}`);
        const isDisabled = await btn.isDisabled();
        console.log('Is disabled:', isDisabled);
        parentBtnFound = true;
        if (!isDisabled) {
          await btn.click();
          await page.waitForTimeout(100);
          break;
        }
      }
    }
    
    if (!parentBtnFound) {
      const bodyText = await page.locator('body').textContent();
      console.log('Body text search for 親:', bodyText?.includes('親'));
    }

    // Add same tiles as AC5
    const bodyBefore = await page.locator('body').textContent();
    const parentMatch = bodyBefore?.match(/✓\s*(親|子)/);
    console.log('Player position:', parentMatch?.[0]);

    await clickPaletteTile(page, '1萬', 3);
    await clickPaletteTile(page, '2萬', 3);
    await clickPaletteTile(page, '3萬', 3);
    await clickPaletteTile(page, '4萬', 2);
    await clickPaletteTile(page, '6萬', 2);

    const handCount = await page.locator('body').textContent();
    console.log('Hand count:', handCount?.match(/(\d+)\/14枚/)?.[0]);

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    const isEnabled = await tenpaiBtn.first().isEnabled();
    console.log('Tenpai enabled:', isEnabled);
    
    if (isEnabled) {
      await tenpaiBtn.click();
      await page.waitForTimeout(500);
      const result = await page.locator('body').textContent();
      // Find score patterns
      const scoreMatches = result?.match(/\d{4,5}点|満貫|跳満|倍満/g);
      console.log('Score matches:', scoreMatches);
      const playerPos = result?.match(/✓\s*(親|子)/);
      console.log('Player position after tenpai:', playerPos?.[0]);
      await page.screenshot({ path: '/tmp/sprint5-ac5-debug.png', fullPage: true });
      
      // Try clicking waiting tile
      const waitTile = page.locator('[role=button]').first();
      if (await waitTile.count() > 0) {
        await waitTile.click();
        await page.waitForTimeout(300);
        const afterClick = await page.locator('body').textContent();
        const scoreAfter = afterClick?.match(/\d{4,5}点|満貫|跳満|倍満|\d,\d{3}点/g);
        console.log('Score after waiting tile click:', scoreAfter);
        await page.screenshot({ path: '/tmp/sprint5-ac5-afterclick.png', fullPage: true });
      }
    }
  });

  test('AC5-oya-chinitsu: 親・清一色満貫12000確認', async ({ page }) => {
    // Set 親 first using specific approach
    const bodyText0 = await page.locator('body').textContent();
    console.log('Initial state:', bodyText0?.match(/プレイヤー.{0,20}/)?.[0]);

    // Find 親 button more robustly  
    await page.evaluate(() => {
      // Look for all buttons and click the one with text 親
      const btns = Array.from(document.querySelectorAll('button'));
      for (const btn of btns) {
        if (btn.textContent?.trim() === '親' && !btn.disabled) {
          btn.click();
          break;
        }
      }
    });
    await page.waitForTimeout(200);

    const bodyAfterOya = await page.locator('body').textContent();
    console.log('After oya click:', bodyAfterOya?.match(/✓親|✓子|プレイヤー.{0,30}/)?.[0]);

    // Add tiles
    await clickPaletteTile(page, '1萬', 3);
    await clickPaletteTile(page, '2萬', 3);
    await clickPaletteTile(page, '3萬', 3);
    await clickPaletteTile(page, '4萬', 2);
    await clickPaletteTile(page, '6萬', 2);

    const handCount = await page.locator('body').textContent();
    const countMatch = handCount?.match(/(\d+)\/14枚/)?.[1];
    console.log('Tiles in hand:', countMatch);

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    const result = await page.locator('body').textContent();
    console.log('Result full:', result?.substring(0, 1000));

    // Click waiting tile (5萬 should be the wait)
    const waitTiles = page.locator('[role=button]');
    const waitCount = await waitTiles.count();
    console.log('Wait tiles count:', waitCount);
    if (waitCount > 0) {
      await waitTiles.first().click();
      await page.waitForTimeout(300);
      const detailText = await page.locator('body').textContent();
      const scoreMatch = detailText?.match(/\d{4,6}点|\d{1,2},\d{3}点|満貫|12,000|12000/g);
      console.log('Score in detail:', scoreMatch);
      await page.screenshot({ path: '/tmp/sprint5-oya-chinitsu-detail.png', fullPage: true });
    }
  });

  test('AC6-haneman: 親・跳満18000確認', async ({ page }) => {
    // Set 親
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      for (const btn of btns) {
        if (btn.textContent?.trim() === '親' && !btn.disabled) {
          btn.click();
          break;
        }
      }
    });
    await page.waitForTimeout(200);

    // タンヤオ平和一盃口 (6翻確実): 2萬・3萬・4萬 × 2組 + 2筒・3筒・4筒 × 2組 + 雀頭
    // This should be 6 han: tanyao(1) + pinfu(1) + iipeiko(2) + rinshan/tsumo - but let's check carefully
    // Actually: 2萬3萬4萬 / 2萬3萬4萬 / 2筒3筒4筒 / 2筒3筒4筒 / 6索6索 = 13 tiles
    // tanyao(1) + pinfu(1) + iipeiko(2) = 4 han at minimum → not haneman for oya
    // For oya haneman (6+ han needed)... let's try:
    // Chiitoitsu + Honitsu = 2+3 = 5 han... not 6
    // Ryupeikou (6 han?) = 二盃口 = 3 han (2+1 for menzen only)
    // Tanyao + iipeiko + chinitsu (6 han for 清一色 chinitsu version)
    // Let's try: 清一色 (6han) + tanyao (1) = 7 han for oya = haneman 18000
    // 萬子のみ: 2萬3萬4萬 / 2萬3萬4萬 / 5萬6萬7萬 / 8萬8萬 = 12 tiles. Wait on 1萬 or 7萬+8萬+9萬 
    // Actually let me try: 1萬×3 / 2萬×3 / 3萬×3 / 4萬×2 / 6萬×2 = 13 tiles, 清一色 6han → oya mangan 12000
    // For haneman 6 han: chinitsu(6) + tanyao(1) = 7 han → haneman!
    // Let's try: 2萬×3 / 4萬×3 / 6萬×3 / 7萬×2 / 8萬×2 = 13 tiles
    await clickPaletteTile(page, '2萬', 3);
    await clickPaletteTile(page, '4萬', 3);
    await clickPaletteTile(page, '6萬', 3);
    await clickPaletteTile(page, '7萬', 2);
    await clickPaletteTile(page, '8萬', 2);

    const handCount = await page.locator('body').textContent();
    console.log('Tiles in hand:', handCount?.match(/(\d+)\/14枚/)?.[0]);

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    const isEnabled = await tenpaiBtn.first().isEnabled();
    console.log('Tenpai enabled:', isEnabled);

    if (isEnabled) {
      await tenpaiBtn.click();
      await page.waitForTimeout(500);
      const result = await page.locator('body').textContent();
      console.log('Haneman result:', result?.substring(0, 800));
      
      // Click waiting tile
      const waitTiles = page.locator('[role=button]');
      if (await waitTiles.count() > 0) {
        await waitTiles.first().click();
        await page.waitForTimeout(300);
        const detailText = await page.locator('body').textContent();
        const scoreMatch = detailText?.match(/\d{4,6}点|\d{1,2},\d{3}点|満貫|跳満|18,000|18000/g);
        console.log('Haneman score:', scoreMatch);
        await page.screenshot({ path: '/tmp/sprint5-haneman-detail.png', fullPage: true });
      }
    }
  });

  test('AC2-fu-breakdown: 符内訳アコーディオン詳細確認', async ({ page }) => {
    // Same hand as AC1
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

    // Click first waiting tile (role=button)
    const waitTiles = page.locator('[role=button]');
    const cnt = await waitTiles.count();
    console.log('Wait tiles count:', cnt);
    if (cnt > 0) {
      // Click on 4索 specifically
      for (let i = 0; i < cnt; i++) {
        const text = await waitTiles.nth(i).textContent();
        if (text?.includes('4索')) {
          await waitTiles.nth(i).click();
          break;
        }
      }
      await page.waitForTimeout(300);
    }

    const afterWait = await page.locator('body').textContent();
    console.log('After wait tile click:', afterWait?.substring(0, 1000));
    await page.screenshot({ path: '/tmp/sprint5-ac2-wait-expanded.png', fullPage: true });

    // Try clicking 符の内訳
    const fuBtn = page.locator('button').filter({ hasText: /符の内訳/ });
    const fuCount = await fuBtn.count();
    console.log('Fu button count:', fuCount);
    
    if (fuCount > 0) {
      await fuBtn.first().click();
      await page.waitForTimeout(300);
      const fuText = await page.locator('body').textContent();
      console.log('Fu breakdown expanded:', fuText?.substring(0, 1000));
      await page.screenshot({ path: '/tmp/sprint5-ac2-fu-expanded.png', fullPage: true });
      // Check for 副底20符 content
      const hasFuDetail = fuText?.includes('副底') || fuText?.includes('20符') || fuText?.includes('切り上げ');
      console.log('Has fu detail:', hasFuDetail);
    }

    // Also look for 符の内訳 as a div/span clickable
    const fuDiv = page.locator('div, span').filter({ hasText: '符の内訳' });
    console.log('Fu div count:', await fuDiv.count());
  });

  test('AC7-rontsumo: ロン/ツモタブ切り替えと点数差異確認', async ({ page }) => {
    // Same hand as AC1
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

    // Click 4索 waiting tile
    const waitTiles = page.locator('[role=button]');
    const cnt = await waitTiles.count();
    for (let i = 0; i < cnt; i++) {
      const text = await waitTiles.nth(i).textContent();
      if (text?.includes('4索')) {
        await waitTiles.nth(i).click();
        break;
      }
    }
    await page.waitForTimeout(300);

    const bodyWithRon = await page.locator('body').textContent();
    console.log('Ron state:', bodyWithRon?.substring(0, 800));
    
    // Extract ron score
    const ronScore = bodyWithRon?.match(/ロン点数([\d,]+)点/)?.[1];
    console.log('Ron score:', ronScore);

    // Click ツモ tab
    const tsumoBtns = page.locator('button').filter({ hasText: 'ツモ' });
    const tsumoCount = await tsumoBtns.count();
    console.log('Tsumo button count:', tsumoCount);
    
    if (tsumoCount > 0) {
      await tsumoBtns.first().click();
      await page.waitForTimeout(300);
      const bodyWithTsumo = await page.locator('body').textContent();
      const tsumoScore = bodyWithTsumo?.match(/ツモ点数.{0,50}|子\d+点・親\d+点|(\d+点)-(\d+点)/)?.[0];
      console.log('Tsumo score:', tsumoScore);
      console.log('Tsumo body:', bodyWithTsumo?.substring(0, 800));
      await page.screenshot({ path: '/tmp/sprint5-ac7-tsumo.png', fullPage: true });
    }
  });
});
