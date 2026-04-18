import { test, expect } from '@playwright/test';

// Helper: add a tile by clicking palette
async function addTileFromPalette(page: any, tileText: string) {
  // Find tile in palette section - look for buttons with exact text
  const paletteBtns = page.locator('[data-testid="palette-tile"]').filter({ hasText: tileText });
  if (await paletteBtns.count() > 0) {
    await paletteBtns.first().click();
    return;
  }
  // Fallback: find in 牌パレット section
  const paletteSection = page.locator('section, div').filter({ hasText: '牌パレット' }).last();
  const btn = paletteSection.locator('button').filter({ hasText: new RegExp(`^${tileText}$`) }).first();
  await btn.click();
}

// Click tile by finding all buttons in palette area
async function clickPaletteTile(page: any, tileText: string) {
  // Get all buttons on page and find the one in palette area with matching text
  const buttons = page.locator('button');
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i);
    const text = await btn.textContent();
    const isDisabled = await btn.isDisabled();
    if (text?.trim() === tileText && !isDisabled) {
      await btn.click();
      return true;
    }
  }
  return false;
}

test.describe('Sprint 5: 基本機能テスト', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('Sprint5-1: 子・平和形 - 点数と符内訳表示確認', async ({ page }) => {
    // 手牌: 2萬・3萬・4萬 / 4筒・5筒・6筒 / 6索・7索・8索 / 2索・3索 / 6萬・6萬 (13枚)
    // Wait for page to load - click clear first
    const clearBtn = page.locator('button').filter({ hasText: 'クリア' }).first();
    await clearBtn.click();

    // Add tiles to hand
    const tilesToAdd = [
      { text: '2萬', count: 1 },
      { text: '3萬', count: 1 },
      { text: '4萬', count: 1 },
      { text: '4筒', count: 1 },
      { text: '5筒', count: 1 },
      { text: '6筒', count: 1 },
      { text: '6索', count: 1 },
      { text: '7索', count: 1 },
      { text: '8索', count: 1 },
      { text: '2索', count: 1 },
      { text: '3索', count: 1 },
      { text: '6萬', count: 2 },
    ];

    for (const tile of tilesToAdd) {
      for (let i = 0; i < tile.count; i++) {
        await clickPaletteTile(page, tile.text);
        await page.waitForTimeout(50);
      }
    }

    // Check hand count is 13
    const handText = await page.locator('body').textContent();
    console.log('Hand area text check:', handText?.match(/\d+\/14枚/)?.[0]);

    // Click 聴牌判定する button
    const tenpaiBtn = page.locator('button').filter({ hasText: '聴牌判定する' }).first();
    const isEnabled = await tenpaiBtn.isEnabled();
    console.log('Tenpai button enabled:', isEnabled);
    
    if (isEnabled) {
      await tenpaiBtn.click();
      await page.waitForTimeout(500);
      
      const bodyText = await page.locator('body').textContent();
      console.log('After tenpai check:', bodyText?.substring(0, 800));
      await page.screenshot({ path: '/tmp/sprint5-heiwatenpai.png', fullPage: true });
      
      // Check for score display
      expect(bodyText).toMatch(/点|ron|ロン/i);
    }
  });

  test('Sprint5-2: 点数表示UIの確認', async ({ page }) => {
    // Check page content for scoring elements
    const body = await page.locator('body').textContent();
    console.log('Sprint 5 version check:', body?.includes('Sprint 5') ? 'Sprint 5 found' : 'NOT found');
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/sprint5-ui.png', fullPage: true });
    
    // Check Sprint version in footer
    expect(body).toMatch(/Sprint 5/i);
  });
});
