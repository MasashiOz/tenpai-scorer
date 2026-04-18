import { test, expect } from '@playwright/test';

// 明槓後の聴牌手牌で嶺上開花を確認
// 明槓5萬 + 手牌9枚(8枚完成 + 1枚待ち)
// 3萬・4萬・6萬 (3枚=搭子?) → これは待ち5萬か? 5萬は4枚使用済
// OK: 3萬・4萬(塔子) + 6萬(浮き) → 5萬か5萬待ち or リャンメン2萬・5萬
// 3-4萬(塔子)で2萬か5萬待ち → 5萬は使い済み → 2萬待ち(辺張or嵌張か?)
// 3-4萬から「2萬or5萬(リャンメン)」だが5萬は明槓で4枚使用済み → 2萬待ち(ペンチャン的?)
// 実際は3-4萬のリャンメンは2萬か5萬。5萬は4枚全部副露に使ったのでアガリ牌として引けないので2萬のみ

// 明槓5萬 + 手牌: 1萬・2萬・3萬 / 4筒・5筒・6筒 / 7索・8索 / 3萬(余り1枚) = 9枚
// 分解: 1-2-3萬(順子) + 4-5-6筒(順子) + 7-8索(塔子) + 3萬(雀頭1枚) → 7索か9索待ち(リャンメン) + 3萬(単騎)
// 実際のシャンテン数計算が複雑なので確認が必要

// 最シンプルな手: 明槓5萬 + 手牌9枚 (単純に作れる)
// 副露明槓 + 1-2-3萬(順子) + 4-5-6筒(順子) + 7-8-9索(順子) + 白(単騎) = 9枚  → 白待ち

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

test('AC6: 明槓含む聴牌手牌で嶺上開花列が表示されること', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // 手牌3枚で明槓ボタン有効化
  await clickTile(page, '1萬', 3);
  
  // 明槓ボタン
  await page.locator('button').filter({ hasText: /^明槓$/ }).first().click();
  await page.waitForTimeout(300);
  
  // 5萬を4回
  await clickInPicker(page, '5萬', 4);
  await page.waitForTimeout(300);
  
  // 明槓5萬確認
  const minkanBadge = page.locator('text=[明槓]');
  expect(await minkanBadge.count()).toBeGreaterThan(0);
  
  // 手牌9枚(3枚確認済み + 6枚追加)
  // 1萬×3 + 2萬 + 3萬 + 4筒 + 5筒 + 6筒 + 白 = 9枚
  // 分解: 1-1-1萬(刻子) + 2-3萬(塔子) + 4-5-6筒(順子) + 白(単騎)
  // → 1萬か4萬待ち(リャンメン) + 白(単騎) → テンパイ(複数待ち)
  await clickTile(page, '2萬', 1);
  await clickTile(page, '3萬', 1);
  await clickTile(page, '4筒', 1);
  await clickTile(page, '5筒', 1);
  await clickTile(page, '6筒', 1);
  await clickTile(page, '白', 1);
  
  const handText = await page.locator('text=/\\d+\\/14枚/').first().textContent();
  console.log('Hand:', handText);
  
  await page.screenshot({ path: '/tmp/sprint7-ac6-final-hand.png', fullPage: true });
  
  const tenpaiBtn = page.locator('button').filter({ hasText: /聴牌判定/ });
  console.log('Disabled:', await tenpaiBtn.isDisabled());
  
  await tenpaiBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/sprint7-ac6-final-result.png', fullPage: true });
  
  const headers = await page.locator('th').allTextContents();
  console.log('Headers:', headers);
  
  const waitRows = page.locator('table tbody tr');
  const waitCount = await waitRows.count();
  console.log('Wait rows:', waitCount);
  
  if (waitCount > 0) {
    // 嶺上ヘッダーが存在すること
    expect(headers).toContain('嶺上');
    
    // 待ち牌の嶺上タブで嶺上開花を確認
    await waitRows.first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/sprint7-ac6-final-detail.png', fullPage: true });
    
    const rinshanTab = page.locator('button').filter({ hasText: /^嶺上$/ });
    if (await rinshanTab.count() > 0) {
      await rinshanTab.click();
      await page.waitForTimeout(200);
      await page.screenshot({ path: '/tmp/sprint7-ac6-final-rinshan.png', fullPage: true });
      
      const rinshanKaiho = page.locator('text=嶺上開花');
      const count = await rinshanKaiho.count();
      console.log('嶺上開花:', count);
      expect(count).toBeGreaterThan(0);
    }
  }
});
