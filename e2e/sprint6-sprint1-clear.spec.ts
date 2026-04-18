import { test, expect } from '@playwright/test';

test('Sprint 1: クリアボタンが正しく動作する', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Add tiles
  const allBtns = page.locator('button').filter({ hasText: /^1萬$/ });
  const first = allBtns.first();
  await first.click();
  await page.waitForTimeout(100);

  const countText = await page.locator('text=/\\d+\\/14枚/').first().textContent().catch(() => '');
  console.log('After adding 1m:', countText);
  expect(countText).toContain('1/14');

  // Click clear
  const clearBtn = page.locator('button').filter({ hasText: /^クリア$/ }).first();
  const isEnabled = await clearBtn.isEnabled();
  console.log('Clear button enabled:', isEnabled);
  expect(isEnabled).toBe(true);

  await clearBtn.click();
  await page.waitForTimeout(200);

  const countAfter = await page.locator('text=/0\\/14枚/').count();
  console.log('0/14 found after clear:', countAfter);

  // Hand should be empty - placeholder text visible
  const placeholder = page.locator('text=パレットから牌を選んでください');
  const placeholderVisible = await placeholder.isVisible().catch(() => false);
  console.log('Empty placeholder visible:', placeholderVisible);

  // At minimum, count should show 0 or placeholder
  const isHandEmpty = countAfter > 0 || placeholderVisible;
  expect(isHandEmpty).toBe(true);
  console.log('Sprint 1 clear PASS');

  await page.screenshot({ path: '/tmp/s6-sprint1-clear.png' });

  // Test 14 tile limit
  for (let i = 0; i < 14; i++) {
    const anyBtn = page.locator('button').filter({ hasText: /^[1-9][萬筒索]$/ }).first();
    if (!await anyBtn.isDisabled()) {
      await anyBtn.click();
      await page.waitForTimeout(30);
    }
  }

  const count14 = await page.locator('text=/14\\/14枚/').count();
  console.log('14/14 found:', count14);
  await page.screenshot({ path: '/tmp/s6-sprint1-14tiles.png' });
});
