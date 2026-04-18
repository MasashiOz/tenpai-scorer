import { test, expect } from '@playwright/test';

test('国士無双詳細確認', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // 全リセット
  const resetBtn = page.locator('button', { hasText: '全リセット' });
  if (await resetBtn.isVisible()) await resetBtn.click();

  // 国士無双の13枚を追加
  const tiles = ['1萬','9萬','1筒','9筒','1索','9索','東','南','西','北','白','發','中'];
  for (const label of tiles) {
    const btn = page.locator(`button[aria-label="${label}"]`).first();
    await btn.waitFor({ state: 'visible', timeout: 5000 });
    if (await btn.isEnabled()) {
      await btn.click();
    }
  }

  // 聴牌判定
  const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
  await expect(tenpaiBtn).toBeEnabled({ timeout: 5000 });
  await tenpaiBtn.click();
  await page.waitForTimeout(500);

  // 結果エリア確認
  const resultAreaVisible = await page.locator('text=役・点数結果').isVisible();
  console.log('Result area visible:', resultAreaVisible);

  // テーブルの行（待ち牌）をクリック
  const waitRows = page.locator('table tbody tr');
  const rowCount = await waitRows.count();
  console.log('Wait tile rows:', rowCount);

  if (rowCount > 0) {
    await waitRows.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/kokushi_detail.png' });
    
    const content = await page.content();
    const has役満 = content.includes('役満');
    const has32000 = content.includes('32,000') || content.includes('32000');
    const has国士 = content.includes('国士無双');
    
    console.log('役満テキスト:', has役満);
    console.log('32000点:', has32000);
    console.log('国士無双:', has国士);
    
    // 点数を抽出
    const points = content.match(/(\d{1,3}(?:,\d{3})*)点/g);
    console.log('表示されている点数:', points?.slice(0, 10));
    
    expect(has役満).toBeTruthy();
    expect(has32000).toBeTruthy();
  }
});

test('四暗刻単騎詳細確認', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // 全リセット
  const resetBtn = page.locator('button', { hasText: '全リセット' });
  if (await resetBtn.isVisible()) await resetBtn.click();

  // 四暗刻単騎: 1萬×3 / 2筒×3 / 3索×3 / 北×3 / 5萬×1
  const tileSeq = [
    '1萬','1萬','1萬',
    '2筒','2筒','2筒',
    '3索','3索','3索',
    '北','北','北',
    '5萬'
  ];
  for (const label of tileSeq) {
    const btn = page.locator(`button[aria-label="${label}"]`).first();
    await btn.waitFor({ state: 'visible', timeout: 5000 });
    if (await btn.isEnabled()) {
      await btn.click();
    }
  }

  await page.screenshot({ path: '/tmp/suanko_hand.png' });
  const content1 = await page.content();
  const countMatch = content1.match(/(\d+)\/14枚/);
  console.log('Current hand count:', countMatch ? countMatch[1] : 'not found');

  const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
  const isEnabled = await tenpaiBtn.isEnabled();
  console.log('Tenpai button enabled:', isEnabled);

  if (isEnabled) {
    await tenpaiBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/suanko_result.png' });

    const waitRows = page.locator('table tbody tr');
    const rowCount = await waitRows.count();
    console.log('Wait tile rows:', rowCount);

    if (rowCount > 0) {
      await waitRows.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/suanko_detail.png' });

      const content = await page.content();
      const has四暗刻 = content.includes('四暗刻');
      const hasダブル = content.includes('ダブル役満');
      const has64000 = content.includes('64,000') || content.includes('64000');

      console.log('四暗刻テキスト:', has四暗刻);
      console.log('ダブル役満テキスト:', hasダブル);
      console.log('64000点:', has64000);
      
      const points = content.match(/(\d{1,3}(?:,\d{3})*)点/g);
      console.log('表示されている点数:', points?.slice(0, 10));
    }
  } else {
    const disabledReason = await page.locator('text=/ノーテン|必要|枚/').first().textContent();
    console.log('Disabled reason:', disabledReason);
  }
});
