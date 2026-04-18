import { test, expect } from '@playwright/test';

async function clickPalette(page: import('@playwright/test').Page, ariaLabel: string) {
  const paletteContainer = page.locator('div.bg-white').filter({ hasText: /牌パレット/ }).first();
  const btn = paletteContainer.locator(`button[aria-label="${ariaLabel}"]`).first();
  await btn.waitFor({ state: 'visible', timeout: 5000 });
  if (await btn.isEnabled()) await btn.click();
}

test('AC6 UIテスト: 数え役満', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  const resetBtn = page.locator('button', { hasText: '全リセット' });
  if (await resetBtn.isVisible()) await resetBtn.click();

  // 状況パネル
  const situationPanel = page.locator('div.bg-white').filter({ hasText: /状況設定/ }).first();

  // リーチON (1翻)
  const riichiBtn = situationPanel.locator('button', { hasText: /^リーチ$/ }).first();
  if (await riichiBtn.isEnabled()) await riichiBtn.click();
  
  // 一発ON (1翻)
  const ippatsuBtn = situationPanel.locator('button', { hasText: /^一発$/ }).first();
  if (await ippatsuBtn.isEnabled()) await ippatsuBtn.click();
  
  // ドラ表示牌「4萬」×5（実ドラ=5萬が5翻分）
  for (let i = 0; i < 5; i++) {
    const addDoraBtn = page.locator('button', { hasText: /ドラ表示牌を追加/ }).first();
    if (await addDoraBtn.isVisible()) {
      await addDoraBtn.click();
      await page.waitForTimeout(200);
      // ドラ選択パレットから4萬を選択
      const man4Btn = situationPanel.locator('button[aria-label="4萬"]').first();
      if (await man4Btn.isVisible()) {
        await man4Btn.click();
      } else {
        // フルページから探す（ドラピッカーが開いたとき）
        const man4BtnFull = page.locator('button[aria-label="4萬"]').nth(1);
        if (await man4BtnFull.isVisible()) await man4BtnFull.click();
      }
    }
  }

  // 裏ドラ表示牌「4萬」×4（裏ドラ=5萬が4翻分、もし手牌に5萬がある場合）
  for (let i = 0; i < 4; i++) {
    const addUraBtn = page.locator('button', { hasText: /裏ドラ表示牌を追加/ }).first();
    if (await addUraBtn.isVisible()) {
      await addUraBtn.click();
      await page.waitForTimeout(200);
      const man4Btn = situationPanel.locator('button[aria-label="4萬"]').first();
      if (await man4Btn.isVisible()) {
        await man4Btn.click();
      }
    }
  }
  
  await page.screenshot({ path: '/tmp/ac6_ui_dora.png' });

  // 清一色テンパイ形（5萬が4枚含む手牌）
  // リーチ(1) + 一発(1) + 清一色(6) + ドラ5(5萬×4+1でも良いが最大4枚) = 13翻以上
  // 5萬×4（ドラ各5翻）含む清一色: 1萬2萬3萬 4萬 5萬×4 6萬7萬8萬 = 12枚（あと1枚）
  const tiles = [
    '1萬','2萬','3萬',
    '4萬',
    '5萬','5萬','5萬','5萬',
    '6萬','7萬','8萬',
    '9萬','9萬'
  ];
  for (const t of tiles) {
    await clickPalette(page, t);
  }
  
  const handCount = page.locator('span', { hasText: /\d+\/14枚/ }).first();
  console.log('手牌枚数:', await handCount.textContent());
  
  await page.screenshot({ path: '/tmp/ac6_ui_hand.png' });

  const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
  const isEnabled = await tenpaiBtn.isEnabled();
  console.log('聴牌ボタン有効:', isEnabled);
  
  if (isEnabled) {
    await tenpaiBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/ac6_ui_result.png' });

    // 待ち牌をクリック
    const waitRows = page.locator('table tbody tr');
    const rowCount = await waitRows.count();
    console.log('待ち牌行数:', rowCount);
    
    if (rowCount > 0) {
      await waitRows.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/ac6_ui_detail.png' });
      
      const content = await page.content();
      const totalHan = content.match(/合計\s*(\d+)翻/);
      const hasCountYakuman = content.includes('数え役満');
      const has32000 = content.includes('32,000') || content.includes('32000');
      
      console.log('合計翻数:', totalHan?.[0]);
      console.log('数え役満テキスト:', hasCountYakuman);
      console.log('32000点:', has32000);
      
      const points = content.match(/(\d{1,3}(?:,\d{3})*)点/g);
      console.log('表示点数:', points?.slice(0, 5));
      
      expect(hasCountYakuman || has32000).toBeTruthy();
    }
  }
});
