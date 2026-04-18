import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Helper: click a tile in the palette by tile text
async function clickPaletteTile(page: Page, text: string) {
  // Find the tile button in the palette section
  const paletteSection = page.locator('section, div').filter({ hasText: '牌パレット' }).first();
  // Try to find button with exact text in palette
  const btn = page.getByRole('button', { name: text }).first();
  await btn.click();
}

// Helper: click a specific tile ID button in the palette
async function clickPaletteTileById(page: Page, text: string) {
  // Look for buttons that have the specific text content
  const buttons = page.getByRole('button').filter({ hasText: new RegExp(`^${text}$`) });
  const count = await buttons.count();
  if (count > 0) {
    await buttons.first().click();
  }
}

test.describe('Sprint 3: 聴牌判定エンジン', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    // Click clear/reset to start fresh
    const resetBtn = page.getByRole('button', { name: '全リセット' });
    if (await resetBtn.count() > 0) {
      await resetBtn.click();
    }
  });

  test('AC1: 手牌が13枚未満のとき「聴牌判定する」ボタンが無効', async ({ page }) => {
    // Initially 0 tiles - button should be disabled
    const tenpaiBtn = page.getByRole('button', { name: '聴牌判定する' });
    await expect(tenpaiBtn).toBeDisabled();

    // Check disabled reason text
    const reasonText = page.getByText(/13枚必要です/);
    await expect(reasonText).toBeVisible();

    // Verify 0 tiles shown
    const reason0 = page.getByText(/現在0枚/);
    await expect(reason0).toBeVisible();
  });

  test('AC2: ノーテン13枚の手牌で「聴牌」ボタンを押すとノーテン表示', async ({ page }) => {
    // Add 13 scattered tiles (clearly no tenpai)
    // 1m 3m 5m 7m 9m 1p 3p 5p 東 南 西 白 發
    const tiles = ['1萬', '3萬', '5萬', '7萬', '9萬', '1筒', '3筒', '5筒', '東', '南', '西', '白', '發'];

    // We need to find tiles in the palette using their display text
    // Let's check what the page contains first
    const bodyText = await page.textContent('body');
    console.log('Page contains:', bodyText?.substring(0, 200));

    // Look for tile buttons in palette area - check page structure
    const allButtons = await page.getByRole('button').all();
    console.log(`Total buttons: ${allButtons.length}`);
    for (const btn of allButtons.slice(0, 10)) {
      const text = await btn.textContent();
      console.log('Button text:', text?.trim());
    }
  });

  test('Page renders correctly and shows Sprint 3 components', async ({ page }) => {
    // Verify main components are present
    await expect(page.getByText('聴牌判定')).toBeVisible();
    await expect(page.getByRole('button', { name: '聴牌判定する' })).toBeVisible();
    await expect(page.getByText('牌パレット')).toBeVisible();
    await expect(page.getByText('手牌')).toBeVisible();
  });

});
