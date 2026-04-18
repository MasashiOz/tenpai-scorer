import { test, expect } from '@playwright/test';

// パレットエリア内のボタンだけをクリックするヘルパー
async function clickPalette(page: import('@playwright/test').Page, ariaLabel: string) {
  // 牌パレットのセクション内で aria-label を探す
  const paletteSection = page.locator('div').filter({ hasText: /^牌パレット$/ }).first();
  // パレットセクション内のボタン（h2直後の子要素）
  // 「牌パレット」ヘッダーを持つdivを探す
  const paletteContainer = page.locator('div.bg-white').filter({ hasText: /牌パレット/ }).first();
  const btn = paletteContainer.locator(`button[aria-label="${ariaLabel}"]`).first();
  await btn.waitFor({ state: 'visible', timeout: 5000 });
  if (await btn.isEnabled()) {
    await btn.click();
  }
}

test('四暗刻単騎 - パレット限定セレクター', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  const resetBtn = page.locator('button', { hasText: '全リセット' });
  if (await resetBtn.isVisible()) await resetBtn.click();

  // 四暗刻単騎: 1萬×3 / 2筒×3 / 3索×3 / 北×3 / 5萬×1
  const tilesToAdd = [
    '1萬','1萬','1萬',
    '2筒','2筒','2筒',
    '3索','3索','3索',
    '北','北','北',
    '5萬'
  ];
  for (const label of tilesToAdd) {
    await clickPalette(page, label);
  }
  
  await page.screenshot({ path: '/tmp/suanko_correct_hand.png' });
  
  // 手牌枚数確認
  const handCount = page.locator('span', { hasText: /\d+\/14枚/ }).first();
  const countText = await handCount.textContent();
  console.log('手牌枚数:', countText);
  
  const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
  const isEnabled = await tenpaiBtn.isEnabled();
  console.log('聴牌ボタン有効:', isEnabled);
  
  if (isEnabled) {
    await tenpaiBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/suanko_correct_result.png' });
    
    const waitRows = page.locator('table tbody tr');
    const rowCount = await waitRows.count();
    console.log('待ち牌行数:', rowCount);
    
    if (rowCount > 0) {
      await waitRows.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/suanko_correct_detail.png' });
      
      const content = await page.content();
      console.log('四暗刻:', content.includes('四暗刻'));
      console.log('ダブル役満:', content.includes('ダブル役満'));
      const points = content.match(/(\d{1,3}(?:,\d{3})*)点/g);
      console.log('点数:', points?.slice(0, 5));
    }
  } else {
    // 理由確認
    const content = await page.content();
    const tenpaiSection = content.match(/聴牌判定[^<]*<[^>]*>[^<]*/)?.[0];
    console.log('テンパイボタン周辺:', tenpaiSection);
    
    // 手牌カウントを再確認
    const count = content.match(/(\d+)\/14枚/);
    console.log('手牌カウント(正規表現):', count?.[0]);
  }
});

test('国士無双 - パレット限定セレクター（単騎形）', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  const resetBtn = page.locator('button', { hasText: '全リセット' });
  if (await resetBtn.isVisible()) await resetBtn.click();

  // 国士無双単騎形: 幺九牌12種 + 1萬×2（1萬が対子で単騎待ちは別の幺九牌）
  // 1萬×2, 9萬, 1筒, 9筒, 1索, 9索, 東, 南, 西, 北, 白, 發 = 13枚（中で単騎）
  const tilesToAdd = [
    '1萬','1萬',
    '9萬','1筒','9筒','1索','9索',
    '東','南','西','北','白','發'
  ];
  for (const label of tilesToAdd) {
    await clickPalette(page, label);
  }
  
  const handCount = page.locator('span', { hasText: /\d+\/14枚/ }).first();
  const countText = await handCount.textContent();
  console.log('手牌枚数:', countText);
  
  const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
  const isEnabled = await tenpaiBtn.isEnabled();
  console.log('聴牌ボタン有効:', isEnabled);
  
  if (isEnabled) {
    await tenpaiBtn.click();
    await page.waitForTimeout(500);
    
    const waitRows = page.locator('table tbody tr');
    const rowCount = await waitRows.count();
    console.log('待ち牌行数:', rowCount);
    
    await waitRows.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/kokushi_tanki_detail.png' });
    
    const content = await page.content();
    console.log('国士無双:', content.includes('国士無双'));
    console.log('32000:', content.includes('32,000') || content.includes('32000'));
    const points = content.match(/(\d{1,3}(?:,\d{3})*)点/g);
    console.log('点数:', points?.slice(0, 5));
  }
});
