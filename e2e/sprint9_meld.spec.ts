import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Sprint7 副露確認', () => {

  test('副露パネルのボタン確認', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Reset first
    const resetBtn = page.locator('button').filter({ hasText: '全リセット' }).first();
    await resetBtn.click();
    await page.waitForTimeout(200);

    // Add a few tiles first (副露は手牌がある程度ないと追加できない可能性がある)
    // Add 3 tiles
    await page.locator('button').filter({ hasText: /^1萬$/ }).first().click();
    await page.locator('button').filter({ hasText: /^2萬$/ }).first().click();
    await page.locator('button').filter({ hasText: /^3萬$/ }).first().click();
    await page.waitForTimeout(200);

    // Take screenshot
    await page.screenshot({ path: '/tmp/sprint9_meld_with_tiles.png', fullPage: true });

    // Get full page text after adding tiles
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('Full text with tiles:', pageText.substring(0, 3000));

    // Check for meld buttons
    console.log('Has ポン:', pageText.includes('ポン'));
    console.log('Has チー:', pageText.includes('チー'));

    // Get all button texts
    const allBtnTexts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim() || '');
    });
    console.log('All buttons:', allBtnTexts.join(' | '));
  });

  test('副露パネル - MeldPanel コンポーネント直接探索', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Get HTML of the page to find meld panel
    const meldSection = await page.evaluate(() => {
      // Find section containing 副露
      const allElements = Array.from(document.querySelectorAll('*'));
      const meldEl = allElements.find(el =>
        el.textContent?.includes('副露') &&
        el.children.length > 0
      );
      if (meldEl) {
        return meldEl.innerHTML.substring(0, 2000);
      }
      return 'Not found';
    });
    console.log('Meld section HTML:', meldSection.substring(0, 1000));

    // Check if the MeldPanel has ポン button - maybe it needs more tiles
    // Check the MeldPanel.tsx implementation to understand the UI
    await page.screenshot({ path: '/tmp/sprint9_meld_investigate.png', fullPage: true });

    // The page text showed "手牌が満杯のため副露を追加できません" - maybe initially it shows buttons
    // Let's check without any tiles - from the first run, it showed "副露なし（門前）"
    const rawPageText = await page.evaluate(() => document.body.innerText);
    console.log('Raw page text (副露 section):', rawPageText.match(/副露[\s\S]{0,500}/)?.[0]);
  });
});
