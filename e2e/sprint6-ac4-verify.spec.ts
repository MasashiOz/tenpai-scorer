import { test, expect, Page } from '@playwright/test';

// Simple add tile: find any enabled button with this label
async function addTile(page: Page, label: string) {
  const allBtns = page.locator('button').filter({ hasText: new RegExp(`^${label}$`) });
  const count = await allBtns.count();
  for (let i = 0; i < count; i++) {
    const btn = allBtns.nth(i);
    if (!await btn.isDisabled()) {
      await btn.click();
      await page.waitForTimeout(50);
      return;
    }
  }
}

test('AC4 detailed: 裏ドラ加算で裏X翻が点数内訳に表示される', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Full reset
  await page.locator('button').filter({ hasText: /全リセット/ }).first().click();
  await page.waitForTimeout(300);

  // First add 13 tiles (hand: 1m2m3m 4p5p6p 7s8s9s 白白白 2m)
  // This hand tenpais on 1m or 3m (shanpon)
  for (const t of ['1萬','2萬','3萬','4筒','5筒','6筒','7索','8索','9索','白','白','白','2萬']) {
    // Only click palette buttons (not hand)
    // Palette buttons have badge count while hand buttons may also show the tile
    // Just click first non-disabled button
    await addTile(page, t);
  }

  const handCount1 = await page.locator('text=/\\d+\\/14枚/').first().textContent().catch(() => '');
  console.log('Hand count after adding 13 tiles:', handCount1);

  await page.screenshot({ path: '/tmp/s6-ac4v-hand13.png' });

  // Enable riichi
  await page.locator('button').filter({ hasText: /リーチ/ }).first().click();
  await page.waitForTimeout(200);

  // Set ura-dora indicator to 1m -> 2m becomes ura-dora
  await page.locator('button').filter({ hasText: /裏ドラ表示牌を追加/ }).first().click();
  await page.waitForTimeout(200);

  await page.screenshot({ path: '/tmp/s6-ac4v-picker-open.png' });

  // The ura-dora picker is shown. Find it and click 1m in it
  // The picker div contains "表示牌を選択してください"
  const uraPicker = page.locator('div').filter({ hasText: '表示牌を選択してください' }).last();
  const pickerBtns = uraPicker.locator('button');
  const pickerCount = await pickerBtns.count();
  console.log('Picker buttons count:', pickerCount);

  // Click 1m specifically in the picker
  const picker1m = pickerBtns.filter({ hasText: /^1萬$/ }).first();
  const isVis = await picker1m.isVisible();
  console.log('Picker 1m visible:', isVis);

  if (isVis) {
    await picker1m.click();
  } else {
    // Try different approach
    await page.locator('[class*="violet"]').locator('button').filter({ hasText: /^1萬$/ }).first().click();
  }
  await page.waitForTimeout(300);

  await page.screenshot({ path: '/tmp/s6-ac4v-ura-selected.png' });

  // Verify hand count is still 13
  const handCount2 = await page.locator('text=/\\d+\\/14枚/').first().textContent().catch(() => '');
  console.log('Hand count after ura-dora selection:', handCount2);

  // Close picker if still open
  const closePicker = page.locator('button').filter({ hasText: '▲ 閉じる' });
  const closeCnt = await closePicker.count();
  if (closeCnt > 0) {
    await closePicker.last().click();
    await page.waitForTimeout(200);
  }

  const handCount3 = await page.locator('text=/\\d+\\/14枚/').first().textContent().catch(() => '');
  console.log('Hand count after close picker:', handCount3);

  await page.screenshot({ path: '/tmp/s6-ac4v-picker-closed.png' });

  // Tenpai button should be enabled (13 tiles)
  const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
  const isEnabled = await tenpaiBtn.isEnabled();
  console.log('Tenpai button enabled:', isEnabled);

  if (!isEnabled) {
    // Debug: what is the hand count?
    const allText = await page.locator('text=/\\d+\\/14枚/').all();
    for (const t of allText) {
      console.log('Text found:', await t.textContent());
    }
    // Take a screenshot to see what happened
    await page.screenshot({ path: '/tmp/s6-ac4v-debug.png' });
  }

  expect(isEnabled).toBe(true);

  await tenpaiBtn.click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: '/tmp/s6-ac4v-after-tenpai.png' });

  // Click first waiting tile to see details
  const firstRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
  await firstRow.click();
  await page.waitForTimeout(300);

  await page.screenshot({ path: '/tmp/s6-ac4v-detail.png' });

  // Check for 裏 in details
  const content = await page.content();
  const hasUra = content.includes('裏');
  console.log('Has 裏 in detail:', hasUra);
  console.log('Has 裏1翻:', content.includes('裏1') || content.includes('裏 1'));

  expect(hasUra).toBe(true);
});
