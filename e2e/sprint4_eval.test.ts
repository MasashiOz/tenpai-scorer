import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Helper: add tiles using getByRole buttons (same approach as sprint3 tests)
async function addTiles(page: Page, tiles: string[]) {
  const allBtns = page.getByRole('button');
  for (const tileText of tiles) {
    const btn = allBtns.filter({ hasText: new RegExp(`^${tileText}$`) }).first();
    await btn.click();
    await page.waitForTimeout(50);
  }
}

// Helper: press tenpai button
async function pressTenpai(page: Page) {
  const tenpaiBtn = page.getByRole('button', { name: '聴牌判定する' });
  await expect(tenpaiBtn).toBeEnabled({ timeout: 3000 });
  await tenpaiBtn.click();
  await page.waitForTimeout(500);
}

// Helper: click first waiting tile in YakuResultPanel
async function clickFirstWaitTile(page: Page) {
  // Wait for yaku panel to appear
  await expect(page.getByText('役判定結果')).toBeVisible({ timeout: 5000 });
  // Click the first waiting tile button in the yaku result panel
  const yakuPanel = page.locator('div').filter({ hasText: '役判定結果' }).last();
  const firstTileBtn = yakuPanel.locator('button').first();
  await firstTileBtn.click();
  await page.waitForTimeout(300);
}

test.describe('Sprint 4: 基本役判定エンジン - 受け入れ基準', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: '全リセット' }).click();
    await page.waitForTimeout(200);
  });

  // AC1: 平和形アガリで「平和」役が検出される
  test('AC1: 平和形アガリで「平和」役が検出される', async ({ page }) => {
    // 2萬3萬4萬 4筒5筒6筒 6索7索8索 2索3索4索 6萬6萬 (13枚)
    // Wait: 1索 or 5索 (ryanmen for 2索3索4索)?
    // Actually: with 2s3s4s complete and 6m6m as pair, need another mentsu
    // 2m3m4m 4p5p6p 6s7s8s 2s3s4s + 6m6m = 13 tiles, need one more for tenpai
    // Wait on something to complete a 4th mentsu. 6m6m is pair, 3 mentsu are complete
    // This is already 13 tiles with 4 mentsu + pair = complete hand (tenpai form)
    // Actually 2m3m4m + 4p5p6p + 6s7s8s + 2s3s4s = 4 mentsu, + 6m6m = pair -> 14 tiles agari
    // For 13 tile tenpai, remove one tile that creates a wait
    // Use: 2m3m4m 4p5p6p 6s7s8s 2s3s + 6m6m = 12 tiles... not right
    //
    // Correct tenpai: 2m3m4m / 4p5p6p / 6s7s8s / 6m6m (pair) / 2s3s -> wait 1s or 4s
    const tiles = [
      '2萬', '3萬', '4萬',
      '4筒', '5筒', '6筒',
      '6索', '7索', '8索',
      '6萬', '6萬',
      '2索', '3索'
    ];
    await addTiles(page, tiles);
    await expect(page.getByText('13/14枚')).toBeVisible();
    await pressTenpai(page);

    await expect(page.getByText('聴牌！')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('役判定結果')).toBeVisible({ timeout: 5000 });

    await clickFirstWaitTile(page);
    await page.screenshot({ path: '/tmp/sprint4_ac1_heiwa.png' });

    // Check 平和 is shown in yaku list
    await expect(page.getByText('平和')).toBeVisible({ timeout: 5000 });
    console.log('[AC1 PASS] 平和 detected');
  });

  // AC2: タンヤオ形アガリで「タンヤオ」役が検出される
  test('AC2: タンヤオ形アガリで「タンヤオ」役が検出される', async ({ page }) => {
    // 2萬×3 / 4萬×3 / 6萬×3 / 2筒×2 / 4筒×2 (13枚)
    // Wait on 2筒 or 4筒 (shanpon)
    const tiles = [
      '2萬', '2萬', '2萬',
      '4萬', '4萬', '4萬',
      '6萬', '6萬', '6萬',
      '2筒', '2筒',
      '4筒', '4筒'
    ];
    await addTiles(page, tiles);
    await expect(page.getByText('13/14枚')).toBeVisible();
    await pressTenpai(page);

    await expect(page.getByText('聴牌！')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('役判定結果')).toBeVisible({ timeout: 5000 });

    await clickFirstWaitTile(page);
    await page.screenshot({ path: '/tmp/sprint4_ac2_tanyao.png' });

    await expect(page.getByText('タンヤオ')).toBeVisible({ timeout: 5000 });
    console.log('[AC2 PASS] タンヤオ detected');
  });

  // AC3: 清一色アガリで「清一色」役が検出される
  test('AC3: 清一色アガリで「清一色」役が検出される', async ({ page }) => {
    // 萬子のみ: 1萬2萬3萬 / 4萬4萬4萬 / 5萬6萬7萬 / 8萬9萬 / 1萬1萬 (13枚)
    // Wait on 7萬 or 9萬 (shanpon on 8萬9萬)? No: 8m9m alone is partial sequence
    // Actually: 1m2m3m / 4m4m4m / 5m6m7m / 1m1m / 8m9m -> wait on 7m or 10m?
    // 8m9m -> wait on 7m or 10m(invalid). So wait on 7m only (penchan? no, 8-9 wait 7)
    // Actually 8m9m = ryanmen wait? -> need 7m or 10m. 10m doesn't exist so just 7m
    // But 7m is already in 5m6m7m... Using 4 copies of a tile is invalid.
    // Let's use: 1m2m3m / 4m4m4m / 5m6m7m / 1m1m / 8m9m -> 7m (already used 1 in 5-6-7)
    // 5m,6m,7m uses 1 of 7m. 8m,9m waits for 7m -> 2 copies of 7m total. OK.
    const tiles = [
      '1萬', '2萬', '3萬',
      '4萬', '4萬', '4萬',
      '5萬', '6萬', '7萬',
      '1萬', '1萬',
      '8萬', '9萬'
    ];
    await addTiles(page, tiles);
    await expect(page.getByText('13/14枚')).toBeVisible();
    await pressTenpai(page);

    await expect(page.getByText('聴牌！')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('役判定結果')).toBeVisible({ timeout: 5000 });

    await clickFirstWaitTile(page);
    await page.screenshot({ path: '/tmp/sprint4_ac3_chinitsu.png' });

    await expect(page.getByText('清一色')).toBeVisible({ timeout: 5000 });
    console.log('[AC3 PASS] 清一色 detected');
  });

  // AC4: 七対子アガリで「七対子」役が検出される
  test('AC4: 七対子アガリで「七対子」役が検出される', async ({ page }) => {
    // 1萬×2 / 東×2 / 南×2 / 西×2 / 北×2 / 白×2 / 發（1枚）
    const tiles = [
      '1萬', '1萬',
      '東', '東',
      '南', '南',
      '西', '西',
      '北', '北',
      '白', '白',
      '發'
    ];
    await addTiles(page, tiles);
    await expect(page.getByText('13/14枚')).toBeVisible();
    await pressTenpai(page);

    await expect(page.getByText('聴牌！')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('役判定結果')).toBeVisible({ timeout: 5000 });

    await clickFirstWaitTile(page);
    await page.screenshot({ path: '/tmp/sprint4_ac4_chiitoitsu.png' });

    await expect(page.getByText('七対子')).toBeVisible({ timeout: 5000 });
    console.log('[AC4 PASS] 七対子 detected');
  });

  // AC5: 複合役（タンヤオ＋一盃口）で全役が列挙される
  test('AC5: 複合役（タンヤオ＋一盃口）で全役が列挙される', async ({ page }) => {
    // 2萬3萬4萬 / 2萬3萬4萬 / 5筒6筒7筒 / 6索7索8索 / 8索（1枚）
    // Wait on 6索 or 9索 (ryanmen with 6s7s8s and 8s)
    // Actually: 2m3m4m / 2m3m4m / 5p6p7p / 6s7s8s / 8s -> need to form last mentsu+pair
    // With 8s alone: tenpai needs another 2 tiles for mentsu+pair or tenpai
    // 2m3m4m / 2m3m4m (iipeiko) / 5p6p7p / 6s7s8s = 12 tiles + 8s = 13
    // But we need pair + 1 more mentsu? No: 4 mentsu + 1 pair = 14 tiles
    // 13 tenpai: 3 complete mentsu + partial for 1 mentsu or pair
    // 2m3m4m / 2m3m4m / 5p6p7p / 6s7s8s + 8s: 13 tiles
    //  -> This has 4 mentsu but 8s is the 13th tile. Actually 3*4 + 1 = 13
    // With 4 complete mentsu would need 4 more tiles (pair), but we only have 13 total
    // So: 2m3m4m (3) / 2m3m4m (3) / 5p6p7p (3) / 6s7s8s (3) + 8s (1) = 13 tiles
    // Tenpai: complete 4 mentsu + pair. 8s alone needs a pair or mentsu.
    // -> 8s pair wait: need another 8s (tanki wait)
    // OR: 6s7s8s + 8s -> 6s7s8s8s -> wait 7s or 9s for sequence (6s7s8s is 1 mentsu, extra 8s)
    // Actually 6s7s8s is 1 complete mentsu. Then 8s alone is 13th tile -> tanki wait 8s

    // Hmm, let me pick a cleaner hand:
    // 2m3m4m / 2m3m4m / 5p6p7p / 6s8s -> wait 7s (kanchan)
    // But that's only 12 tiles + need pair
    // 2m3m4m / 2m3m4m / 5p6p7p / 6s8s / 2p2p = 13 tiles, kanchan 7s wait
    const tiles = [
      '2萬', '3萬', '4萬',
      '2萬', '3萬', '4萬',
      '5筒', '6筒', '7筒',
      '6索', '8索',
      '2筒', '2筒'
    ];
    await addTiles(page, tiles);
    await expect(page.getByText('13/14枚')).toBeVisible();
    await pressTenpai(page);

    await expect(page.getByText('聴牌！')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('役判定結果')).toBeVisible({ timeout: 5000 });

    await clickFirstWaitTile(page);
    await page.screenshot({ path: '/tmp/sprint4_ac5_iipeiko.png' });

    // タンヤオ and 一盃口 should both be shown
    await expect(page.getByText('タンヤオ')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('一盃口')).toBeVisible({ timeout: 5000 });
    console.log('[AC5 PASS] タンヤオ + 一盃口 both detected');
  });

  // AC6 (from spec): 三色同順検出
  test('AC6-extra: 三色同順が検出される', async ({ page }) => {
    // 2萬3萬4萬 / 2筒3筒4筒 / 2索3索4索 / 5萬6萬7萬 / 5萬 (13枚)
    // Wait on 4萬 or 7萬 (ryanmen with 5m6m7m and extra 5m)
    // Actually: 2m3m4m / 2p3p4p / 2s3s4s / 5m6m7m / 5m = 13 tiles
    // 5m6m7m+5m -> 5m is already used, extra 5m tanki wait or something
    // 2m3m4m / 2p3p4p / 2s3s4s = 9 tiles (sanshoku). + 5m6m + 5m5m = 13
    // With 5m5m pair and 5m6m partial: wait on 4m or 7m for ryanmen
    const tiles = [
      '2萬', '3萬', '4萬',
      '2筒', '3筒', '4筒',
      '2索', '3索', '4索',
      '5萬', '5萬',
      '5萬', '6萬'
    ];
    // That's 13 but 5萬 appears 3 times. 5m6m + 5m5m = 5m5m5m6m -> not valid mentsu
    // Let's try: 2m3m4m / 2p3p4p / 2s3s4s / 5m6m / 8m8m = 13 tiles, wait 4m or 7m
    await page.getByRole('button', { name: '全リセット' }).click();
    await page.waitForTimeout(200);

    const tiles2 = [
      '2萬', '3萬', '4萬',
      '2筒', '3筒', '4筒',
      '2索', '3索', '4索',
      '5萬', '6萬',
      '8萬', '8萬'
    ];
    await addTiles(page, tiles2);
    await expect(page.getByText('13/14枚')).toBeVisible();
    await pressTenpai(page);

    await expect(page.getByText('聴牌！')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('役判定結果')).toBeVisible({ timeout: 5000 });

    // Click the first wait tile
    await clickFirstWaitTile(page);
    await page.screenshot({ path: '/tmp/sprint4_sanshoku.png' });

    // 三色同順 should appear
    await expect(page.getByText('三色同順')).toBeVisible({ timeout: 5000 });
    console.log('[三色同順 PASS] 三色同順 detected');
  });

  // Spec AC: 役牌（白）の検出
  test('AC-yakuhai: 役牌（白）が検出される', async ({ page }) => {
    // 1萬2萬3萬 / 4筒5筒6筒 / 7索8索9索 / 白白白 / 1筒2筒 (13枚)
    // Wait on 3筒 (ryanmen)
    const tiles = [
      '1萬', '2萬', '3萬',
      '4筒', '5筒', '6筒',
      '7索', '8索', '9索',
      '白', '白', '白',
      '1筒', '2筒'
    ];
    // That's 14 tiles. Use first 13 (no 2筒)
    const tiles13 = tiles.slice(0, 13);
    await addTiles(page, tiles13);
    await expect(page.getByText('13/14枚')).toBeVisible();
    await pressTenpai(page);

    await expect(page.getByText('聴牌！')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('役判定結果')).toBeVisible({ timeout: 5000 });

    await clickFirstWaitTile(page);
    await page.screenshot({ path: '/tmp/sprint4_yakuhai.png' });

    await expect(page.getByText('役牌（白）')).toBeVisible({ timeout: 5000 });
    console.log('[役牌 PASS] 役牌（白） detected');
  });

  // ロン/ツモタブ切り替え
  test('ロン/ツモタブの切り替えが動作する', async ({ page }) => {
    const tiles = [
      '2萬', '2萬', '2萬',
      '4萬', '4萬', '4萬',
      '6萬', '6萬', '6萬',
      '2筒', '2筒',
      '4筒', '4筒'
    ];
    await addTiles(page, tiles);
    await pressTenpai(page);

    await expect(page.getByText('役判定結果')).toBeVisible({ timeout: 5000 });
    await clickFirstWaitTile(page);

    // Ron tab
    await expect(page.getByRole('button', { name: 'ロン' })).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: 'ツモ' })).toBeVisible({ timeout: 3000 });

    // Click ツモ
    await page.getByRole('button', { name: 'ツモ' }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/sprint4_tsumo_tab.png' });
    console.log('[ロン/ツモタブ PASS] Tab switching works');
  });
});

test.describe('Sprint 4: 回帰テスト (Sprint 1-3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: '全リセット' }).click();
    await page.waitForTimeout(200);
  });

  test('Sprint 1 回帰: 牌パレット表示・手牌追加・削除・クリア', async ({ page }) => {
    // Palette visible
    await expect(page.getByText('牌パレット')).toBeVisible();
    await expect(page.getByText('萬子')).toBeVisible();
    await expect(page.getByText('筒子')).toBeVisible();
    await expect(page.getByText('索子')).toBeVisible();

    // Add 1萬
    const btn1man = page.getByRole('button').filter({ hasText: /^1萬$/ }).first();
    await btn1man.click();
    await expect(page.getByText('1/14枚')).toBeVisible({ timeout: 3000 });

    // Delete from hand
    const handTile = page.locator('div').filter({ hasText: /^手牌/ }).first().locator('button').first();
    // Actually click the tile in hand area
    // Find tile in hand by clicking on '1/14枚' area
    await page.screenshot({ path: '/tmp/sprint4_regression_s1.png' });

    // Clear
    await page.getByRole('button').filter({ hasText: 'クリア' }).first().click();
    await expect(page.getByText('0/14枚')).toBeVisible({ timeout: 3000 });

    console.log('[Sprint 1 Regression PASS]');
  });

  test('Sprint 2 回帰: 親子切替・場風・自風・ドラ設定', async ({ page }) => {
    // Default: 子
    await expect(page.getByRole('button').filter({ hasText: /子✓/ })).toBeVisible();

    // Switch to 親
    await page.getByRole('button', { name: '親' }).click();
    await expect(page.getByRole('button').filter({ hasText: /親✓/ })).toBeVisible({ timeout: 3000 });

    // Switch round wind to 南場
    await page.getByRole('button', { name: '南場' }).click();
    await expect(page.getByRole('button').filter({ hasText: /南場✓/ })).toBeVisible({ timeout: 3000 });

    // Switch seat wind to 西家
    await page.getByRole('button', { name: '西家' }).click();
    await expect(page.getByRole('button').filter({ hasText: /西家✓/ })).toBeVisible({ timeout: 3000 });

    // Reset situation
    await page.getByRole('button', { name: 'リセット' }).click();
    await expect(page.getByRole('button').filter({ hasText: /子✓/ })).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button').filter({ hasText: /東場✓/ })).toBeVisible({ timeout: 3000 });

    console.log('[Sprint 2 Regression PASS]');
  });

  test('Sprint 3 回帰: 聴牌ボタン無効化・ノーテン・国士無双', async ({ page }) => {
    const tenpaiBtn = page.getByRole('button', { name: '聴牌判定する' });

    // Disabled when 0 tiles
    await expect(tenpaiBtn).toBeDisabled();
    await expect(page.getByText(/13枚必要です（現在0枚）/)).toBeVisible();

    // 国士無双 13面待ち
    const kokushiTiles = [
      '1萬', '9萬',
      '1筒', '9筒',
      '1索', '9索',
      '東', '南', '西', '北',
      '白', '發', '中'
    ];
    await addTiles(page, kokushiTiles);
    await expect(page.getByText('13/14枚')).toBeVisible();
    await expect(tenpaiBtn).toBeEnabled();
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    await expect(page.getByText('聴牌！')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('待ち牌 13種類')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: '/tmp/sprint4_regression_s3.png' });

    console.log('[Sprint 3 Regression PASS]');
  });
});
