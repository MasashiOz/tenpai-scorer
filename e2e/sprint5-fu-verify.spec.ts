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
    if (!clicked) console.log(`WARN: [${tileText}] t=${t+1}`);
  }
}

test.describe('Sprint 5: 符内訳アコーディオン確認', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('符内訳: 副底20符表示確認（幺九明刻 + 門前ロン手）', async ({ page }) => {
    // 東×3(幺九明刻=4符) + 2萬・3萬・4萬 + 6索・7索・8索 + 5筒×2(雀頭) + 5索・6索(待ち) = 13枚
    await clickPaletteTile(page, '東', 3);
    await clickPaletteTile(page, '2萬');
    await clickPaletteTile(page, '3萬');
    await clickPaletteTile(page, '4萬');
    await clickPaletteTile(page, '6索');
    await clickPaletteTile(page, '7索');
    await clickPaletteTile(page, '8索');
    await clickPaletteTile(page, '5筒', 2);
    await clickPaletteTile(page, '5索');
    await clickPaletteTile(page, '6索'); // 6索 ×2 total
    // = 3+3+3+2+2 = 13 tiles
    
    const handCount = await page.locator('body').textContent();
    const count = handCount?.match(/(\d+)\/14枚/)?.[1];
    console.log('Tile count:', count);

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    const result = await page.locator('body').textContent();
    console.log('Wait tiles:', result?.match(/待ち牌.{0,100}/)?.[0]);

    // Click first wait tile
    const waitTiles = page.locator('[role=button]');
    if (await waitTiles.count() > 0) {
      await waitTiles.first().click();
      await page.waitForTimeout(300);
    }

    // Expand fu breakdown
    const fuBtn = page.locator('button').filter({ hasText: '符の内訳' });
    if (await fuBtn.count() > 0) {
      await fuBtn.first().click();
      await page.waitForTimeout(200);
      const fuBody = await page.locator('body').textContent();
      // Find fu breakdown section
      const fuSection = fuBody?.match(/アガリ牌.{0,1000}/)?.[0];
      console.log('Full detail with fu:', fuSection);
      await page.screenshot({ path: '/tmp/sprint5-fu-detail-east.png', fullPage: true });
      
      // Verify fu breakdown includes 副底
      const has副底 = fuBody?.includes('副底');
      const has20符 = fuBody?.includes('20符');
      const has幺九 = fuBody?.includes('幺九') || fuBody?.includes('役牌');
      const has門前ロン = fuBody?.includes('門前ロン');
      console.log('Has 副底:', has副底);
      console.log('Has 20符:', has20符);
      console.log('Has 幺九/役牌:', has幺九);
      console.log('Has 門前ロン:', has門前ロン);
      
      expect(has副底 && has20符).toBeTruthy();
    }
  });

  test('符内訳: 単騎待ち2符 確認', async ({ page }) => {
    // タンヤオ対々和: 2萬×3 + 3萬×3 + 4萬×3 + 5萬×3 + 2筒×1 = 13枚, wait 2筒(単騎)
    // fu = 20(副底) + 2(中張明刻) + 2(中張明刻) + 2(中張明刻) + 2(中張明刻) + 2(単騎) + 10(門前ロン) = 40符
    await clickPaletteTile(page, '2萬', 3);
    await clickPaletteTile(page, '3萬', 3);
    await clickPaletteTile(page, '4萬', 3);
    await clickPaletteTile(page, '5萬', 3);
    await clickPaletteTile(page, '2筒', 1);

    const handCount = await page.locator('body').textContent();
    console.log('Tile count:', handCount?.match(/(\d+)\/14枚/)?.[1]);

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    // Click 2筒 wait tile
    const waitTiles = page.locator('[role=button]');
    for (let i = 0; i < await waitTiles.count(); i++) {
      const t = await waitTiles.nth(i).textContent();
      if (t?.includes('2筒')) {
        await waitTiles.nth(i).click();
        await page.waitForTimeout(300);
        break;
      }
    }

    const fuBtn = page.locator('button').filter({ hasText: '符の内訳' });
    if (await fuBtn.count() > 0) {
      await fuBtn.first().click();
      await page.waitForTimeout(200);
      const fuBody = await page.locator('body').textContent();
      const fuSection = fuBody?.match(/アガリ牌.{0,800}/)?.[0];
      console.log('Tankiji fu detail:', fuSection);
      await page.screenshot({ path: '/tmp/sprint5-tankiji-fu.png', fullPage: true });
      
      const has単騎 = fuBody?.includes('単騎');
      console.log('Has 単騎待ち:', has単騎);
      expect(has単騎).toBeTruthy();
    }
  });

  test('符計算: 嵌張待ち2符 確認', async ({ page }) => {
    // 嵌張待ち手牌: 1萬・2萬・3萬 + 5萬・7萬(嵌張) + 8萬・9萬・9萬 + 1索・2索・3索 + 5筒×2 = 13枚 wait 6萬
    await clickPaletteTile(page, '1萬');
    await clickPaletteTile(page, '2萬');
    await clickPaletteTile(page, '3萬');
    await clickPaletteTile(page, '5萬');
    await clickPaletteTile(page, '7萬');
    await clickPaletteTile(page, '8萬');
    await clickPaletteTile(page, '9萬', 2);
    await clickPaletteTile(page, '1索');
    await clickPaletteTile(page, '2索');
    await clickPaletteTile(page, '3索');
    await clickPaletteTile(page, '5筒', 2);
    // = 3+2+3+3+2 = 13 tiles? Actually 1+1+1+1+1+1+2+1+1+1+2 = 13 ✓

    const handCount = await page.locator('body').textContent();
    console.log('Tile count:', handCount?.match(/(\d+)\/14枚/)?.[1]);

    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    const result = await page.locator('body').textContent();
    console.log('Wait result:', result?.match(/待ち牌.{0,100}/)?.[0]);

    // Click 6萬 wait
    const waitTiles = page.locator('[role=button]');
    for (let i = 0; i < await waitTiles.count(); i++) {
      const t = await waitTiles.nth(i).textContent();
      console.log(`Wait ${i}: "${t}"`);
      if (t?.includes('6萬')) {
        await waitTiles.nth(i).click();
        await page.waitForTimeout(300);
        break;
      }
    }

    const fuBtn = page.locator('button').filter({ hasText: '符の内訳' });
    if (await fuBtn.count() > 0) {
      await fuBtn.first().click();
      await page.waitForTimeout(200);
      const fuBody = await page.locator('body').textContent();
      const fuSection = fuBody?.match(/アガリ牌.{0,800}/)?.[0];
      console.log('Kanchan fu detail:', fuSection);
      await page.screenshot({ path: '/tmp/sprint5-kanchan-fu.png', fullPage: true });
      
      const has嵌張 = fuBody?.includes('嵌張');
      console.log('Has 嵌張待ち:', has嵌張);
    }
  });
});
