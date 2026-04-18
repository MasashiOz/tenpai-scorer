import { test, expect } from '@playwright/test';

test.describe('Sprint 5: 符計算と点数算出', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('ページが正常に読み込まれる', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    console.log('Page body preview:', bodyText?.substring(0, 300));
    await page.screenshot({ path: '/tmp/sprint5-initial.png' });
  });

  test('聴牌パネルと符内訳UIの確認', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    console.log('Full body text:', bodyText?.substring(0, 1000));
    await page.screenshot({ path: '/tmp/sprint5-full.png', fullPage: true });
  });
});
