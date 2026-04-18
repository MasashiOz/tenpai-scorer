import { test, expect, Page } from '@playwright/test';

// Helper: click a tile in the palette by its display text
async function clickPaletteTile(page: Page, label: string, times: number = 1) {
  // Find button in palette that contains the label text
  const buttons = page.locator('button').filter({ hasText: label });
  // Prefer buttons that are NOT in the hand area (use palette section)
  for (let i = 0; i < times; i++) {
    await buttons.first().click();
  }
}

test.describe('Sprint 4: 役判定エンジン', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    // Clear hand
    const clearBtn = page.locator('button', { hasText: 'クリア' }).first();
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    }
  });

  test('AC1: 平和形アガリで「平和」役が検出される', async ({ page }) => {
    await page.screenshot({ path: '/tmp/sprint4-before-pinfu.png' });
    // Hand: 2m3m4m 4p5p6p 6s7s8s 2s3s4s + 6m6m (雀頭), tenpai on 1s or 5s (ryamen)
    // Actually let's use: 2m3m4m / 4p5p6p / 6s7s8s / 2s3s4s / 6m6m = 13 tiles
    const tiles = ['2萬','3萬','4萬','4筒','5筒','6筒','6索','7索','8索','2索','3索','4索','6萬','6萬'];
    for (const tile of tiles) {
      // Click in palette area
      const paletteBtn = page.locator('section').filter({ hasText: '牌パレット' }).locator('button').filter({ hasText: tile }).first();
      await paletteBtn.click();
      await page.waitForTimeout(100);
    }
    await page.screenshot({ path: '/tmp/sprint4-pinfu-hand.png' });
    
    // Click tenpai button
    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/sprint4-pinfu-result.png' });
    
    // Check tenpai result shown
    const resultArea = page.locator('text=聴牌').first();
    await expect(resultArea).toBeVisible();
    
    // Click on a waiting tile to see yaku
    const waitingTile = page.locator('[data-testid="waiting-tile"]').first();
    if (await waitingTile.isVisible()) {
      await waitingTile.click();
    } else {
      // Try clicking on any tile shown in results
      const resultTileBtn = page.locator('button').filter({ hasText: /[0-9][萬筒索]|東|南|西|北|白|發|中/ }).last();
      await resultTileBtn.click();
    }
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/sprint4-pinfu-yaku.png' });
    
    // Check for 平和 in the page
    const pageContent = await page.content();
    console.log('Page has 平和:', pageContent.includes('平和'));
    await expect(page.locator('text=平和').first()).toBeVisible();
  });
});
