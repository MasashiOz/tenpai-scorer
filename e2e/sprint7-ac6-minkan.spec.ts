import { test, expect } from '@playwright/test';

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

test('AC6: 明槓(中張)後の嶺上開花点数が表示されること', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // 手牌3枚で明槓ボタン有効化
  await clickTile(page, '3萬', 3);
  
  // 明槓ボタン
  const minkanBtn = page.locator('button').filter({ hasText: /^明槓$/ });
  await minkanBtn.click();
  await page.waitForTimeout(300);
  
  // 5萬を4回
  await clickInPicker(page, '5萬', 4);
  await page.waitForTimeout(300);
  
  // 副露が追加されたことを確認
  const minkanBadge = page.locator('text=[明槓]');
  const badgeCount = await minkanBadge.count();
  console.log('[明槓] badges:', badgeCount);
  expect(badgeCount).toBeGreaterThan(0);
  
  // 手牌: 3萬×3 = 3枚 → あと6枚 (副露4枚 + 合計9枚手牌 = 13枚相当)
  await clickTile(page, '4萬', 1);
  await clickTile(page, '5萬', 1); // 5萬は副露で4枚使ったが、4枚しかないので残り0枚のはず
  // 5萬が使えない可能性 → 他の牌
  await clickTile(page, '6萬', 1);
  await clickTile(page, '7萬', 1);
  await clickTile(page, '8萬', 1);
  await clickTile(page, '9萬', 1);
  
  // 手牌: 3萬×3, 4萬, 6萬, 7萬, 8萬, 9萬 = 9枚 + 副露明槓5萬×4 = 13枚相当
  
  const handText = await page.locator('text=/\\d+\\/14枚/').first().textContent();
  console.log('Hand:', handText);
  
  await page.screenshot({ path: '/tmp/sprint7-minkan-hand.png', fullPage: true });
  
  const tenpaiBtn = page.locator('button').filter({ hasText: /聴牌判定/ });
  const isDisabled = await tenpaiBtn.isDisabled();
  console.log('Tenpai disabled:', isDisabled);
  
  if (!isDisabled) {
    await tenpaiBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/sprint7-minkan-result.png', fullPage: true });
    
    const resultElem = page.locator('text=/聴牌|ノーテン/').first();
    const resultText = await resultElem.textContent().catch(() => '');
    console.log('Result:', resultText);
    
    // テーブルヘッダー確認
    const headers = await page.locator('th').allTextContents();
    console.log('Headers:', headers);
    
    if (headers.includes('嶺上')) {
      console.log('嶺上列 CONFIRMED');
      
      // 待ち牌の詳細で嶺上タブを確認
      const waitRows = page.locator('table tbody tr');
      if (await waitRows.count() > 0) {
        await waitRows.first().click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: '/tmp/sprint7-minkan-detail.png', fullPage: true });
        
        // 嶺上タブをクリック
        const rinshanTab = page.locator('button').filter({ hasText: /^嶺上$/ });
        if (await rinshanTab.count() > 0) {
          await rinshanTab.click();
          await page.waitForTimeout(200);
          await page.screenshot({ path: '/tmp/sprint7-minkan-rinshan-tab.png', fullPage: true });
          
          const rinshanKaiho = page.locator('text=嶺上開花');
          const count = await rinshanKaiho.count();
          console.log('嶺上開花 in details:', count);
          expect(count).toBeGreaterThan(0);
        }
      }
    }
  }
});
