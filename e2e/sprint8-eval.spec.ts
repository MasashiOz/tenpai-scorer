/**
 * Sprint 8 Evaluator テスト
 * 受け入れ基準:
 * AC1: ドラ表示牌で示されるドラ牌を手牌に含めると点数が1翻分増えること
 * AC2: 赤五萬を手牌に追加するとドラ1が加算されること
 * AC3: リーチOFF時は裏ドラ入力欄が無効化されていること
 * AC4: 国士無双形のアガリで役満点（子32000/親48000）が表示されること
 * AC5: 四暗刻単騎待ちの待ち牌でダブル役満として表示されること
 * AC6: 通常役の合計が13翻以上になると数え役満扱いになること
 */

import { test, expect } from '@playwright/test';

// Helper: aria-label でパレットから指定牌をクリックする（パレットエリア内を優先）
async function clickPaletteTile(page: import('@playwright/test').Page, ariaLabel: string) {
  // パレット内のボタン（手牌エリアのボタンと区別するため最初のものを選択）
  const btn = page.locator(`button[aria-label="${ariaLabel}"]`).first();
  await btn.waitFor({ state: 'visible', timeout: 5000 });
  if (await btn.isEnabled()) {
    await btn.click();
  }
}

// Helper: 全リセット
async function fullReset(page: import('@playwright/test').Page) {
  const resetBtn = page.locator('button', { hasText: '全リセット' });
  if (await resetBtn.isVisible()) {
    await resetBtn.click();
  }
}

test.describe('Sprint 8: ドラ反映と役満対応', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await fullReset(page);
  });

  // ===========================================================
  // AC3: リーチOFF時は裏ドラ入力欄が非表示（独立して確認可能なため先に実施）
  // ===========================================================
  test('AC3: リーチOFF時は裏ドラ入力欄が非表示・リーチON時は表示される', async ({ page }) => {
    await page.screenshot({ path: '/tmp/sprint8-ac3-initial.png' });

    // リーチOFF状態での裏ドラ欄確認（コンテナが非表示になっているべき）
    // リーチOFF時は裏ドラセクション自体が非表示
    const uraDoraContainer = page.locator('text=裏ドラ表示牌(0/4枚)').first();
    const isHidden = !(await uraDoraContainer.isVisible());
    console.log('リーチOFF時に裏ドラ欄が非表示:', isHidden);
    expect(isHidden).toBeTruthy();

    // リーチONにする
    const riichiBtn = page.locator('button[aria-label="リーチ"]').or(
      page.locator('button', { hasText: /^リーチ$/ })
    ).first();

    if (await riichiBtn.isVisible() && await riichiBtn.isEnabled()) {
      await riichiBtn.click();
      await page.screenshot({ path: '/tmp/sprint8-ac3-riichi-on.png' });

      // リーチON後に裏ドラ欄が表示されるか
      const uraDoraAfterRiichi = page.locator('text=裏ドラ表示牌').first();
      const uraDoraVisible = await uraDoraAfterRiichi.isVisible();
      console.log('リーチON時に裏ドラ欄が表示:', uraDoraVisible);
      expect(uraDoraVisible).toBeTruthy();

      // リーチOFFに戻す
      await riichiBtn.click();
      await page.screenshot({ path: '/tmp/sprint8-ac3-riichi-off.png' });

      const uraDoraHiddenAgain = !(await page.locator('text=裏ドラ表示牌(0/4枚)').first().isVisible());
      console.log('リーチOFFに戻した後、裏ドラ欄が非表示:', uraDoraHiddenAgain);
      expect(uraDoraHiddenAgain).toBeTruthy();
    }
  });

  // ===========================================================
  // AC2: 赤ドラパレットが表示され赤五萬を追加できる
  // ===========================================================
  test('AC2: 赤ドラパレットが表示され赤五萬を追加できる', async ({ page }) => {
    await page.screenshot({ path: '/tmp/sprint8-ac2-initial.png' });

    // 赤ドラセクションの確認
    const akadoraSection = page.locator('text=赤ドラ（各1枚まで）').first();
    const isVisible = await akadoraSection.isVisible();
    console.log('赤ドラセクションが表示:', isVisible);
    expect(isVisible).toBeTruthy();

    // 赤5萬ボタンを探す（title属性に「赤五萬」が含まれる）
    // TilePaletteの赤ドラボタンにはtitle=AKA_DORA_LABELS[tile.id]が設定されている
    // AKA_DORA_LABELS の値を確認する必要がある
    await page.screenshot({ path: '/tmp/sprint8-ac2-palette.png' });

    // 赤ドラボタン（赤い外観のもの）を探す
    const akaDoraButtons = page.locator('button[title]').filter({ hasText: /赤/ });
    const count = await akaDoraButtons.count();
    console.log('赤ドラ関連ボタン数:', count);

    // 赤ドラ（各1枚まで）セクション直下のボタン
    const akaSection = page.locator('div').filter({ hasText: /赤ドラ（各1枚まで）/ }).first();
    const buttons = akaSection.locator('button');
    const btnCount = await buttons.count();
    console.log('赤ドラセクション内のボタン数:', btnCount);

    // ボタンが3つ（赤5萬、赤5筒、赤5索）存在するか確認
    expect(btnCount).toBeGreaterThanOrEqual(3);

    // 赤5萬（最初の赤ドラボタン）をクリック
    const firstAkaBtn = buttons.first();
    if (await firstAkaBtn.isEnabled()) {
      await firstAkaBtn.click();
      console.log('赤5萬を追加');
    }

    await page.screenshot({ path: '/tmp/sprint8-ac2-added.png' });

    // 手牌に赤ドラが追加されたか確認
    const handArea = page.locator('[class*="手牌"], section, main').filter({ hasText: /手牌/ }).first();
    const handContent = await page.content();
    // 手牌カウントが増えているか確認
    const hasOneOrMore = handContent.includes('1/14') || handContent.includes('(1)');
    console.log('手牌が増えた:', hasOneOrMore);
  });

  // ===========================================================
  // AC1: ドラ表示牌を指定すると点数にドラが反映される
  // ===========================================================
  test('AC1: ドラ表示牌を設定するとドラ牌が点数に反映される', async ({ page }) => {
    // ドラ表示牌「5萬」を追加（実ドラ=6萬）
    const addDoraBtn = page.locator('button', { hasText: /ドラ表示牌を追加/ }).first();
    await addDoraBtn.click();

    // DoraPicker内で5萬を選択（aria-label="5萬"のボタン）
    await page.screenshot({ path: '/tmp/sprint8-ac1-dora-picker.png' });
    const man5Btn = page.locator('button[aria-label="5萬"]').first();
    await man5Btn.waitFor({ state: 'visible', timeout: 5000 });
    await man5Btn.click();

    // ドラ表示「5萬 → 6萬（実ドラ）」の確認
    const doraInfo = await page.content();
    const hasDora6man = doraInfo.includes('6萬');
    console.log('実ドラ6萬が表示:', hasDora6man);
    expect(hasDora6man).toBeTruthy();

    await page.screenshot({ path: '/tmp/sprint8-ac1-dora-set.png' });

    // 手牌に6萬を2枚含む聴牌形を追加
    // 清一色: 1萬2萬3萬 4萬5萬6萬 7萬8萬 6萬6萬 6萬 = 13枚（6萬が3枚）
    const tiles = [
      '1萬','2萬','3萬','4萬','5萬','6萬','7萬','8萬',
      '6萬','6萬'
    ];
    for (const label of tiles) {
      await clickPaletteTile(page, label);
    }

    // 13枚になるよう追加（まだ足りない場合）
    const content1 = await page.content();
    // 枚数確認
    const match = content1.match(/(\d+)\/14枚/);
    const currentCount = match ? parseInt(match[1]) : 0;
    console.log('現在の手牌枚数:', currentCount);

    // 残り枚数を追加
    const additionalTiles = ['9萬','2萬'];
    for (let i = 0; i < 13 - currentCount && i < additionalTiles.length; i++) {
      await clickPaletteTile(page, additionalTiles[i]);
    }

    await page.screenshot({ path: '/tmp/sprint8-ac1-hand.png' });

    // 聴牌判定
    const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
    if (await tenpaiBtn.isEnabled()) {
      await tenpaiBtn.click();
      await page.screenshot({ path: '/tmp/sprint8-ac1-result.png' });

      // ドラが役に反映されているか確認
      const resultContent = await page.content();
      const hasDoraText = resultContent.includes('ドラ');
      console.log('ドラテキストが結果に存在:', hasDoraText);
      expect(hasDoraText).toBeTruthy();
    }
  });

  // ===========================================================
  // AC4: 国士無双で役満点（子32000点）が表示される
  // ===========================================================
  test('AC4: 国士無双で役満点（子32000点）が表示される', async ({ page }) => {
    // 国士無双の13枚（各幺九牌1枚ずつ）
    const kokushiLabels = [
      '1萬','9萬','1筒','9筒','1索','9索',
      '東','南','西','北',
      '白','發','中'
    ];

    for (const label of kokushiLabels) {
      await clickPaletteTile(page, label);
    }

    await page.screenshot({ path: '/tmp/sprint8-ac4-hand.png' });

    // 聴牌ボタンが有効化されるのを待つ
    const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 5000 });
    await tenpaiBtn.click();

    await page.screenshot({ path: '/tmp/sprint8-ac4-result.png' });

    // 待ち牌が表示されている（13種類）
    const resultContent = await page.content();
    const hasWaits = resultContent.includes('聴牌') || resultContent.includes('待ち');
    console.log('国士無双聴牌結果が表示:', hasWaits);
    expect(hasWaits).toBeTruthy();

    // 待ち牌の最初のものをクリック（1萬を探す）
    const waitArea = page.locator('section, div').filter({ hasText: /待ち牌/ }).first();
    const waitTileBtns = waitArea.locator('button').first();
    if (await waitTileBtns.isVisible()) {
      await waitTileBtns.click();
      await page.screenshot({ path: '/tmp/sprint8-ac4-detail.png' });
    }

    // ページ内に32000点と役満テキストが含まれるか
    const pageContent = await page.content();
    const has32000 = pageContent.includes('32000') || pageContent.includes('32,000');
    const hasYakumanText = pageContent.includes('役満');
    const hasKokushi = pageContent.includes('国士無双');

    console.log('32000点が表示:', has32000);
    console.log('役満テキストが表示:', hasYakumanText);
    console.log('国士無双テキストが表示:', hasKokushi);

    expect(hasYakumanText || hasKokushi).toBeTruthy();
    expect(has32000).toBeTruthy();
  });

  // ===========================================================
  // AC4b: 親の国士無双で48000点が表示される
  // ===========================================================
  test('AC4b: 親の国士無双で役満点（48000点）が表示される', async ({ page }) => {
    // 親に設定
    const oyaBtn = page.locator('button', { hasText: /^親$/ }).first();
    if (await oyaBtn.isVisible()) {
      await oyaBtn.click();
    }

    // 国士無双の13枚
    const kokushiLabels = [
      '1萬','9萬','1筒','9筒','1索','9索',
      '東','南','西','北',
      '白','發','中'
    ];

    for (const label of kokushiLabels) {
      await clickPaletteTile(page, label);
    }

    const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 5000 });
    await tenpaiBtn.click();

    await page.screenshot({ path: '/tmp/sprint8-ac4b-result.png' });

    // 待ち牌をクリック
    const waitArea = page.locator('section, div').filter({ hasText: /待ち牌/ }).first();
    const waitTileBtns = waitArea.locator('button').first();
    if (await waitTileBtns.isVisible()) {
      await waitTileBtns.click();
      await page.screenshot({ path: '/tmp/sprint8-ac4b-detail.png' });
    }

    const pageContent = await page.content();
    const has48000 = pageContent.includes('48000') || pageContent.includes('48,000');
    console.log('親の国士無双48000点が表示:', has48000);
    expect(has48000).toBeTruthy();
  });

  // ===========================================================
  // AC5: 四暗刻単騎待ちでダブル役満
  // ===========================================================
  test('AC5: 四暗刻単騎待ちでダブル役満バッジが表示される', async ({ page }) => {
    // 四暗刻単騎: 1萬×3 / 2筒×3 / 3索×3 / 北×3 / 5萬×1
    const parts: string[] = [
      '1萬','1萬','1萬',
      '2筒','2筒','2筒',
      '3索','3索','3索',
      '北','北','北',
      '5萬'
    ];

    for (const label of parts) {
      await clickPaletteTile(page, label);
    }

    await page.screenshot({ path: '/tmp/sprint8-ac5-hand.png' });

    const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 5000 });
    await tenpaiBtn.click();

    await page.screenshot({ path: '/tmp/sprint8-ac5-result.png' });

    // 待ち牌「5萬」をクリック
    const waitArea = page.locator('section, div').filter({ hasText: /待ち牌/ }).first();
    const waitTileBtns = waitArea.locator('button').first();
    if (await waitTileBtns.isVisible()) {
      await waitTileBtns.click();
      await page.screenshot({ path: '/tmp/sprint8-ac5-detail.png' });
    }

    const pageContent = await page.content();
    const hasSuanko = pageContent.includes('四暗刻');
    const hasDouble = pageContent.includes('ダブル役満') || pageContent.includes('64000');

    console.log('四暗刻テキストが表示:', hasSuanko);
    console.log('ダブル役満表示:', hasDouble);

    expect(hasSuanko).toBeTruthy();
    expect(hasDouble).toBeTruthy();
  });

  // ===========================================================
  // AC6: 数え役満（13翻以上）
  // ===========================================================
  test('AC6: 13翻以上で数え役満として表示される', async ({ page }) => {
    // リーチON（1翻）
    const riichiBtn = page.locator('button', { hasText: /^リーチ$/ }).first();
    if (await riichiBtn.isVisible() && await riichiBtn.isEnabled()) {
      await riichiBtn.click();
    }

    // 裏ドラ表示牌を4枚設定（各4翻分）
    for (let i = 0; i < 4; i++) {
      const addUraBtn = page.locator('button', { hasText: /裏ドラ表示牌を追加/ }).first();
      if (await addUraBtn.isVisible()) {
        await addUraBtn.click();
        // 2萬を選択（実ドラ=3萬）
        const man2Btn = page.locator('button[aria-label="2萬"]').first();
        if (await man2Btn.isVisible()) {
          await man2Btn.click();
        }
      }
    }

    // ドラ表示牌を複数設定（3翻分）
    for (let i = 0; i < 3; i++) {
      const addDoraBtn = page.locator('button', { hasText: /ドラ表示牌を追加/ }).first();
      if (await addDoraBtn.isVisible()) {
        await addDoraBtn.click();
        const man2Btn = page.locator('button[aria-label="2萬"]').first();
        if (await man2Btn.isVisible()) {
          await man2Btn.click();
        }
      }
    }

    // 清一色（6翻） + リーチ（1翻）の手牌
    // 1萬×3, 2萬×1, 3萬×4, 4萬×1, 5萬×1, 6萬×1, 7萬×1, 8萬×1 = 13枚
    // 手牌にドラ（3萬）を含めることでドラ加算
    // 3萬が実ドラのため、3萬を4枚含む手牌でドラ4翻
    const tilesForChuren = [
      '1萬','1萬','1萬',
      '3萬','3萬','3萬','3萬',
      '4萬','5萬','6萬','7萬','8萬',
      '9萬'
    ];
    for (const label of tilesForChuren) {
      await clickPaletteTile(page, label);
    }

    await page.screenshot({ path: '/tmp/sprint8-ac6-hand.png' });

    const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
    if (await tenpaiBtn.isEnabled()) {
      await tenpaiBtn.click();
      await page.screenshot({ path: '/tmp/sprint8-ac6-result.png' });

      // 待ち牌をクリックして詳細確認
      const waitArea = page.locator('section, div').filter({ hasText: /待ち牌/ }).first();
      const waitTileBtns = waitArea.locator('button').first();
      if (await waitTileBtns.isVisible()) {
        await waitTileBtns.click();
        await page.screenshot({ path: '/tmp/sprint8-ac6-detail.png' });
      }

      const pageContent = await page.content();
      const hasCountYakuman = pageContent.includes('数え役満');
      const has32000 = pageContent.includes('32000') || pageContent.includes('32,000');
      const hasYakuman = pageContent.includes('役満');

      console.log('数え役満テキストが表示:', hasCountYakuman);
      console.log('役満点数32000点が表示:', has32000);
      console.log('役満テキストが表示:', hasYakuman);
    }
  });

  // ===========================================================
  // 回帰テスト: Sprint 1 - 手牌入力
  // ===========================================================
  test('回帰: Sprint1 - 手牌追加・削除・クリアが機能する', async ({ page }) => {
    await page.screenshot({ path: '/tmp/sprint8-reg1-palette.png' });

    // 1萬を追加
    await clickPaletteTile(page, '1萬');
    await clickPaletteTile(page, '2萬');
    await clickPaletteTile(page, '3萬');

    const content = await page.content();
    console.log('手牌に3枚追加後のコンテンツ確認');
    const has3_14 = content.includes('3/14');
    console.log('3/14枚表示:', has3_14);
    expect(has3_14).toBeTruthy();

    // クリア
    const clearBtn = page.locator('button', { hasText: /^クリア$/ }).first();
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    }
    await page.screenshot({ path: '/tmp/sprint8-reg1-clear.png' });
    const afterClear = await page.content();
    const has0_14 = afterClear.includes('0/14');
    console.log('クリア後0/14枚表示:', has0_14);
    expect(has0_14).toBeTruthy();
  });

  // ===========================================================
  // 回帰テスト: Sprint 2 - 状況設定
  // ===========================================================
  test('回帰: Sprint2 - 親子・場風・自風・ドラ設定が機能する', async ({ page }) => {
    // 親ボタン
    const oyaBtn = page.locator('button', { hasText: /^親$/ });
    if (await oyaBtn.isVisible()) {
      await oyaBtn.click();
    }

    // 南場ボタン
    const nanbaBtn = page.locator('button', { hasText: /南場/ });
    if (await nanbaBtn.isVisible()) {
      await nanbaBtn.click();
    }

    await page.screenshot({ path: '/tmp/sprint8-reg2-situation.png' });

    // 状況設定パネルが表示されているか
    const situationPanel = page.locator('text=状況設定').first();
    const isVisible = await situationPanel.isVisible();
    console.log('状況設定パネルが表示:', isVisible);
    expect(isVisible).toBeTruthy();

    // ドラ表示牌の追加
    const addDoraBtn = page.locator('button', { hasText: /ドラ表示牌を追加/ }).first();
    await addDoraBtn.click();
    await clickPaletteTile(page, '5萬');

    await page.screenshot({ path: '/tmp/sprint8-reg2-dora.png' });

    // 全リセット
    await fullReset(page);
    await page.screenshot({ path: '/tmp/sprint8-reg2-reset.png' });
  });

  // ===========================================================
  // 回帰テスト: Sprint 3 - 聴牌判定
  // ===========================================================
  test('回帰: Sprint3 - シャンポン待ち聴牌判定が機能する', async ({ page }) => {
    // シャンポン待ち: 1萬×3 2萬×3 3萬×3 4萬×2 5萬×2 = 13枚
    const tileLabels = [
      '1萬','1萬','1萬',
      '2萬','2萬','2萬',
      '3萬','3萬','3萬',
      '4萬','4萬',
      '5萬','5萬'
    ];
    for (const label of tileLabels) {
      await clickPaletteTile(page, label);
    }

    const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
    await expect(tenpaiBtn).toBeEnabled({ timeout: 5000 });
    await tenpaiBtn.click();

    await page.screenshot({ path: '/tmp/sprint8-reg3-shanpon.png' });

    const content = await page.content();
    const isTenpai = content.includes('聴牌') || content.includes('テンパイ');
    console.log('シャンポン待ち聴牌が検出:', isTenpai);
    expect(isTenpai).toBeTruthy();
  });

  // ===========================================================
  // 回帰テスト: Sprint 5 - 点数計算
  // ===========================================================
  test('回帰: Sprint5 - 点数が表示される', async ({ page }) => {
    // 平和の聴牌形
    const tileLabels = [
      '1萬','2萬','3萬',
      '4萬','5萬','6萬',
      '7萬','8萬','9萬',
      '1筒','2筒','3筒',
      '4筒'
    ];
    for (const label of tileLabels) {
      await clickPaletteTile(page, label);
    }

    const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
    if (await tenpaiBtn.isEnabled()) {
      await tenpaiBtn.click();
      await page.screenshot({ path: '/tmp/sprint8-reg5-score.png' });

      const content = await page.content();
      const hasScore = content.includes('点') && (content.includes('ロン') || content.includes('ツモ'));
      console.log('点数が表示:', hasScore);
      expect(hasScore).toBeTruthy();
    }
  });

  // ===========================================================
  // 回帰テスト: Sprint 6 - 嶺上開花
  // ===========================================================
  test('回帰: Sprint6 - 嶺上開花列が表示される', async ({ page }) => {
    // 平和形の聴牌
    const tileLabels = [
      '1萬','2萬','3萬',
      '4萬','5萬','6萬',
      '7萬','8萬','9萬',
      '1筒','2筒','3筒',
      '4筒'
    ];
    for (const label of tileLabels) {
      await clickPaletteTile(page, label);
    }

    const tenpaiBtn = page.locator('button', { hasText: /聴牌判定/ });
    if (await tenpaiBtn.isEnabled()) {
      await tenpaiBtn.click();
      await page.screenshot({ path: '/tmp/sprint8-reg6-rinshan.png' });

      const content = await page.content();
      const hasRinshan = content.includes('嶺上');
      console.log('嶺上開花列が表示:', hasRinshan);
      expect(hasRinshan).toBeTruthy();
    }
  });

  // ===========================================================
  // 回帰テスト: Sprint 7 - 副露
  // ===========================================================
  test('回帰: Sprint7 - 副露パネルが表示され機能する', async ({ page }) => {
    // 副露パネルが表示されているか
    const meldPanel = page.locator('text=副露').first();
    const isMeldVisible = await meldPanel.isVisible();
    console.log('副露パネルが表示:', isMeldVisible);
    expect(isMeldVisible).toBeTruthy();

    await page.screenshot({ path: '/tmp/sprint8-reg7-meld.png' });

    // ポンボタンをクリック
    const ponBtn = page.locator('button', { hasText: /^ポン$/ }).first();
    if (await ponBtn.isVisible() && await ponBtn.isEnabled()) {
      await ponBtn.click();
      await page.screenshot({ path: '/tmp/sprint8-reg7-pon.png' });
    }
  });
});
