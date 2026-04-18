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

test('3翻40符のツモ点数確認 (1300-2600=5200)', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // 3翻40符手牌を作る: 七対子(2) + 混一色(3) = 5翻 はちょっと多い
  // 3翻40符: タンヤオ(1) + 対々和(2) = 3翻, 40符
  // 2索×3 + 4索×3 + 6索×3 + 7索×2 = 11枚, wait on 7索単騎... need 13
  // Actually: 2萬×3 / 4萬×3 / 6萬×3 / 8萬×2 = 11枚 + 1索で wait... no
  // Let me make 3翻40符 specifically:
  // 2索×3(暗刻4符) + 4索×3(暗刻4符) + 6索×3(暗刻4符) + 2索は使えない（already 3）...
  // 2萬×3(中張明刻2符) + 4萬×3(中張明刻2符) + 6萬×3(中張明刻2符) + 8萬×2(単騎)
  // = 20+2+2+2+2+10(門前ロン) = 38 → 40符
  // 役: タンヤオ(1) + 対々和(2) = 3翻  
  // 子ロン: 40×2^5 = 1280 → 100切上 → 1300×4 → wait, that's ron
  // 子ロン3翻40符 = 1280×4 = 5120 → 5200点
  // 子ツモ3翻40符: 40×2^5 = 1280 → 子各1300, 親2600 → 5200点

  await clickPaletteTile(page, '2萬', 3);
  await clickPaletteTile(page, '4萬', 3);
  await clickPaletteTile(page, '6萬', 3);
  await clickPaletteTile(page, '8萬', 2);
  await clickPaletteTile(page, '9萬', 2);  // 8萬×2 + 9萬×2 = pair... need single tile wait
  
  // Actually: 2萬×3 + 4萬×3 + 6萬×3 + 8萬×2 = 11枚, need 2 more
  // + 5索×2 → 13枚 total, but 5索 is not tanyao and not chinitsu
  // Let me recalculate...
  // Just add 8萬×2 and 1 more tile for single wait
  // 2萬×3 + 4萬×3 + 6萬×3 + 8萬×2 + 9萬×1 = 13枚, wait = 9萬(single)? No, 8萬8萬9萬 = shuntsu wait on 7 or 10(impossible) = pencha wait (7萬 only)  
  // Actually 8萬8萬 = pair... 9萬 = single = danki (単騎) wait
  // But hand = 2萬×3/4萬×3/6萬×3/8萬×2/9萬×1 = 3+3+3+2+1 = 12... not 13
  // Let me check page
  const count = await page.locator('body').textContent();
  const tileCount = count?.match(/(\d+)\/14枚/)?.[1];
  console.log('Current tiles:', tileCount);
  
  const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
  const isEnabled = await tenpaiBtn.first().isEnabled();
  console.log('Tenpai enabled:', isEnabled);
  
  if (isEnabled) {
    await tenpaiBtn.click();
    await page.waitForTimeout(500);
    const result = await page.locator('body').textContent();
    console.log('Result:', result?.match(/待ち牌.{0,200}/)?.[0]);
    
    const waitTiles = page.locator('[role=button]');
    if (await waitTiles.count() > 0) {
      await waitTiles.first().click();
      await page.waitForTimeout(300);
      
      // Check ron
      const ronBody = await page.locator('body').textContent();
      const ronSection = ronBody?.match(/アガリ牌.{0,400}/)?.[0];
      console.log('Ron detail:', ronSection);
      const ronScore = ronBody?.match(/ロン点数([\d,]+)点/)?.[1];
      console.log('Ron score:', ronScore);
      
      // Switch to tsumo
      const tsumoBtn = page.locator('button').filter({ hasText: 'ツモ' });
      if (await tsumoBtn.count() > 0) {
        await tsumoBtn.click();
        await page.waitForTimeout(300);
        const tsumoBody = await page.locator('body').textContent();
        const tsumoSection = tsumoBody?.match(/アガリ牌.{0,400}/)?.[0];
        console.log('Tsumo detail:', tsumoSection);
        await page.screenshot({ path: '/tmp/sprint5-3han40fu-tsumo.png', fullPage: true });
      }
    }
  }
});
