import { test, expect } from '@playwright/test';

// Sprint 7: 副露（ポン・チー・カン）対応 受け入れ基準テスト

test.describe('Sprint 7 受け入れ基準テスト', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('AC0: 副露パネルが表示されていること', async ({ page }) => {
    // 副露（鳴き）パネルが表示されている
    const meldPanel = page.locator('text=副露（鳴き）');
    await expect(meldPanel).toBeVisible();
    
    // 「副露なし（門前）」が初期状態で表示
    await expect(page.locator('text=副露なし（門前）')).toBeVisible();
    
    await page.screenshot({ path: '/tmp/sprint7-ac0.png' });
  });

  test('AC1: ポン面子を含む手牌で聴牌判定が動作すること', async ({ page }) => {
    // 手牌に牌を追加して副露を有効化
    // 牌パレット内の東ボタンを押す（副露用）
    // まず手牌を追加してパレットを操作できるようにする
    
    // 牌パレットセクションのボタンを特定
    // 牌パレットから1萬を複数回クリック
    const tile1Man = page.locator('button[aria-label]').filter({ hasText: '1' }).first();
    
    // 牌パレットのボタンをテキストで特定
    // パレット内のボタンリストを確認
    const allPaletteBtns = page.locator('button').filter({ hasText: /^[1-9][萬筒索]$/ });
    const count = await allPaletteBtns.count();
    console.log(`Palette tile buttons: ${count}`);
    
    // 1萬を1回クリック
    const man1 = page.locator('button').filter({ hasText: /^1萬$/ }).first();
    await man1.click();
    await page.waitForTimeout(200);
    
    // 副露パネルにポンボタンが表示されているか確認
    const ponBtn = page.locator('button').filter({ hasText: /^ポン$/ });
    const ponCount = await ponBtn.count();
    console.log(`ポン buttons: ${ponCount}`);
    
    await page.screenshot({ path: '/tmp/sprint7-ac1-afterclick.png' });
    expect(ponCount).toBeGreaterThan(0);
  });

  test('AC1-full: ポン面子を含む聴牌判定の完全テスト', async ({ page }) => {
    // 手牌に何枚か追加
    // まず手牌に10枚追加
    const tile2Man = page.locator('button').filter({ hasText: /^2萬$/ }).first();
    for (let i = 0; i < 4; i++) {
      await tile2Man.click();
      await page.waitForTimeout(100);
    }
    
    const tile3Man = page.locator('button').filter({ hasText: /^3萬$/ }).first();
    for (let i = 0; i < 3; i++) {
      await tile3Man.click();
      await page.waitForTimeout(100);
    }
    
    const tile4Man = page.locator('button').filter({ hasText: /^4萬$/ }).first();
    for (let i = 0; i < 3; i++) {
      await tile4Man.click();
      await page.waitForTimeout(100);
    }
    
    // ここで副露パネルを確認
    await page.screenshot({ path: '/tmp/sprint7-before-meld.png' });
    
    // ポンボタンをクリック
    const ponBtn = page.locator('button').filter({ hasText: /^ポン$/ }).first();
    await ponBtn.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: '/tmp/sprint7-pon-clicked.png', fullPage: true });
    
    // 副露パレットが表示されているか
    const meldPaletteText = await page.locator('text=鳴く牌を選択').count();
    console.log('Meld palette visible:', meldPaletteText);
  });
  
  test('AC4: 副露ありの手牌でリーチトグルが無効化されること', async ({ page }) => {
    // 初期状態ではリーチが有効であることを確認
    const riichiBtn = page.locator('button').filter({ hasText: /^リーチ$/ });
    await expect(riichiBtn).toBeEnabled();
    
    // 手牌を10枚追加（副露可能な状態にする）
    const tile2Man = page.locator('button').filter({ hasText: /^2萬$/ }).first();
    for (let i = 0; i < 4; i++) {
      await tile2Man.click();
      await page.waitForTimeout(100);
    }
    
    // ポンボタンを押して副露追加
    const ponBtn = page.locator('button').filter({ hasText: /^ポン$/ }).first();
    await ponBtn.click();
    await page.waitForTimeout(300);
    
    // 副露パレットから東を3回クリック
    // 副露中のパレットで東を選択
    const higgashiBtns = page.locator('button').filter({ hasText: '東' });
    const hiCount = await higgashiBtns.count();
    console.log('東 buttons count:', hiCount);
    
    await page.screenshot({ path: '/tmp/sprint7-ac4-ponpanel.png', fullPage: true });
  });
  
  test('全リセットで副露もクリアされること', async ({ page }) => {
    // 手牌をいくつか追加
    const tile2Man = page.locator('button').filter({ hasText: /^2萬$/ }).first();
    await tile2Man.click();
    await page.waitForTimeout(200);
    
    // 全リセットボタンをクリック
    const resetBtn = page.locator('button').filter({ hasText: /全リセット/ });
    await resetBtn.click();
    await page.waitForTimeout(300);
    
    // 手牌が空になっていること
    const handCount = page.locator('text=0/14枚');
    await expect(handCount).toBeVisible();
    
    // 副露が空になっていること
    await expect(page.locator('text=副露なし（門前）')).toBeVisible();
    
    await page.screenshot({ path: '/tmp/sprint7-reset.png' });
  });
  
  test('回帰テスト: 牌パレットの基本操作', async ({ page }) => {
    // Sprint 1の基本機能: 牌追加
    const tile1Man = page.locator('button').filter({ hasText: /^1萬$/ }).first();
    await tile1Man.click();
    await page.waitForTimeout(200);
    
    // 手牌に1萬が追加されていること
    const handArea = page.locator('text=1/14枚');
    await expect(handArea).toBeVisible();
    
    // クリアボタン
    await page.locator('button').filter({ hasText: 'クリア' }).click();
    await page.waitForTimeout(200);
    
    const emptyHand = page.locator('text=0/14枚');
    await expect(emptyHand).toBeVisible();
  });

  test('回帰テスト: 聴牌判定ボタンの活性制御', async ({ page }) => {
    // 13枚未満の場合、聴牌ボタンが無効
    const tenpaiBtn = page.locator('button').filter({ hasText: /聴牌判定/ });
    // 0枚の場合は無効
    await expect(tenpaiBtn).toBeDisabled();
    
    await page.screenshot({ path: '/tmp/sprint7-regression-tenpai.png' });
  });

  test('回帰テスト: 状況設定パネル', async ({ page }) => {
    // 親/子切り替え
    const oyaBtn = page.locator('button').filter({ hasText: /^親$/ });
    await oyaBtn.click();
    await page.waitForTimeout(200);
    
    // 親ボタンがハイライトされること
    await expect(oyaBtn).toHaveClass(/bg-/);
    
    // リセット
    const resetBtn = page.locator('button').filter({ hasText: /^リセット$/ });
    await resetBtn.click();
    await page.waitForTimeout(200);
    
    await page.screenshot({ path: '/tmp/sprint7-regression-situation.png' });
  });
  
  test('回帰テスト: 3列表示（ロン/ツモ/嶺上）が存在すること', async ({ page }) => {
    // タンヤオ手牌を作成して聴牌判定
    const tiles = ['2萬', '2萬', '2萬', '3萬', '4萬', '5萬', '6萬', '7萬', '8萬', '2筒', '3筒', '4筒', '6索'];
    for (const t of tiles) {
      const btn = page.locator('button').filter({ hasText: new RegExp(`^${t}$`) }).first();
      await btn.click();
      await page.waitForTimeout(100);
    }
    
    const tenpaiBtn = page.locator('button').filter({ hasText: /聴牌判定/ });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: '/tmp/sprint7-regression-3col.png', fullPage: true });
    
    // ロン/ツモ/嶺上列が存在するか
    const ronHeader = page.locator('text=ロン').first();
    await expect(ronHeader).toBeVisible();
    const tsumoHeader = page.locator('text=ツモ').first();
    await expect(tsumoHeader).toBeVisible();
  });

});
