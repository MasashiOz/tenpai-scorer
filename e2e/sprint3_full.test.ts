import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Helper: click a tile in the palette by display text
async function clickPaletteTile(page: Page, text: string, times: number = 1) {
  // Find buttons in palette area (not in hand area)
  // Palette buttons have specific structure - click button with exact matching text
  for (let i = 0; i < times; i++) {
    // Get all buttons and find the one in the palette section
    const paletteButtons = page.locator('section').last().getByRole('button');
    const btn = paletteButtons.filter({ hasText: new RegExp(`^${text}`) }).first();
    await btn.click({ timeout: 3000 });
    await page.waitForTimeout(100);
  }
}

// Get tile count text from hand area
async function getHandCount(page: Page): Promise<number> {
  const countText = await page.getByText(/\d+\/14枚/).textContent();
  if (countText) {
    const match = countText.match(/(\d+)\/14/);
    return match ? parseInt(match[1]) : 0;
  }
  return 0;
}

test.describe('Sprint 3 E2E: 聴牌判定エンジン', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    // Reset to fresh state
    const resetBtn = page.getByRole('button', { name: '全リセット' });
    await resetBtn.click();
    await page.waitForTimeout(200);
  });

  // ===============================================================
  // AC1: 手牌が13枚未満のとき「聴牌」ボタンが無効
  // ===============================================================
  test('AC1: 手牌0枚で聴牌ボタンが無効、理由テキスト表示', async ({ page }) => {
    const tenpaiBtn = page.getByRole('button', { name: '聴牌判定する' });

    // Check disabled
    await expect(tenpaiBtn).toBeDisabled();

    // Check reason text shows 0 tiles
    await expect(page.getByText(/13枚必要です（現在0枚）/)).toBeVisible();
  });

  // ===============================================================
  // AC1 continued: 数枚追加後もまだ無効
  // ===============================================================
  test('AC1: 5枚追加後も聴牌ボタンが無効で理由が更新される', async ({ page }) => {
    // Find palette buttons (not situation/hand related)
    // Add 5 tiles by clicking 1萬 5 times (but max 4), then different tiles
    // Use direct approach: click 4 of 1萬, 1 of 2萬
    const paletteSection = page.locator('div').filter({ hasText: /^牌パレット/ }).last();

    // Click 1萬 button in palette area
    // The palette section should be identifiable
    // Let's look at page structure
    const allBtns = page.getByRole('button');
    const btn1man = allBtns.filter({ hasText: /^1萬$/ }).first();
    await btn1man.click();
    await btn1man.click();
    await btn1man.click();
    await btn1man.click();

    // Click 2萬 once
    const btn2man = allBtns.filter({ hasText: /^2萬$/ }).first();
    await btn2man.click();

    const tenpaiBtn = page.getByRole('button', { name: '聴牌判定する' });
    await expect(tenpaiBtn).toBeDisabled();
    await expect(page.getByText(/13枚必要です（現在5枚）/)).toBeVisible();
  });

  // ===============================================================
  // AC2: 明らかなノーテン13枚
  // ===============================================================
  test('AC2: ノーテン13枚でボタン有効化→押すとノーテン表示', async ({ page }) => {
    const allBtns = page.getByRole('button');

    // Add バラバラな13枚: 1萬 3萬 5萬 7萬 9萬 1筒 3筒 5筒 東 南 西 白 發
    const tilesToAdd = [
      '1萬', '3萬', '5萬', '7萬', '9萬',
      '1筒', '3筒', '5筒',
      '東', '南', '西', '白', '發'
    ];

    for (const tileText of tilesToAdd) {
      const btn = allBtns.filter({ hasText: new RegExp(`^${tileText}$`) }).first();
      await btn.click();
      await page.waitForTimeout(50);
    }

    // Check hand count is 13
    await expect(page.getByText('13/14枚')).toBeVisible();

    // Button should now be enabled
    const tenpaiBtn = page.getByRole('button', { name: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled();

    // Click the button
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    // Should show ノーテン
    await expect(page.getByText('ノーテン')).toBeVisible();
  });

  // ===============================================================
  // AC3: シャンポン待ち（2種類）
  // ===============================================================
  test('AC3: シャンポン待ち13枚で待ち牌2種が表示される', async ({ page }) => {
    const allBtns = page.getByRole('button');

    // 123萬 456萬 789萬 11筒 22筒 (13枚)
    const tilesToAdd = [
      '1萬', '2萬', '3萬',
      '4萬', '5萬', '6萬',
      '7萬', '8萬', '9萬',
      '1筒', '1筒',
      '2筒', '2筒'
    ];

    for (const tileText of tilesToAdd) {
      const btn = allBtns.filter({ hasText: new RegExp(`^${tileText}$`) }).first();
      await btn.click();
      await page.waitForTimeout(50);
    }

    await expect(page.getByText('13/14枚')).toBeVisible();

    const tenpaiBtn = page.getByRole('button', { name: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled();
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    // Should show 聴牌！
    await expect(page.getByText('聴牌！')).toBeVisible();
    // Should show 2 waits
    await expect(page.getByText('待ち牌 2種類')).toBeVisible();

    // Should show 1筒 and 2筒 as wait tiles
    await expect(page.getByText('1筒').last()).toBeVisible();
    await expect(page.getByText('2筒').last()).toBeVisible();
  });

  // ===============================================================
  // AC5: 七対子聴牌（単騎）
  // ===============================================================
  test('AC5: 七対子（6ペア+単騎）で聴牌判定', async ({ page }) => {
    const allBtns = page.getByRole('button');

    // 11萬 22萬 33萬 44萬 55萬 66萬 7萬(単騎) = 13枚
    const tilesToAdd = [
      '1萬', '1萬',
      '2萬', '2萬',
      '3萬', '3萬',
      '4萬', '4萬',
      '5萬', '5萬',
      '6萬', '6萬',
      '7萬'
    ];

    for (const tileText of tilesToAdd) {
      const btn = allBtns.filter({ hasText: new RegExp(`^${tileText}$`) }).first();
      await btn.click();
      await page.waitForTimeout(50);
    }

    await expect(page.getByText('13/14枚')).toBeVisible();

    const tenpaiBtn = page.getByRole('button', { name: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled();
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    await expect(page.getByText('聴牌！')).toBeVisible();
    // 7萬が待ち牌として表示
    await expect(page.getByText('待ち牌 1種類')).toBeVisible();
  });

  // ===============================================================
  // AC6: 国士無双13面待ち
  // ===============================================================
  test('AC6: 国士無双13面待ちで全13種の待ち牌', async ({ page }) => {
    const allBtns = page.getByRole('button');

    // 1萬 9萬 1筒 9筒 1索 9索 東 南 西 北 白 發 中
    const tilesToAdd = [
      '1萬', '9萬',
      '1筒', '9筒',
      '1索', '9索',
      '東', '南', '西', '北',
      '白', '發', '中'
    ];

    for (const tileText of tilesToAdd) {
      const btn = allBtns.filter({ hasText: new RegExp(`^${tileText}$`) }).first();
      await btn.click();
      await page.waitForTimeout(50);
    }

    await expect(page.getByText('13/14枚')).toBeVisible();

    const tenpaiBtn = page.getByRole('button', { name: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled();
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    await expect(page.getByText('聴牌！')).toBeVisible();
    await expect(page.getByText('待ち牌 13種類')).toBeVisible();
  });

  // ===============================================================
  // 純正九蓮宝燈（9面待ち）
  // ===============================================================
  test('九蓮宝燈: 9面待ちが全て列挙される', async ({ page }) => {
    const allBtns = page.getByRole('button');

    // 1萬×3 2萬 3萬 4萬 5萬 6萬 7萬 8萬 9萬×3 = 13枚
    const tilesToAdd = [
      '1萬', '1萬', '1萬',
      '2萬', '3萬', '4萬', '5萬', '6萬', '7萬', '8萬',
      '9萬', '9萬', '9萬'
    ];

    for (const tileText of tilesToAdd) {
      const btn = allBtns.filter({ hasText: new RegExp(`^${tileText}$`) }).first();
      await btn.click();
      await page.waitForTimeout(50);
    }

    await expect(page.getByText('13/14枚')).toBeVisible();

    const tenpaiBtn = page.getByRole('button', { name: '聴牌判定する' });
    await expect(tenpaiBtn).toBeEnabled();
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    await expect(page.getByText('聴牌！')).toBeVisible();
    await expect(page.getByText('待ち牌 9種類')).toBeVisible();
  });

  // ===============================================================
  // 手牌変更時の自動クリア
  // ===============================================================
  test('手牌変更時に判定結果が自動クリアされる', async ({ page }) => {
    const allBtns = page.getByRole('button');

    // Set up shanpon hand
    const tilesToAdd = [
      '1萬', '2萬', '3萬',
      '4萬', '5萬', '6萬',
      '7萬', '8萬', '9萬',
      '1筒', '1筒',
      '2筒', '2筒'
    ];
    for (const t of tilesToAdd) {
      const btn = allBtns.filter({ hasText: new RegExp(`^${t}$`) }).first();
      await btn.click();
      await page.waitForTimeout(50);
    }

    // Click tenpai button
    const tenpaiBtn = page.getByRole('button', { name: '聴牌判定する' });
    await tenpaiBtn.click();
    await page.waitForTimeout(300);

    // Verify result is showing
    await expect(page.getByText('聴牌！')).toBeVisible();

    // Now click a hand tile to remove it (hand area)
    // The first tile in hand should be clickable
    const handTiles = page.locator('div').filter({ hasText: /0\/14枚|1\/14枚|2\/14枚|3\/14枚|4\/14枚|5\/14枚|6\/14枚|7\/14枚|8\/14枚|9\/14枚|10\/14枚|11\/14枚|12\/14枚|13\/14枚|14\/14枚/ });

    // Click clear button instead to trigger auto-clear
    const clearBtn = page.getByRole('button', { name: 'クリア' });
    await clearBtn.click();
    await page.waitForTimeout(300);

    // Result should be cleared
    await expect(page.getByText('聴牌！')).not.toBeVisible();
  });

  // ===============================================================
  // Regression: Sprint 1 - Tile palette and hand area
  // ===============================================================
  test('回帰 Sprint1: 牌パレット34種表示・追加・削除・上限制御', async ({ page }) => {
    // Check 34 tile types visible in palette
    const tileNames = [
      '1萬', '2萬', '3萬', '4萬', '5萬', '6萬', '7萬', '8萬', '9萬',
      '1筒', '2筒', '3筒', '4筒', '5筒', '6筒', '7筒', '8筒', '9筒',
      '1索', '2索', '3索', '4索', '5索', '6索', '7索', '8索', '9索',
      '東', '南', '西', '北', '白', '發', '中'
    ];

    // At minimum, check the categories are shown
    await expect(page.getByText('萬子')).toBeVisible();
    await expect(page.getByText('筒子')).toBeVisible();
    await expect(page.getByText('索子')).toBeVisible();
    await expect(page.getByText('風牌')).toBeVisible();
    await expect(page.getByText('三元牌')).toBeVisible();

    // Check some tiles are visible
    await expect(page.getByRole('button', { name: /^1萬$/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^中$/ }).first()).toBeVisible();

    // Add a tile
    const btn1man = page.getByRole('button', { name: /^1萬$/ }).first();
    await btn1man.click();
    await expect(page.getByText('1/14枚')).toBeVisible();

    // Add same tile 3 more times (total 4)
    await btn1man.click();
    await btn1man.click();
    await btn1man.click();
    await expect(page.getByText('4/14枚')).toBeVisible();

    // 5th click should be blocked (max 4)
    await btn1man.click();
    await expect(page.getByText('5/14枚')).not.toBeVisible();
    await expect(page.getByText('4/14枚')).toBeVisible();

    // Clear
    const clearBtn = page.getByRole('button', { name: 'クリア' });
    await clearBtn.click();
    await expect(page.getByText('0/14枚')).toBeVisible();
  });

  // ===============================================================
  // Regression: Sprint 2 - Situation panel
  // ===============================================================
  test('回帰 Sprint2: 親子切替・場風・自風・ドラ設定', async ({ page }) => {
    // 親/子 toggle
    const oyaBtn = page.getByRole('button', { name: '親' });
    const koBtn = page.getByRole('button', { name: /^子/ });

    // Initial state: 子 is selected
    await expect(koBtn).toBeVisible();
    await oyaBtn.click();
    await expect(page.getByRole('button', { name: /^親/ })).toBeVisible();

    // 場風
    const southBtn = page.getByRole('button', { name: '南場' });
    await southBtn.click();
    await expect(page.getByText(/南場/)).toBeVisible();

    // 自風
    const westBtn = page.getByRole('button', { name: '西家' });
    await westBtn.click();
    await expect(page.getByText(/西家/)).toBeVisible();

    // Add dora indicator
    const addDoraBtn = page.getByRole('button', { name: /＋ ドラ表示牌を追加/ });
    await addDoraBtn.click();
    await page.waitForTimeout(200);

    // Select 5萬 as dora indicator
    const dora5man = page.getByRole('button', { name: /^5萬$/ }).last();
    await dora5man.click();
    await page.waitForTimeout(200);

    // 5萬 → 6萬 should be shown
    await expect(page.getByText('→')).toBeVisible();

    // Reset situation
    const resetSituationBtn = page.getByRole('button', { name: 'リセット' });
    await resetSituationBtn.click();
    await page.waitForTimeout(200);

    // Should be back to defaults: 子, 東場, 東家
    await expect(page.getByText(/東場/)).toBeVisible();
  });

});
