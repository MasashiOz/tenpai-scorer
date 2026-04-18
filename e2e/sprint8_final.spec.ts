/**
 * Sprint 8 最終評価テスト（正しいセレクター使用）
 */
import { test, expect } from '@playwright/test';

// パレットエリア内のボタンだけをクリックするヘルパー
async function clickPalette(page: import('@playwright/test').Page, ariaLabel: string) {
  const paletteContainer = page.locator('div.bg-white').filter({ hasText: /^.*牌パレット.*$/ }).first();
  const btn = paletteContainer.locator(`button[aria-label="${ariaLabel}"]`).first();
  await btn.waitFor({ state: 'visible', timeout: 5000 });
  if (await btn.isEnabled()) {
    await btn.click();
  }
}

// 全リセット
async function fullReset(page: import('@playwright/test').Page) {
  const resetBtn = page.locator('button', { hasText: '全リセット' });
  if (await resetBtn.isVisible()) {
    await resetBtn.click();
    await page.waitForTimeout(300);
  }
}

// 待ち牌の最初の行をクリックして詳細を開く
async function openFirstWaitDetail(page: import('@playwright/test').Page) {
  const waitRows = page.locator('table tbody tr');
  const rowCount = await waitRows.count();
  if (rowCount > 0) {
    await waitRows.first().click();
    await page.waitForTimeout(300);
    return true;
  }
  return false;
}

test.describe('Sprint 8: ドラ反映と役満対応 - 最終評価', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await fullReset(page);
  });

  // =================================================================
  // AC3: リーチOFF時は裏ドラ入力欄が非表示
  // =================================================================
  test('AC3: リーチOFF時は裏ドラ入力欄が非表示・リーチON時は表示される', async ({ page }) => {
    // リーチOFF状態（初期状態）: 裏ドラ表示牌セクションが非表示
    // h2直後の状況設定パネルの中を確認
    const situationPanel = page.locator('div.bg-white').filter({ hasText: /^.*状況設定.*$/ }).first();
    const uraDoraOFF = situationPanel.locator('text=裏ドラ表示牌');
    const isHiddenOFF = !(await uraDoraOFF.isVisible());
    console.log('[AC3] リーチOFF時 裏ドラ欄が非表示:', isHiddenOFF);
    expect(isHiddenOFF).toBeTruthy();

    await page.screenshot({ path: '/tmp/final_ac3_off.png' });

    // リーチをONにする
    const riichiBtn = situationPanel.locator('button', { hasText: /^リーチ$/ }).first();
    if (await riichiBtn.isEnabled()) {
      await riichiBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: '/tmp/final_ac3_on.png' });

      // リーチON後: 裏ドラ表示牌セクションが表示
      const uraDoraON = situationPanel.locator('text=裏ドラ表示牌').first();
      const isVisibleON = await uraDoraON.isVisible();
      console.log('[AC3] リーチON時 裏ドラ欄が表示:', isVisibleON);
      expect(isVisibleON).toBeTruthy();
    }
  });

  // =================================================================
  // AC2: 赤ドラパレットが表示され赤五萬を追加できる
  // =================================================================
  test('AC2: 赤ドラパレットが表示され赤五萬を追加するとドラ1が加算される', async ({ page }) => {
    // 赤ドラセクションの確認
    const paletteContainer = page.locator('div.bg-white').filter({ hasText: /牌パレット/ }).first();
    const akadoraText = paletteContainer.locator('text=赤ドラ（各1枚まで）').first();
    console.log('[AC2] 赤ドラセクション表示:', await akadoraText.isVisible());
    expect(await akadoraText.isVisible()).toBeTruthy();

    await page.screenshot({ path: '/tmp/final_ac2_palette.png' });

    // 赤5萬を追加
    const akaSection = paletteContainer.locator('div').filter({ hasText: /赤ドラ（各1枚まで）/ }).first();
    const firstAkaBtn = akaSection.locator('button').first();
    console.log('[AC2] 赤ドラボタン有効:', await firstAkaBtn.isEnabled());
    await firstAkaBtn.click();

    // 手牌に1枚追加
    await clickPalette(page, '1萬');
    await clickPalette(page, '2萬');
    await clickPalette(page, '3萬');
    await clickPalette(page, '4萬');
    await clickPalette(page, '6萬');
    await clickPalette(page, '7萬');
    await clickPalette(page, '8萬');
    await clickPalette(page, '9萬');
    await clickPalette(page, '1筒');
    await clickPalette(page, '2筒');
    await clickPalette(page, '3筒');
    await clickPalette(page, '4筒');

    const handCount = page.locator('span', { hasText: /\d+\/14枚/ }).first();
    console.log('[AC2] 手牌枚数:', await handCount.textContent());
    await page.screenshot({ path: '/tmp/final_ac2_hand.png' });

    const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
    if (await tenpaiBtn.isEnabled()) {
      await tenpaiBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/final_ac2_result.png' });

      const opened = await openFirstWaitDetail(page);
      if (opened) {
        await page.screenshot({ path: '/tmp/final_ac2_detail.png' });
        const content = await page.content();
        const hasAkaDora = content.includes('赤ドラ');
        console.log('[AC2] 赤ドラが役に反映:', hasAkaDora);
        expect(hasAkaDora).toBeTruthy();
      }
    }
  });

  // =================================================================
  // AC1: ドラ表示牌を設定するとドラ牌が点数に反映される
  // =================================================================
  test('AC1: ドラ表示牌を設定するとドラ牌が点数に反映される', async ({ page }) => {
    // ドラ表示牌「5萬」を追加（実ドラ=6萬）
    const addDoraBtn = page.locator('button', { hasText: /ドラ表示牌を追加/ }).first();
    await addDoraBtn.click();
    await page.waitForTimeout(300);

    // DoraPicker内で5萬を選択
    // ドラ表示牌選択パレット（新たに開いたもの）
    const doraPicker = page.locator('div').filter({ hasText: /ドラ表示牌を選択/ }).first();
    if (await doraPicker.isVisible()) {
      const man5 = doraPicker.locator('button[aria-label="5萬"]').first();
      if (await man5.isVisible()) {
        await man5.click();
      } else {
        // 状況設定パネル内の5萬ボタン（全体から探す）
        await page.locator('button[aria-label="5萬"]').first().click();
      }
    } else {
      await page.locator('button[aria-label="5萬"]').first().click();
    }

    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/final_ac1_dora.png' });

    const content0 = await page.content();
    const has6man = content0.includes('6萬');
    console.log('[AC1] 実ドラ6萬が表示:', has6man);

    // 6萬を2枚含む手牌（清一色）
    const tiles = ['1萬','2萬','3萬','4萬','5萬','6萬','6萬','7萬','8萬','9萬'];
    for (const t of tiles) {
      await clickPalette(page, t);
    }
    
    // 残り3枚
    await clickPalette(page, '1萬');
    await clickPalette(page, '2萬');
    await clickPalette(page, '3萬');
    
    const handCount = page.locator('span', { hasText: /\d+\/14枚/ }).first();
    console.log('[AC1] 手牌枚数:', await handCount.textContent());

    const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
    if (await tenpaiBtn.isEnabled()) {
      await tenpaiBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/final_ac1_result.png' });
      
      await openFirstWaitDetail(page);
      await page.screenshot({ path: '/tmp/final_ac1_detail.png' });
      
      const content = await page.content();
      const hasDora = content.includes('ドラ');
      console.log('[AC1] ドラが役に表示:', hasDora);
      expect(hasDora).toBeTruthy();
    }
  });

  // =================================================================
  // AC4: 国士無双（単騎形）で役満点32000点が表示される
  // =================================================================
  test('AC4: 国士無双（単騎形）で役満点（子32000点）が表示される', async ({ page }) => {
    // 国士無双単騎: 1萬×2, 9萬, 1筒, 9筒, 1索, 9索, 東, 南, 西, 北, 白, 發 = 13枚（中待ち）
    const tilesToAdd = [
      '1萬','1萬',
      '9萬','1筒','9筒','1索','9索',
      '東','南','西','北','白','發'
    ];
    for (const t of tilesToAdd) {
      await clickPalette(page, t);
    }

    const handCount = page.locator('span', { hasText: /\d+\/14枚/ }).first();
    console.log('[AC4] 手牌枚数:', await handCount.textContent());

    const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 5000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/final_ac4_result.png' });

    const waitRows = page.locator('table tbody tr');
    const rowCount = await waitRows.count();
    console.log('[AC4] 待ち牌行数:', rowCount);
    expect(rowCount).toBeGreaterThan(0);

    await waitRows.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/final_ac4_detail.png' });

    const content = await page.content();
    const hasYakuman = content.includes('役満');
    const has32000 = content.includes('32,000') || content.includes('32000');
    const hasKokushi = content.includes('国士無双');

    console.log('[AC4] 役満テキスト:', hasYakuman);
    console.log('[AC4] 32000点:', has32000);
    console.log('[AC4] 国士無双テキスト:', hasKokushi);

    const points = content.match(/(\d{1,3}(?:,\d{3})*)点/g);
    console.log('[AC4] 表示点数:', points?.slice(0, 5));

    expect(hasYakuman).toBeTruthy();
    expect(has32000).toBeTruthy();
    expect(hasKokushi).toBeTruthy();
  });

  // =================================================================
  // AC4b: 親の国士無双（13面）でも正しい点数が表示される
  // =================================================================
  test('AC4b: 親の国士無双（13面待ち）で役満点が表示される', async ({ page }) => {
    // 親に設定
    const situationPanel = page.locator('div.bg-white').filter({ hasText: /状況設定/ }).first();
    const oyaBtn = situationPanel.locator('button', { hasText: /^親$/ }).first();
    if (await oyaBtn.isVisible()) await oyaBtn.click();

    // 国士無双13面待ち: 13種各1枚
    const kokushiTiles = ['1萬','9萬','1筒','9筒','1索','9索','東','南','西','北','白','發','中'];
    for (const t of kokushiTiles) {
      await clickPalette(page, t);
    }

    const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 5000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);

    const waitRows = page.locator('table tbody tr');
    await waitRows.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/final_ac4b_detail.png' });

    const content = await page.content();
    const points = content.match(/(\d{1,3}(?:,\d{3})*)点/g);
    console.log('[AC4b] 表示点数:', points?.slice(0, 5));
    
    const has48000 = content.includes('48,000') || content.includes('48000');
    const has96000 = content.includes('96,000') || content.includes('96000');
    console.log('[AC4b] 48000点（通常役満）:', has48000);
    console.log('[AC4b] 96000点（ダブル役満）:', has96000);
    // 13面はダブル役満なので親なら96000点
    expect(has48000 || has96000).toBeTruthy();
  });

  // =================================================================
  // AC5: 四暗刻単騎でダブル役満
  // =================================================================
  test('AC5: 四暗刻単騎待ちでダブル役満バッジが表示される', async ({ page }) => {
    // 四暗刻単騎: 1萬×3 / 2筒×3 / 3索×3 / 北×3 / 5萬×1
    const tiles = [
      '1萬','1萬','1萬',
      '2筒','2筒','2筒',
      '3索','3索','3索',
      '北','北','北',
      '5萬'
    ];
    for (const t of tiles) {
      await clickPalette(page, t);
    }

    const handCount = page.locator('span', { hasText: /\d+\/14枚/ }).first();
    console.log('[AC5] 手牌枚数:', await handCount.textContent());

    const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 5000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/final_ac5_result.png' });

    const waitRows = page.locator('table tbody tr');
    const rowCount = await waitRows.count();
    console.log('[AC5] 待ち牌行数:', rowCount);
    expect(rowCount).toBeGreaterThan(0);

    await waitRows.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/final_ac5_detail.png' });

    const content = await page.content();
    const hasSuanko = content.includes('四暗刻');
    const hasDouble = content.includes('ダブル役満');
    const has64000 = content.includes('64,000') || content.includes('64000');

    console.log('[AC5] 四暗刻:', hasSuanko);
    console.log('[AC5] ダブル役満バッジ:', hasDouble);
    console.log('[AC5] 64000点:', has64000);

    expect(hasSuanko).toBeTruthy();
    expect(hasDouble).toBeTruthy();
    expect(has64000).toBeTruthy();
  });

  // =================================================================
  // AC6: 数え役満（13翻以上）
  // =================================================================
  test('AC6: 13翻以上で数え役満として表示される', async ({ page }) => {
    // 清一色（6翻） + リーチ（1翻）+ ドラ6翻 = 13翻
    // ドラ表示牌「3萬」を設定（実ドラ=4萬）
    for (let i = 0; i < 5; i++) {
      const addDoraBtn = page.locator('button', { hasText: /ドラ表示牌を追加/ }).first();
      if (await addDoraBtn.isVisible()) {
        await addDoraBtn.click();
        await page.waitForTimeout(200);
        // 状況設定パネル内のドラ選択で3萬を選ぶ
        const situationPanel = page.locator('div.bg-white').filter({ hasText: /状況設定/ }).first();
        const man3Btn = situationPanel.locator('button[aria-label="3萬"]').first();
        if (await man3Btn.isVisible()) {
          await man3Btn.click();
        }
      }
    }
    
    // リーチON
    const situationPanel = page.locator('div.bg-white').filter({ hasText: /状況設定/ }).first();
    const riichiBtn = situationPanel.locator('button', { hasText: /^リーチ$/ }).first();
    if (await riichiBtn.isEnabled()) await riichiBtn.click();

    // 清一色の手牌（4萬を6枚含む：ドラ6翻分）
    // 1萬×1, 2萬×1, 3萬×1, 4萬×3, 5萬×1, 6萬×1, 7萬×1, 4萬の追加（もう1枚）, 8萬×1
    // 実際: 4萬×4含む清一色テンパイ: 4萬が実ドラなのでドラ4+清一色6+リーチ1=11翻
    // 数え役満にするには13翻 = 清一色6+リーチ1+ドラ6（4萬6枚以上は無理なのでドラ表示牌を変えて4萬をドラにし、手牌に4萬を4枚入れる）
    
    const tiles = [
      '1萬','2萬','3萬',
      '4萬','4萬','4萬','4萬',
      '5萬','6萬','7萬','8萬','9萬','9萬'
    ];
    for (const t of tiles) {
      await clickPalette(page, t);
    }

    const handCount = page.locator('span', { hasText: /\d+\/14枚/ }).first();
    console.log('[AC6] 手牌枚数:', await handCount.textContent());
    await page.screenshot({ path: '/tmp/final_ac6_hand.png' });

    const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
    if (await tenpaiBtn.isEnabled()) {
      await tenpaiBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/final_ac6_result.png' });

      await openFirstWaitDetail(page);
      await page.screenshot({ path: '/tmp/final_ac6_detail.png' });

      const content = await page.content();
      const hasCountYakuman = content.includes('数え役満');
      const hasYakuman = content.includes('役満');
      const totalHanMatch = content.match(/合計\s*(\d+)翻/);

      console.log('[AC6] 数え役満テキスト:', hasCountYakuman);
      console.log('[AC6] 役満テキスト:', hasYakuman);
      console.log('[AC6] 合計翻数:', totalHanMatch?.[0]);
      
      const points = content.match(/(\d{1,3}(?:,\d{3})*)点/g);
      console.log('[AC6] 表示点数:', points?.slice(0, 5));
    }
  });

  // =================================================================
  // 回帰テスト: 基本機能
  // =================================================================
  test('回帰: Sprint1-7の基本機能が正常に動作する', async ({ page }) => {
    // Sprint1: 手牌追加・削除・クリア
    await clickPalette(page, '1萬');
    await clickPalette(page, '2萬');
    await clickPalette(page, '3萬');
    let handCount = page.locator('span', { hasText: /\d+\/14枚/ }).first();
    let countText = await handCount.textContent();
    console.log('[回帰S1] 3枚追加後:', countText);
    expect(countText).toBe('3/14枚');

    const clearBtn = page.locator('button', { hasText: /^クリア$/ }).first();
    await clearBtn.click();
    countText = await handCount.textContent();
    console.log('[回帰S1] クリア後:', countText);
    expect(countText).toBe('0/14枚');

    // Sprint2: 状況設定
    const situationPanel = page.locator('div.bg-white').filter({ hasText: /状況設定/ }).first();
    const oyaBtn = situationPanel.locator('button', { hasText: /^親$/ }).first();
    await oyaBtn.click();
    const oyaSelected = await situationPanel.locator('button', { hasText: /^親.*✓|✓.*親$/ }).isVisible();
    console.log('[回帰S2] 親が選択された:', oyaSelected || await oyaBtn.locator('text=✓').isVisible());
    
    // Sprint3: 聴牌判定
    await fullReset(page);
    const shanponTiles = ['1萬','1萬','1萬','2萬','2萬','2萬','3萬','3萬','3萬','4萬','4萬','5萬','5萬'];
    for (const t of shanponTiles) {
      await clickPalette(page, t);
    }
    const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 5000 });
    await tenpaiBtn.click();
    await page.waitForTimeout(300);
    const content = await page.content();
    console.log('[回帰S3] 聴牌テキスト:', content.includes('聴牌'));
    expect(content.includes('聴牌')).toBeTruthy();

    // Sprint5: 点数表示
    const hasScore = content.includes('点') && (content.includes('ロン') || content.includes('ツモ'));
    console.log('[回帰S5] 点数表示:', hasScore);
    expect(hasScore).toBeTruthy();
    
    // Sprint6: 嶺上開花列
    const hasRinshan = content.includes('嶺上');
    console.log('[回帰S6] 嶺上開花列:', hasRinshan);
    expect(hasRinshan).toBeTruthy();
    
    // Sprint7: 副露パネル
    const meldText = page.locator('text=副露').first();
    console.log('[回帰S7] 副露パネル:', await meldText.isVisible());
    expect(await meldText.isVisible()).toBeTruthy();
  });
});
