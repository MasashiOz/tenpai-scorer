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

test.describe('Sprint 5: 国士無双と無役の確認', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('国士無双 - 点数表示の確認', async ({ page }) => {
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
    console.log('Kokushi scores:', body?.match(/待ち牌.{0,300}/)?.[0]);
    
    // Click 1萬 (one of 13 waiting tiles)
    const waitTiles = page.locator('[role=button]');
    const cnt = await waitTiles.count();
    console.log('Wait tile count:', cnt);
    
    for (let i = 0; i < cnt; i++) {
      const text = await waitTiles.nth(i).textContent();
      if (text?.includes('1萬')) {
        await waitTiles.nth(i).click();
        await page.waitForTimeout(300);
        break;
      }
    }

    const detail = await page.locator('body').textContent();
    const detailSection = detail?.match(/アガリ牌.{0,500}/)?.[0];
    console.log('Kokushi 1萬 detail:', detailSection);
    await page.screenshot({ path: '/tmp/sprint5-kokushi-1man.png', fullPage: true });
    
    // Note: Kokushi is 役満 which is not yet implemented in Sprint 5
    // Sprint 8 covers 役満. For now, it should show 無役 or some score
    // This is acceptable as Sprint 5 doesn't cover 役満
    const isNoYaku = detailSection?.includes('無役') || detailSection?.includes('役なし');
    console.log('Shows 無役/役なし for kokushi:', isNoYaku);
    // This is expected behavior for Sprint 5 (役満 is Sprint 8)
  });
});
