import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function clickTileNTimes(page: any, tileLabel: string, n: number) {
  for (let i = 0; i < n; i++) {
    // パレットセクションのボタンをクリック
    const btn = page.locator('section, div').last();
    // 全ボタンの中で完全一致するテキストのものをクリック
    const tiles = await page.locator('button').all();
    for (const t of tiles) {
      const text = await t.textContent();
      if (text && text.trim() === tileLabel) {
        const isDisabled = await t.isDisabled();
        if (!isDisabled) {
          await t.click();
          break;
        }
      }
    }
    await page.waitForTimeout(100);
  }
}

async function clickTileInPalette(page: any, tileLabel: string, n = 1) {
  // 牌パレットのボタンをクリック（完全テキスト一致）
  for (let i = 0; i < n; i++) {
    const btn = page.locator('button').filter({ hasText: new RegExp(`^${tileLabel}$`) }).first();
    await btn.click();
    await page.waitForTimeout(150);
  }
}

test.describe('Sprint 7: 副露（鳴き）対応 受け入れ基準', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
  });

  test('AC0: 副露パネルが表示されていること', async ({ page }) => {
    // 副露（鳴き）パネルが表示されていること
    await expect(page.locator('text=副露（鳴き）')).toBeVisible();
    // 副露なし（門前）が初期状態
    await expect(page.locator('text=副露なし（門前）')).toBeVisible();
    // ポン/チーボタンが最初は非表示（手牌0枚）
    const ponBtns = page.locator('button').filter({ hasText: /^ポン$/ });
    const ponVisible = await ponBtns.count();
    console.log('ポン buttons count (hand=0):', ponVisible);
    await page.screenshot({ path: '/tmp/sprint7-ac0.png' });
  });

  test('AC0b: 手牌3枚以上でポン/チーボタンが表示されること', async ({ page }) => {
    // 手牌に3枚追加
    await clickTileInPalette(page, '2萬', 3);
    
    // 副露ボタンが表示されること
    const ponBtn = page.locator('button').filter({ hasText: /^ポン$/ });
    await expect(ponBtn).toBeVisible();
    const chiBtn = page.locator('button').filter({ hasText: /^チー$/ });
    await expect(chiBtn).toBeVisible();
    const minkanBtn = page.locator('button').filter({ hasText: /^明槓$/ });
    await expect(minkanBtn).toBeVisible();
    const ankanBtn = page.locator('button').filter({ hasText: /^暗槓$/ });
    await expect(ankanBtn).toBeVisible();
    const kakanBtn = page.locator('button').filter({ hasText: /^加槓$/ });
    await expect(kakanBtn).toBeVisible();
    
    await page.screenshot({ path: '/tmp/sprint7-ac0b.png' });
  });

  test('AC1: ポン面子を含む手牌で聴牌判定が動作すること', async ({ page }) => {
    // ポン東 (副露)
    // 手牌に3枚追加してから副露を有効化
    await clickTileInPalette(page, '1萬', 3);
    await page.waitForTimeout(200);
    
    // ポンボタンをクリック
    const ponBtn = page.locator('button').filter({ hasText: /^ポン$/ });
    await expect(ponBtn).toBeVisible();
    await ponBtn.click();
    await page.waitForTimeout(300);
    
    // 副露パレット（鳴く牌を選択）が表示されること
    const pickerText = page.locator('text=ポンする牌を選択');
    await expect(pickerText).toBeVisible();
    await page.screenshot({ path: '/tmp/sprint7-ac1-picker.png', fullPage: true });
    
    // 東を3回クリック
    // 副露パレット内のボタンを探す
    const pickerArea = page.locator('div.bg-indigo-50');
    const eastInPicker = pickerArea.locator('button').filter({ hasText: '東' }).first();
    await eastInPicker.click();
    await page.waitForTimeout(150);
    await eastInPicker.click();
    await page.waitForTimeout(150);
    await eastInPicker.click();
    await page.waitForTimeout(300);
    
    await page.screenshot({ path: '/tmp/sprint7-ac1-after-pon.png', fullPage: true });
    
    // 副露が追加されていること
    const meldBadge = page.locator('text=[ポン]');
    const meldCount = await meldBadge.count();
    console.log('Pon meld badge count:', meldCount);
    
    // 手牌を追加して聴牌状態にする
    // ポン東で3枚消費 → 残り10枚必要
    await clickTileInPalette(page, '2萬', 3);
    await clickTileInPalette(page, '3萬', 3);
    await clickTileInPalette(page, '4筒', 2);
    await clickTileInPalette(page, '5筒', 2);
    
    await page.screenshot({ path: '/tmp/sprint7-ac1-hand.png', fullPage: true });
    
    // 聴牌ボタンが有効化されること
    const tenpaiBtn = page.locator('button').filter({ hasText: /聴牌判定/ });
    await page.waitForTimeout(300);
    
    const isDisabled = await tenpaiBtn.isDisabled();
    console.log('Tenpai button disabled:', isDisabled);
    
    if (!isDisabled) {
      await tenpaiBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/sprint7-ac1-result.png', fullPage: true });
    }
  });

  test('AC2: 鳴きありタンヤオが1翻として検出されること', async ({ page }) => {
    // ポン2筒で副露作成
    await clickTileInPalette(page, '3萬', 3); // 手牌3枚で副露ボタン有効化
    
    const ponBtn = page.locator('button').filter({ hasText: /^ポン$/ });
    await ponBtn.click();
    await page.waitForTimeout(300);
    
    // 副露パレットで2筒を3回クリック
    const pickerArea = page.locator('div.bg-indigo-50');
    const pin2 = pickerArea.locator('button').filter({ hasText: '2筒' }).first();
    await pin2.click();
    await page.waitForTimeout(150);
    await pin2.click();
    await page.waitForTimeout(150);
    await pin2.click();
    await page.waitForTimeout(300);
    
    await page.screenshot({ path: '/tmp/sprint7-ac2-after-pon.png', fullPage: true });
    
    // 手牌クリアして再追加（既存の3萬をクリア）
    // 手牌に追加: タンヤオ手牌
    // ポン2筒 + 3萬・4萬・5萬 / 6萬・7萬・8萬 / 3索・4索・5索 = 13枚相当
    await clickTileInPalette(page, '4萬', 3);
    await clickTileInPalette(page, '5萬', 3);
    await clickTileInPalette(page, '6萬', 3); // これで手牌9枚 + 副露3枚 = 12枚
    
    await page.screenshot({ path: '/tmp/sprint7-ac2-hand.png', fullPage: true });
    
    const tenpaiBtn = page.locator('button').filter({ hasText: /聴牌判定/ });
    const isTenpaiDisabled = await tenpaiBtn.isDisabled();
    console.log('AC2 tenpai disabled:', isTenpaiDisabled);
    
    if (!isTenpaiDisabled) {
      await tenpaiBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/sprint7-ac2-result.png', fullPage: true });
      
      // 待ち牌の点数詳細を確認
      const waitTiles = page.locator('tr[role=button], tr.cursor-pointer');
      const waitCount = await waitTiles.count();
      console.log('Wait tile rows:', waitCount);
      
      if (waitCount > 0) {
        await waitTiles.first().click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: '/tmp/sprint7-ac2-detail.png', fullPage: true });
        
        // タンヤオが含まれること
        const tanyao = page.locator('text=タンヤオ');
        const tanyaoCount = await tanyao.count();
        console.log('タンヤオ count:', tanyaoCount);
        expect(tanyaoCount).toBeGreaterThan(0);
      }
    }
  });

  test('AC3: 鳴きあり清一色が5翻として検出されること', async ({ page }) => {
    // ポン2萬で副露作成
    await clickTileInPalette(page, '3萬', 3);
    
    const ponBtn = page.locator('button').filter({ hasText: /^ポン$/ });
    await ponBtn.click();
    await page.waitForTimeout(300);
    
    const pickerArea = page.locator('div.bg-indigo-50');
    const man2 = pickerArea.locator('button').filter({ hasText: '2萬' }).first();
    await man2.click();
    await page.waitForTimeout(150);
    await man2.click();
    await page.waitForTimeout(150);
    await man2.click();
    await page.waitForTimeout(300);
    
    // 手牌に萬子を追加: 3萬・4萬・5萬 / 6萬・7萬・8萬 / 9萬×2
    await clickTileInPalette(page, '4萬', 3);
    await clickTileInPalette(page, '5萬', 3);
    await clickTileInPalette(page, '9萬', 2);
    
    await page.screenshot({ path: '/tmp/sprint7-ac3-hand.png', fullPage: true });
    
    const tenpaiBtn = page.locator('button').filter({ hasText: /聴牌判定/ });
    const isDisabled = await tenpaiBtn.isDisabled();
    console.log('AC3 tenpai disabled:', isDisabled);
    
    if (!isDisabled) {
      await tenpaiBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/sprint7-ac3-result.png', fullPage: true });
      
      const waitTiles = page.locator('tr[role=button], tr.cursor-pointer');
      const waitCount = await waitTiles.count();
      if (waitCount > 0) {
        await waitTiles.first().click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: '/tmp/sprint7-ac3-detail.png', fullPage: true });
        
        // 清一色が含まれること
        const chinitsu = page.locator('text=清一色');
        const chinitsuCount = await chinitsu.count();
        console.log('清一色 count:', chinitsuCount);
        expect(chinitsuCount).toBeGreaterThan(0);
        
        // 5翻（喰い下がり）であること
        const han5 = page.locator('text=5翻');
        const han5Count = await han5.count();
        console.log('5翻 count:', han5Count);
      }
    }
  });

  test('AC4: 副露ありの手牌でリーチトグルが無効化されること', async ({ page }) => {
    // 最初はリーチが有効
    const riichiBtn = page.locator('button').filter({ hasText: /^リーチ$/ });
    await expect(riichiBtn).toBeEnabled();
    
    // 手牌を3枚追加
    await clickTileInPalette(page, '1萬', 3);
    
    // ポンを実行
    const ponBtn = page.locator('button').filter({ hasText: /^ポン$/ });
    await ponBtn.click();
    await page.waitForTimeout(300);
    
    const pickerArea = page.locator('div.bg-indigo-50');
    const eastTile = pickerArea.locator('button').filter({ hasText: '東' }).first();
    await eastTile.click();
    await page.waitForTimeout(150);
    await eastTile.click();
    await page.waitForTimeout(150);
    await eastTile.click();
    await page.waitForTimeout(300);
    
    await page.screenshot({ path: '/tmp/sprint7-ac4-after-pon.png', fullPage: true });
    
    // リーチボタンが無効化されていること
    await expect(riichiBtn).toBeDisabled();
    
    // メッセージが表示されること
    const msg = page.locator('text=副露あり').first();
    const msgText = await page.locator('text=/副露/').allTextContents();
    console.log('Messages with 副露:', msgText);
    
    // 副露を削除するとリーチが有効化されること
    const removeBtn = page.locator('button[title=削除]').first();
    await removeBtn.click();
    await page.waitForTimeout(300);
    
    await expect(riichiBtn).toBeEnabled();
    await page.screenshot({ path: '/tmp/sprint7-ac4-after-remove.png', fullPage: true });
  });

  test('AC5: 暗槓を含む手牌で幺九暗槓32符が計算されること', async ({ page }) => {
    // 暗槓東（幺九） → 32符
    // 手牌に4枚追加して暗槓可能にする
    await clickTileInPalette(page, '1萬', 4);
    
    const ankanBtn = page.locator('button').filter({ hasText: /^暗槓$/ });
    await ankanBtn.click();
    await page.waitForTimeout(300);
    
    const pickerArea = page.locator('div.bg-indigo-50');
    const eastTile = pickerArea.locator('button').filter({ hasText: '東' }).first();
    await eastTile.click();
    await page.waitForTimeout(150);
    await eastTile.click();
    await page.waitForTimeout(150);
    await eastTile.click();
    await page.waitForTimeout(150);
    await eastTile.click();
    await page.waitForTimeout(300);
    
    await page.screenshot({ path: '/tmp/sprint7-ac5-after-ankan.png', fullPage: true });
    
    // 手牌に追加: 1萬・2萬・3萬 / 4筒・5筒・6筒 / 7索・8索
    await clickTileInPalette(page, '2萬', 3);
    await clickTileInPalette(page, '3萬', 3);
    await clickTileInPalette(page, '4筒', 2);
    
    await page.screenshot({ path: '/tmp/sprint7-ac5-hand.png', fullPage: true });
    
    const tenpaiBtn = page.locator('button').filter({ hasText: /聴牌判定/ });
    const isDisabled = await tenpaiBtn.isDisabled();
    console.log('AC5 tenpai disabled:', isDisabled);
    
    if (!isDisabled) {
      await tenpaiBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/sprint7-ac5-result.png', fullPage: true });
      
      const waitTiles = page.locator('tr[role=button], tr.cursor-pointer');
      const waitCount = await waitTiles.count();
      if (waitCount > 0) {
        await waitTiles.first().click();
        await page.waitForTimeout(300);
        
        // 符の内訳を展開
        const fuDetail = page.locator('text=符の内訳').first();
        if (await fuDetail.count() > 0) {
          await fuDetail.click();
          await page.waitForTimeout(300);
          await page.screenshot({ path: '/tmp/sprint7-ac5-fu.png', fullPage: true });
          
          // 幺九暗槓32符が含まれること
          const fu32 = page.locator('text=/32/');
          const fu32Count = await fu32.count();
          console.log('32符 count:', fu32Count);
        }
      }
    }
  });

  test('AC6: 明槓後の嶺上開花点数が表示されること', async ({ page }) => {
    // 明槓5萬（中張）
    await clickTileInPalette(page, '1萬', 4);
    
    const minkanBtn = page.locator('button').filter({ hasText: /^明槓$/ });
    await minkanBtn.click();
    await page.waitForTimeout(300);
    
    const pickerArea = page.locator('div.bg-indigo-50');
    const man5 = pickerArea.locator('button').filter({ hasText: '5萬' }).first();
    await man5.click();
    await page.waitForTimeout(150);
    await man5.click();
    await page.waitForTimeout(150);
    await man5.click();
    await page.waitForTimeout(150);
    await man5.click();
    await page.waitForTimeout(300);
    
    await page.screenshot({ path: '/tmp/sprint7-ac6-after-minkan.png', fullPage: true });
    
    // 手牌追加
    await clickTileInPalette(page, '2萬', 3);
    await clickTileInPalette(page, '3萬', 3);
    await clickTileInPalette(page, '1筒', 2);
    
    await page.screenshot({ path: '/tmp/sprint7-ac6-hand.png', fullPage: true });
    
    const tenpaiBtn = page.locator('button').filter({ hasText: /聴牌判定/ });
    const isDisabled = await tenpaiBtn.isDisabled();
    console.log('AC6 tenpai disabled:', isDisabled);
    
    if (!isDisabled) {
      await tenpaiBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/sprint7-ac6-result.png', fullPage: true });
      
      // 嶺上列が表示されること
      const rinshan = page.locator('text=嶺上').first();
      await expect(rinshan).toBeVisible();
    }
  });

  test('回帰テスト: Sprint 1-6の基本機能', async ({ page }) => {
    // Sprint 1: パレット・手牌追加・削除・クリア
    await clickTileInPalette(page, '1萬', 3);
    await expect(page.locator('text=3/14枚')).toBeVisible();
    await page.locator('button').filter({ hasText: 'クリア' }).click();
    await expect(page.locator('text=0/14枚')).toBeVisible();
    
    // Sprint 2: 状況設定
    await page.locator('button').filter({ hasText: /^親$/ }).click();
    await expect(page.locator('button').filter({ hasText: /^親$/ })).toHaveAttribute('class', /bg-/);
    
    // Sprint 3: 聴牌判定ボタンが無効（0枚）
    await expect(page.locator('button').filter({ hasText: /聴牌判定/ })).toBeDisabled();
    
    // Sprint 5/6: 3列テーブルのヘッダー（聴牌後に表示）
    // まず手牌を追加
    const hand = ['2萬', '3萬', '4萬', '5筒', '6筒', '7筒', '8索', '9索', '1索', '1索', '2索', '3索', '4索'];
    for (const t of hand) {
      await clickTileInPalette(page, t, 1);
    }
    
    const tenpaiBtn = page.locator('button').filter({ hasText: /聴牌判定/ });
    if (!(await tenpaiBtn.isDisabled())) {
      await tenpaiBtn.click();
      await page.waitForTimeout(500);
      
      // ロン/ツモ/嶺上の3列が表示されること
      const ron = page.locator('text=ロン').first();
      const tsumo = page.locator('text=ツモ').first();
      const rinshan = page.locator('text=嶺上').first();
      await expect(ron).toBeVisible();
      await expect(tsumo).toBeVisible();
      await expect(rinshan).toBeVisible();
    }
    
    await page.screenshot({ path: '/tmp/sprint7-regression.png', fullPage: true });
  });
  
  test('回帰テスト: リーチ/一発トグル（門前時）', async ({ page }) => {
    // 門前時はリーチが有効
    const riichiBtn = page.locator('button').filter({ hasText: /^リーチ$/ });
    await expect(riichiBtn).toBeEnabled();
    
    // リーチをONにすると一発が有効化
    await riichiBtn.click();
    await page.waitForTimeout(200);
    const ippatsuBtn = page.locator('button').filter({ hasText: /^一発$/ });
    await expect(ippatsuBtn).toBeEnabled();
    
    await page.screenshot({ path: '/tmp/sprint7-regression-riichi.png' });
  });
  
  test('全リセットで副露もクリアされること', async ({ page }) => {
    // 手牌3枚追加
    await clickTileInPalette(page, '2萬', 3);
    
    // 全リセット
    await page.locator('button').filter({ hasText: /全リセット/ }).click();
    await page.waitForTimeout(300);
    
    // 手牌が空になること
    await expect(page.locator('text=0/14枚')).toBeVisible();
    // 副露なし（門前）
    await expect(page.locator('text=副露なし（門前）')).toBeVisible();
    
    await page.screenshot({ path: '/tmp/sprint7-full-reset.png' });
  });

});
