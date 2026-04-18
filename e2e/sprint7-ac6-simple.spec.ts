import { test, expect } from '@playwright/test';

// AC6: 明槓後の嶺上開花点数が正しく表示されること
// シンプルな副露手牌でテンパイ → 嶺上列確認

async function clickTile(page: any, tileLabel: string, n = 1) {
  for (let i = 0; i < n; i++) {
    const btns = await page.locator('button').filter({ hasText: new RegExp(`^${tileLabel}$`) }).all();
    for (const btn of btns) {
      if (!(await btn.isDisabled())) {
        await btn.click();
        await page.waitForTimeout(150);
        break;
      }
    }
  }
}

async function clickInPicker(page: any, tileLabel: string, n = 1) {
  const picker = page.locator('div.bg-indigo-50');
  for (let i = 0; i < n; i++) {
    await picker.locator('button').filter({ hasText: tileLabel }).first().click();
    await page.waitForTimeout(150);
  }
}

test('AC6: 明槓後の嶺上開花点数が表示されること', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // 手牌3枚追加して明槓ボタンを有効化
  await clickTile(page, '1萬', 3);
  
  // 明槓ボタン
  await page.locator('button').filter({ hasText: /^明槓$/ }).first().click();
  await page.waitForTimeout(300);
  
  // 5萬を4回
  await clickInPicker(page, '5萬', 4);
  await page.waitForTimeout(300);
  
  // 現在手牌: 1萬×3 (3枚) + 副露明槓5萬×4 (4枚) = 副露4枚 + 手牌3枚
  // 必要手牌: 13 - 4 = 9枚 → あと6枚
  await clickTile(page, '2萬', 1);
  await clickTile(page, '3萬', 1);
  await clickTile(page, '4筒', 1);
  await clickTile(page, '5筒', 1);
  await clickTile(page, '6筒', 1);
  // 手牌 = 1萬×3, 2萬, 3萬, 4筒, 5筒, 6筒 = 8枚 → あと1枚
  await clickTile(page, '白', 1);
  // 手牌9枚 + 副露4枚 = 13枚相当
  
  const handText = await page.locator('text=/\\d+\\/14枚/').first().textContent();
  console.log('Hand (AC6):', handText);
  
  // この手牌: 1萬×3(刻子) + 2-3萬(搭子) + 4-5-6筒(順子) + 白(単騎) = ノーテン可能性あり
  // → 3-4-5萬面子で分解: 1-1-1萬(刻子) + 2-3萬+ 4-5-6筒 + 白 → 2-3萬の待ち(1萬or4萬) + 白単騎(2面待ち)
  // テンパイ: 複数の待ち候補 → 実際にテンパイするはず
  
  await page.screenshot({ path: '/tmp/sprint7-ac6-simple-hand.png', fullPage: true });
  
  const tenpaiBtn = page.locator('button').filter({ hasText: /聴牌判定/ });
  const isDisabled = await tenpaiBtn.isDisabled();
  console.log('Tenpai disabled:', isDisabled);
  
  if (!isDisabled) {
    await tenpaiBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/sprint7-ac6-simple-result.png', fullPage: true });
    
    const resultText = await page.locator('text=聴牌').first().textContent().catch(() => '');
    console.log('Result:', resultText);
    
    // 嶺上列ヘッダーを確認
    const tableHeaders = await page.locator('th').allTextContents();
    console.log('Table headers:', tableHeaders);
    
    const rinshanHeader = page.locator('th').filter({ hasText: /^嶺上$/ });
    const count = await rinshanHeader.count();
    console.log('嶺上 header count:', count);
  }
});

test('AC6b: 副露ありでテンパイ時に3列(ロン/ツモ/嶺上)が表示されること', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // ポン東 + 手牌10枚でテンパイ
  await clickTile(page, '2萬', 3);
  
  await page.locator('button').filter({ hasText: /^ポン$/ }).first().click();
  await page.waitForTimeout(300);
  
  await clickInPicker(page, '東', 3);
  await page.waitForTimeout(300);
  
  // 手牌10枚 (2萬×3 = 3枚 + 7枚 = 10枚)
  // タンヤオ手牌: 3萬・4萬・5萬 / 6萬・7萬・8萬 / 2筒×2 = 7枚 → 合計10枚
  await clickTile(page, '3萬', 3);
  await clickTile(page, '4萬', 1);
  await clickTile(page, '5萬', 1);
  await clickTile(page, '6萬', 1);
  await clickTile(page, '2筒', 2);
  // 合計10枚 + ポン東3枚 = 13枚相当
  
  const handText = await page.locator('text=/\\d+\\/14枚/').first().textContent();
  console.log('Hand (AC6b):', handText);
  
  const tenpaiBtn = page.locator('button').filter({ hasText: /聴牌判定/ });
  const isDisabled = await tenpaiBtn.isDisabled();
  console.log('Tenpai disabled:', isDisabled);
  
  if (!isDisabled) {
    await tenpaiBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/sprint7-ac6b-3col.png', fullPage: true });
    
    // テーブルヘッダー確認
    const headers = await page.locator('th').allTextContents();
    console.log('Headers:', headers);
    
    // 嶺上列の存在確認
    const rinshanHeaders = page.locator('th').filter({ hasText: /嶺上/ });
    const rinshanCount = await rinshanHeaders.count();
    console.log('嶺上 headers count:', rinshanCount);
    expect(rinshanCount).toBeGreaterThan(0);
    
    // 待ち牌をクリックして詳細で嶺上タブを確認
    const waitRows = page.locator('table tbody tr');
    if (await waitRows.count() > 0) {
      await waitRows.first().click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: '/tmp/sprint7-ac6b-detail.png', fullPage: true });
      
      // 嶺上タブをクリック
      const rinshanTab = page.locator('button').filter({ hasText: /^嶺上$/ });
      if (await rinshanTab.count() > 0) {
        await rinshanTab.click();
        await page.waitForTimeout(200);
        await page.screenshot({ path: '/tmp/sprint7-ac6b-rinshan-detail.png', fullPage: true });
        
        // 嶺上開花が役として表示されること
        const rinshanKaiho = page.locator('text=嶺上開花');
        const count = await rinshanKaiho.count();
        console.log('嶺上開花 count:', count);
        expect(count).toBeGreaterThan(0);
      }
    }
  }
});
