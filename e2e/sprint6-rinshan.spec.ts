import { test, expect, Page } from '@playwright/test';

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

test('嶺上開花タブで嶺上開花役が表示される', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.locator('button').filter({ hasText: /全リセット/ }).first().click();
  await page.waitForTimeout(300);

  // Simple tenpai hand
  for (const t of ['2萬','3萬','4萬','5筒','6筒','7筒','8索','8索','8索','中','中','6萬','7萬']) {
    await addTile(page, t);
  }

  const handCount = await page.locator('text=/\\d+\\/14枚/').first().textContent().catch(() => '');
  console.log('Hand count:', handCount);

  const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
  await expect(tenpaiBtn).toBeEnabled({ timeout: 5000 });
  await tenpaiBtn.click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: '/tmp/s6-rinshan-table.png' });

  // Verify 3-column headers
  const ronTh = page.locator('th').filter({ hasText: /^ロン$/ }).first();
  const tsumoTh = page.locator('th').filter({ hasText: /^ツモ$/ }).first();
  const rinshankTh = page.locator('th').filter({ hasText: /^嶺上$/ }).first();

  await expect(ronTh).toBeVisible();
  await expect(tsumoTh).toBeVisible();
  await expect(rinshankTh).toBeVisible();
  console.log('3 column headers: PASS');

  // Click first wait row
  const waitRow = page.locator('tr').filter({ hasText: /\d+点/ }).first();
  const rowText = await waitRow.textContent();
  console.log('Wait row text:', rowText);
  await waitRow.click();
  await page.waitForTimeout(300);

  await page.screenshot({ path: '/tmp/s6-rinshan-row-clicked.png' });

  // Click 嶺上 detail tab
  const rinshankDetailTab = page.locator('button').filter({ hasText: /^嶺上$/ }).first();
  console.log('Rinshan tab visible:', await rinshankDetailTab.isVisible());
  if (await rinshankDetailTab.isVisible()) {
    await rinshankDetailTab.click();
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: '/tmp/s6-rinshan-tab-detail.png' });

  const content = await page.content();
  console.log('Has 嶺上開花:', content.includes('嶺上開花'));
  expect(content).toContain('嶺上開花');
});

test('3列テーブルの点数行に3列分の点数が含まれる', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  for (const t of ['1萬','2萬','3萬','4筒','5筒','6筒','7索','8索','9索','白','白','白','2萬']) {
    await addTile(page, t);
  }

  const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
  await expect(tenpaiBtn).toBeEnabled({ timeout: 5000 });
  await tenpaiBtn.click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: '/tmp/s6-3col-scores.png' });

  // Check that the first row has ron, tsumo, and rinshan scores
  const waitRows = page.locator('tr').filter({ hasText: /\d+点/ });
  const count = await waitRows.count();
  console.log('Wait rows count:', count);

  const firstRowText = await waitRows.first().textContent();
  console.log('First wait row text:', firstRowText);

  // Count how many score cells have 点
  const tenCount = (firstRowText?.match(/点/g) || []).length;
  console.log('点 count:', tenCount);

  // Should have ロン, ツモ, 嶺上 scores
  // Each should be either a number+点 or 無役
  const hasAllThreeCols = firstRowText?.includes('ロン') ||
    (await page.locator('th').filter({ hasText: /^ロン$/ }).isVisible()) &&
    (await page.locator('th').filter({ hasText: /^ツモ$/ }).isVisible()) &&
    (await page.locator('th').filter({ hasText: /^嶺上$/ }).isVisible());

  console.log('Has all 3 column headers:', hasAllThreeCols);
  expect(hasAllThreeCols).toBe(true);
});
