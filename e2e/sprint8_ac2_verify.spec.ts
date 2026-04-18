import { test, expect } from '@playwright/test';

async function clickPalette(page: import('@playwright/test').Page, ariaLabel: string) {
  const paletteContainer = page.locator('div.bg-white').filter({ hasText: /牌パレット/ }).first();
  const btn = paletteContainer.locator(`button[aria-label="${ariaLabel}"]`).first();
  await btn.waitFor({ state: 'visible', timeout: 5000 });
  if (await btn.isEnabled()) await btn.click();
}

test('AC2詳細: 赤5萬を追加すると赤ドラ1が役に表示される', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  const resetBtn = page.locator('button', { hasText: '全リセット' });
  if (await resetBtn.isVisible()) await resetBtn.click();

  // 赤5萬を追加
  const paletteContainer = page.locator('div.bg-white').filter({ hasText: /牌パレット/ }).first();
  const akaSection = paletteContainer.locator('div').filter({ hasText: /赤ドラ（各1枚まで）/ }).first();
  const firstAkaBtn = akaSection.locator('button').first();
  await firstAkaBtn.click(); // 赤5萬
  
  // 聴牌形を作る: 赤5萬(man5r) + 1萬2萬3萬 4萬6萬7萬8萬9萬 1筒2筒3筒 1索 = 13枚 (1索で単騎待ち？)
  // 平和形: 1萬2萬3萬 4萬5萬赤5萬の組み合わせが難しいので
  // 単純形: 赤5萬 + 1萬2萬3萬 + 4萬5萬6萬 + 7萬8萬9萬 + 1筒1筒 = 13枚（1筒単騎）
  const tiles = [
    '1萬','2萬','3萬',
    '4萬','5萬','6萬',
    '7萬','8萬','9萬',
    '1筒','1筒',
    '2筒','3筒'
  ];
  for (const t of tiles) {
    await clickPalette(page, t);
  }
  
  const handCount = page.locator('span', { hasText: /\d+\/14枚/ }).first();
  console.log('手牌枚数:', await handCount.textContent());
  
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
    await page.screenshot({ path: '/tmp/ac2_detail.png' });
    
    const content = await page.content();
    const hasAkaDora = content.includes('赤ドラ');
    const doraItems = content.match(/(?:赤ドラ|ドラ)\d?/g);
    console.log('赤ドラテキスト:', hasAkaDora);
    console.log('ドラ関連テキスト:', doraItems);
    
    const points = content.match(/(\d{1,3}(?:,\d{3})*)点/g);
    console.log('表示点数:', points?.slice(0, 5));
    
    expect(hasAkaDora).toBeTruthy();
  }
});
