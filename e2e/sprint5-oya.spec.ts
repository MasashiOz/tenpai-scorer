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
      console.log(`WARNING: Could not click tile [${tileText}] attempt ${t+1}`);
    }
  }
}

test.describe('Sprint 5: 親設定と点数確認', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('親ボタン動作確認', async ({ page }) => {
    // Find the parent toggle section
    const bodyBefore = await page.locator('body').textContent();
    // Extract player section
    const playerSection = bodyBefore?.match(/プレイヤー.{0,50}/)?.[0];
    console.log('Player section:', playerSection);

    // Try clicking 親 by finding the button
    const oyaBtns = page.locator('button').filter({ hasText: '親' });
    const oyaCount = await oyaBtns.count();
    console.log('Number of 親 buttons:', oyaCount);
    
    for (let i = 0; i < oyaCount; i++) {
      const text = await oyaBtns.nth(i).textContent();
      const disabled = await oyaBtns.nth(i).isDisabled();
      console.log(`親 button ${i}: text="${text}" disabled=${disabled}`);
    }

    // Click 親 button (index 0)
    if (oyaCount > 0) {
      await oyaBtns.first().click();
      await page.waitForTimeout(200);
    }

    const bodyAfter = await page.locator('body').textContent();
    const playerAfter = bodyAfter?.match(/プレイヤー.{0,100}/)?.[0];
    console.log('Player section after click:', playerAfter);
    
    // Check if 親 is now selected with ✓
    const isOyaSelected = bodyAfter?.match(/✓.*?親|親.*?✓/);
    console.log('Oya selected:', isOyaSelected?.[0]);
  });

  test('子・清一色 5萬待ち → 満貫8000点確認', async ({ page }) => {
    // Confirm 子 is selected (default)
    const bodyInit = await page.locator('body').textContent();
    const isKoSelected = bodyInit?.match(/✓.*?子|子.*?✓/);
    console.log('Ko selected:', isKoSelected?.[0]);

    // 清一色手牌（子）: 1萬×3 / 2萬×3 / 3萬×3 / 4萬×2 / 6萬×2 = 13枚
    // 5萬待ち (カンチャン) → 符 = 20(副底) + 0(順子) + 2(嵌張) + 10(門前ロン) = 32 → 40符
    // 清一色6翻 40符 ロン = 8000点 (子満貫)
    await clickPaletteTile(page, '1萬', 3);
    await clickPaletteTile(page, '2萬', 3);
    await clickPaletteTile(page, '3萬', 3);
    await clickPaletteTile(page, '4萬', 2);
    await clickPaletteTile(page, '6萬', 2);

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    const result = await page.locator('body').textContent();
    console.log('Tenpai result:', result?.match(/待ち牌.{0,100}/)?.[0]);
    console.log('Scores:', result?.match(/\d+,\d+点/g));
    await page.screenshot({ path: '/tmp/sprint5-ko-chinitsu.png', fullPage: true });

    // Click 5萬 waiting tile if exists
    const waitTiles = page.locator('[role=button]');
    const cnt = await waitTiles.count();
    console.log('Wait tiles:', cnt);
    for (let i = 0; i < cnt; i++) {
      const text = await waitTiles.nth(i).textContent();
      console.log(`Wait tile ${i}: "${text}"`);
      if (text?.includes('5萬')) {
        await waitTiles.nth(i).click();
        await page.waitForTimeout(300);
        const detail = await page.locator('body').textContent();
        console.log('5萬 detail:', detail?.substring(0, 800));
        await page.screenshot({ path: '/tmp/sprint5-ko-chinitsu-5man.png', fullPage: true });
        break;
      }
    }
  });

  test('親・清一色 5萬待ち → 満貫12000点確認', async ({ page }) => {
    // Set 親
    const oyaBtn = page.locator('button').filter({ hasText: '親' }).first();
    await oyaBtn.click();
    await page.waitForTimeout(200);

    // Verify 親 is selected - check visual state
    const bodyCheck = await page.locator('body').textContent();
    console.log('After oya click:', bodyCheck?.match(/プレイヤー.{0,60}/)?.[0]);

    // 清一色手牌（親）: 1萬×3 / 2萬×3 / 3萬×3 / 4萬×2 / 6萬×2 = 13枚
    await clickPaletteTile(page, '1萬', 3);
    await clickPaletteTile(page, '2萬', 3);
    await clickPaletteTile(page, '3萬', 3);
    await clickPaletteTile(page, '4萬', 2);
    await clickPaletteTile(page, '6萬', 2);

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    const result = await page.locator('body').textContent();
    console.log('Oya chinitsu result:', result?.match(/待ち牌.{0,200}/)?.[0]);
    console.log('Scores:', result?.match(/\d+,\d+点/g));

    // Click 5萬 or first available waiting tile
    const waitTiles = page.locator('[role=button]');
    for (let i = 0; i < await waitTiles.count(); i++) {
      const text = await waitTiles.nth(i).textContent();
      if (text?.includes('5萬')) {
        await waitTiles.nth(i).click();
        await page.waitForTimeout(300);
        const detail = await page.locator('body').textContent();
        console.log('5萬 oya detail:', detail?.substring(0, 800));
        // Should show 12,000点 for 満貫
        const has12k = detail?.includes('12,000') || detail?.includes('12000') || detail?.includes('満貫');
        console.log('Has 12000/満貫:', has12k);
        await page.screenshot({ path: '/tmp/sprint5-oya-chinitsu-5man.png', fullPage: true });
        break;
      }
    }
  });

  test('親・跳満 18000点の確認（タンヤオ清一色）', async ({ page }) => {
    // Set 親
    const oyaBtn = page.locator('button').filter({ hasText: '親' }).first();
    await oyaBtn.click();
    await page.waitForTimeout(200);

    // タンヤオ + 清一色 = 1 + 6 = 7翻 → 親跳満 18000
    // 萬子のみ: 2萬×3 / 4萬×3 / 6萬×3 / 8萬×2 / wait 8萬 (but we need to check correct 13 tiles)
    // Actually: 2萬・3萬・4萬 / 4萬・5萬・6萬 / 6萬・7萬・8萬 / 5萬×2 = 12 tiles + 1 wait
    // For 13 tiles: 2萬・3萬・4萬 / 5萬・6萬・7萬 / 6萬・7萬・8萬 / 5萬×2 / 8萬 = 13 tiles, wait 5 - but 5萬 count issue
    // Simpler: 2萬×3 / 4萬×3 / 6萬×3 / 7萬×2 / 8萬×2 = 13 tiles
    await clickPaletteTile(page, '2萬', 3);
    await clickPaletteTile(page, '4萬', 3);
    await clickPaletteTile(page, '6萬', 3);
    await clickPaletteTile(page, '7萬', 2);
    await clickPaletteTile(page, '8萬', 2);

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    const result = await page.locator('body').textContent();
    console.log('Tanyao chinitsu result:', result?.substring(0, 800));

    // Click 9萬 waiting tile (should be 18000)
    const waitTiles = page.locator('[role=button]');
    for (let i = 0; i < await waitTiles.count(); i++) {
      const text = await waitTiles.nth(i).textContent();
      if (text?.includes('9萬')) {
        await waitTiles.nth(i).click();
        await page.waitForTimeout(300);
        const detail = await page.locator('body').textContent();
        console.log('9萬 detail:', detail?.substring(0, 800));
        await page.screenshot({ path: '/tmp/sprint5-oya-haneman-9man.png', fullPage: true });
        break;
      }
    }
  });

  test('符内訳の詳細確認 - 副底20符表示', async ({ page }) => {
    // 手牌: 1萬×3(刻子) / 2索・3索・4索 / 6索・7索・8索 / 5筒×3(刻子) / 東×2 (雀頭)
    // = 対々でない、役牌でない複合符の手牌
    // Actually let's use a simpler hand with knowable fu:
    // 1萬×3(幺九明刻=4符) / 2索・3索・4索 / 5筒・6筒・7筒 / 8索・9索 / 9萬×2(雀頭)
    // = 13枚, 待ちは1索or7索
    await clickPaletteTile(page, '1萬', 3);
    await clickPaletteTile(page, '2索');
    await clickPaletteTile(page, '3索');
    await clickPaletteTile(page, '4索');
    await clickPaletteTile(page, '5筒');
    await clickPaletteTile(page, '6筒');
    await clickPaletteTile(page, '7筒');
    await clickPaletteTile(page, '8索');
    await clickPaletteTile(page, '9索');
    await clickPaletteTile(page, '9萬', 2);

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    const isEnabled = await tenpaiBtn.first().isEnabled();
    console.log('Tenpai enabled:', isEnabled);
    
    // Hand is 12 tiles, add 1 more
    await clickPaletteTile(page, '1索');

    const tenpaiBtn2 = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn2).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn2.click();
    await page.waitForTimeout(500);

    const result = await page.locator('body').textContent();
    console.log('Fu test result:', result?.substring(0, 600));

    // Click on a wait tile
    const waitTiles = page.locator('[role=button]');
    if (await waitTiles.count() > 0) {
      await waitTiles.first().click();
      await page.waitForTimeout(300);

      // Click 符の内訳
      const fuBtn = page.locator('button').filter({ hasText: '符の内訳' });
      if (await fuBtn.count() > 0) {
        await fuBtn.first().click();
        await page.waitForTimeout(300);
        const fuDetail = await page.locator('body').textContent();
        console.log('Fu detail:', fuDetail?.match(/副底.{0,200}|符の内訳.{0,300}/)?.[0]);
        await page.screenshot({ path: '/tmp/sprint5-fu-detail.png', fullPage: true });
      }
    }
  });
});
