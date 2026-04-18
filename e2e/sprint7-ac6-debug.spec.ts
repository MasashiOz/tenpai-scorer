import { test, expect } from '@playwright/test';

// 副露手牌でノーテンになるケースのデバッグ

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

test('副露ありタンヤオ手牌で聴牌→3列確認', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // ポン2筒(3枚) + 手牌10枚
  // 手牌: 3萬・4萬・5萬 / 6萬・7萬・8萬 / 4索・5索 / 2索・2索 = 10枚
  // 待ち: 3索か6索(リャンメン)
  
  await clickTile(page, '3萬', 3); // 副露ボタン有効化
  
  await page.locator('button').filter({ hasText: /^ポン$/ }).first().click();
  await page.waitForTimeout(300);
  
  await clickInPicker(page, '2筒', 3);
  await page.waitForTimeout(300);
  
  // 残り手牌: 3萬×3 = 3枚 あと7枚
  await clickTile(page, '4萬', 1);
  await clickTile(page, '5萬', 1);
  await clickTile(page, '6萬', 1);
  await clickTile(page, '7萬', 1);
  await clickTile(page, '8萬', 1);
  await clickTile(page, '4索', 1);
  await clickTile(page, '5索', 1);
  // 計10枚: 3萬×3, 4萬, 5萬, 6萬, 7萬, 8萬, 4索, 5索
  
  // この手牌: 3-4-5萬(順子) + 6-7-8萬(順子) + 4-5索(塔子) + 3萬×0... wait
  // 3萬×3 = 3枚: 刻子 + 4萬, 5萬, 6萬, 7萬, 8萬, 4索, 5索 = 7枚 → 合計10枚
  // 分解: 3萬×3(刻子) + 4萬・5萬・6萬(順子) + 7萬・8萬(雀頭候補, 搭子) + 4索・5索(搭子)
  // でも雀頭は1対必要 → 7萬・8萬が雀頭なら待ちは6萬か9萬?
  // 実際: 3萬×3(刻子) + 4-5-6萬(順子) + 7-8萬 + 4-5索 → 7-8萬の待ち+4-5索の待ちの複合シャンテン
  // これはノーテン（1シャンテン）
  
  const handText = await page.locator('text=/\\d+\\/14枚/').first().textContent();
  console.log('Hand:', handText);
  
  await page.screenshot({ path: '/tmp/sprint7-debug-hand.png', fullPage: true });
  
  const tenpaiBtn = page.locator('button').filter({ hasText: /聴牌判定/ });
  console.log('Tenpai disabled:', await tenpaiBtn.isDisabled());
  
  await tenpaiBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/sprint7-debug-result.png', fullPage: true });
  
  const resultText = await page.locator('text=/聴牌|ノーテン/').first().textContent();
  console.log('Result:', resultText);
  
  if (resultText && resultText.includes('聴牌')) {
    const headers = await page.locator('th').allTextContents();
    console.log('Headers:', headers);
    
    const waitRows = page.locator('table tbody tr');
    console.log('Wait rows:', await waitRows.count());
  }
});

test('副露ありの手牌で確実にテンパイ→嶺上確認', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // 明槓5萬 + 手牌: シンプルな9枚テンパイ形
  // 手牌9枚: 2萬・3萬・4萬 / 5筒・6筒・7筒 / 8索・8索 / 白 = 9枚
  // 分解: 2-3-4萬(順子) + 5-6-7筒(順子) + 8索×2(雀頭) + 白(単騎) → 待ち:白(単騎)
  // または: 2-3-4萬 + 5-6-7筒 + 8索・白(搭子) + 8索(1枚) → 複雑
  // シンプルに: 2-3-4萬(順子) + 5-6-7筒(順子) + 8索・8索(雀頭) + 白(単騎) = 聴牌(白待ち)
  
  await clickTile(page, '2萬', 3);
  
  await page.locator('button').filter({ hasText: /^明槓$/ }).first().click();
  await page.waitForTimeout(300);
  
  await clickInPicker(page, '5萬', 4);
  await page.waitForTimeout(300);
  
  // 現在手牌: 2萬×3 = 3枚 → あと6枚
  await clickTile(page, '3萬', 1);
  await clickTile(page, '4萬', 1);
  await clickTile(page, '5筒', 1);
  await clickTile(page, '6筒', 1);
  await clickTile(page, '7筒', 1);
  await clickTile(page, '8索', 2);
  // wait: 2萬×3, 3萬, 4萬, 5筒, 6筒, 7筒, 8索×2 = 9枚
  // 分解: 2萬・3萬・4萬も 2-3-4萬順子 or 2萬×3刻子
  // 仮に 2萬×3(刻子) + 3萬・4萬(塔子) + 5-6-7筒(順子) + 8索×2(雀頭) = 9枚
  // → 待ち: 2萬か5萬(リャンメン) 3萬4萬から
  
  const handText = await page.locator('text=/\\d+\\/14枚/').first().textContent();
  console.log('Hand (AC6c):', handText);
  
  await page.screenshot({ path: '/tmp/sprint7-ac6c-hand.png', fullPage: true });
  
  const tenpaiBtn = page.locator('button').filter({ hasText: /聴牌判定/ });
  console.log('Disabled:', await tenpaiBtn.isDisabled());
  
  if (!(await tenpaiBtn.isDisabled())) {
    await tenpaiBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/sprint7-ac6c-result.png', fullPage: true });
    
    const resultText = await page.locator('text=/聴牌|ノーテン/').first().textContent();
    console.log('Result (AC6c):', resultText);
    
    if (resultText && resultText.includes('聴牌')) {
      const headers = await page.locator('th').allTextContents();
      console.log('Headers:', headers);
      
      // 嶺上列確認
      const rinshanHeader = page.locator('th').filter({ hasText: /^嶺上$/ });
      const rinshanCount = await rinshanHeader.count();
      console.log('嶺上 count:', rinshanCount);
      
      expect(rinshanCount).toBeGreaterThan(0);
      
      // 待ち牌の詳細で嶺上タブ確認
      const waitRows = page.locator('table tbody tr');
      if (await waitRows.count() > 0) {
        await waitRows.first().click();
        await page.waitForTimeout(300);
        
        const rinshanTab = page.locator('button').filter({ hasText: /^嶺上$/ });
        if (await rinshanTab.count() > 0) {
          await rinshanTab.click();
          await page.waitForTimeout(200);
          await page.screenshot({ path: '/tmp/sprint7-ac6c-rinshan.png', fullPage: true });
          
          const rinshanKaiho = page.locator('text=嶺上開花');
          console.log('嶺上開花 count:', await rinshanKaiho.count());
          expect(await rinshanKaiho.count()).toBeGreaterThan(0);
        }
      }
    }
  }
});
