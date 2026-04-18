import { test, expect } from '@playwright/test';

test('四暗刻単騎デバッグ', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  const resetBtn = page.locator('button', { hasText: '全リセット' });
  if (await resetBtn.isVisible()) await resetBtn.click();

  // 手牌を1枚ずつ追加して状態確認
  const tilesToAdd = [
    '1萬','1萬','1萬',
    '2筒','2筒','2筒',
    '3索','3索','3索',
    '北','北','北',
  ];
  
  for (const label of tilesToAdd) {
    const btn = page.locator(`button[aria-label="${label}"]`).first();
    if (await btn.isEnabled()) await btn.click();
  }

  // 現在の手牌枚数
  await page.screenshot({ path: '/tmp/suanko_12tiles.png' });
  const content1 = await page.content();
  const match1 = content1.match(/(\d+)\/14枚/);
  console.log('12枚追加後:', match1 ? match1[0] : 'not found');
  
  // 13枚目（5萬）を追加
  const man5 = page.locator(`button[aria-label="5萬"]`).first();
  if (await man5.isEnabled()) await man5.click();

  await page.screenshot({ path: '/tmp/suanko_13tiles.png' });
  const content2 = await page.content();
  const match2 = content2.match(/(\d+)\/14枚/);
  console.log('13枚追加後:', match2 ? match2[0] : 'not found');
  
  // 聴牌ボタンの状態確認
  const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
  const isEnabled = await tenpaiBtn.isEnabled();
  console.log('聴牌ボタン有効:', isEnabled);
  
  // 無効な場合の理由
  const reasonEl = page.locator('text=/ノーテン|必要|枚|ノーテン/').first();
  if (await reasonEl.isVisible()) {
    console.log('理由:', await reasonEl.textContent());
  }
  
  if (isEnabled) {
    await tenpaiBtn.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: '/tmp/suanko_tenpai.png' });
    const content3 = await page.content();
    console.log('テンパイ結果contains聴牌:', content3.includes('聴牌'));
    console.log('待ち牌:', content3.includes('待ち'));
  }
});
