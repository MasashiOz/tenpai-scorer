# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sprint9_final.spec.ts >> Sprint 9 最終確認 >> エラートースト: 手牌14枚時の満杯メッセージ表示確認
- Location: e2e/sprint9_final.spec.ts:12:7

# Error details

```
Error: locator.isVisible: Error: strict mode violation: locator('[role="alert"]') resolved to 2 elements:
    1) <div role="alert" class="↵        pointer-events-auto flex items-start gap-2 px-4 py-3 rounded-lg border-2 shadow-lg↵        text-sm font-medium max-w-xs↵        bg-green-50 border-green-400 text-green-800↵        animate-in slide-in-from-right-2 fade-in duration-200↵      ">…</div> aka getByText('✓全てリセットしました×')
    2) <div role="alert" aria-live="assertive" id="__next-route-announcer__"></div> aka locator('[id="__next-route-announcer__"]')

Call log:
    - checking visibility of locator('[role="alert"]')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - heading "Tenpai Scorer" [level=1] [ref=e6]
          - paragraph [ref=e7]: 麻雀点数計算ヘルパー
        - generic [ref=e8]:
          - button "ヘルプを開く" [ref=e9]:
            - generic [ref=e10]: "?"
            - generic [ref=e11]: ヘルプ
          - button "全リセット" [active] [ref=e12]
    - main [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]:
          - heading "状況設定" [level=2] [ref=e16]
          - button "リセット" [ref=e17]
        - generic [ref=e18]:
          - generic [ref=e19]:
            - generic [ref=e20]:
              - generic [ref=e21]: プレイヤー
              - generic [ref=e22]:
                - button "親" [ref=e23]
                - button "子✓" [ref=e24]
            - generic [ref=e25]:
              - generic [ref=e26]: 場風
              - generic [ref=e27]:
                - button "東場✓" [ref=e28]
                - button "南場" [ref=e29]
            - generic [ref=e30]:
              - generic [ref=e31]: 自風
              - generic [ref=e32]:
                - button "東家✓" [ref=e33]
                - button "南家" [ref=e34]
                - button "西家" [ref=e35]
                - button "北家" [ref=e36]
            - generic [ref=e37]:
              - generic [ref=e38]: 状況役
              - generic [ref=e39]:
                - button "リーチ" [ref=e40]
                - button "一発" [disabled] [ref=e41]
                - button "海底" [ref=e42]
                - button "河底" [ref=e43]
              - paragraph [ref=e44]: 一発はリーチON時のみ有効
          - generic [ref=e46]:
            - generic [ref=e47]:
              - text: ドラ表示牌
              - generic [ref=e48]: (0/5枚)
            - generic [ref=e49]: ドラ表示牌が設定されていません
            - button "＋ ドラ表示牌を追加" [ref=e50]
      - generic [ref=e51]:
        - generic [ref=e52]:
          - generic [ref=e53]:
            - heading "手牌" [level=2] [ref=e54]
            - generic [ref=e55]: 0/14枚
          - button "クリア" [disabled] [ref=e56]
        - region "手牌エリア" [ref=e57]:
          - generic [ref=e58]: パレットから牌を選んでください
      - generic [ref=e59]:
        - heading "副露（鳴き）" [level=2] [ref=e61]
        - generic [ref=e62]: 副露なし（門前）
        - generic [ref=e63]: 手牌が満杯のため副露を追加できません
      - generic [ref=e64]:
        - heading "牌パレット" [level=2] [ref=e65]
        - generic [ref=e66]:
          - generic [ref=e67]:
            - generic [ref=e68]: 萬子
            - generic [ref=e69]:
              - button "1萬" [ref=e71] [cursor=pointer]:
                - generic [ref=e72]: "1"
                - generic [ref=e73]: 萬
              - button "2萬" [ref=e75] [cursor=pointer]:
                - generic [ref=e76]: "2"
                - generic [ref=e77]: 萬
              - button "3萬" [ref=e79] [cursor=pointer]:
                - generic [ref=e80]: "3"
                - generic [ref=e81]: 萬
              - button "4萬" [ref=e83] [cursor=pointer]:
                - generic [ref=e84]: "4"
                - generic [ref=e85]: 萬
              - button "5萬" [ref=e87] [cursor=pointer]:
                - generic [ref=e88]: "5"
                - generic [ref=e89]: 萬
              - button "6萬" [ref=e91] [cursor=pointer]:
                - generic [ref=e92]: "6"
                - generic [ref=e93]: 萬
              - button "7萬" [ref=e95] [cursor=pointer]:
                - generic [ref=e96]: "7"
                - generic [ref=e97]: 萬
              - button "8萬" [ref=e99] [cursor=pointer]:
                - generic [ref=e100]: "8"
                - generic [ref=e101]: 萬
              - button "9萬" [ref=e103] [cursor=pointer]:
                - generic [ref=e104]: "9"
                - generic [ref=e105]: 萬
          - generic [ref=e106]:
            - generic [ref=e107]: 筒子
            - generic [ref=e108]:
              - button "1筒" [ref=e110] [cursor=pointer]:
                - generic [ref=e111]: "1"
                - generic [ref=e112]: 筒
              - button "2筒" [ref=e114] [cursor=pointer]:
                - generic [ref=e115]: "2"
                - generic [ref=e116]: 筒
              - button "3筒" [ref=e118] [cursor=pointer]:
                - generic [ref=e119]: "3"
                - generic [ref=e120]: 筒
              - button "4筒" [ref=e122] [cursor=pointer]:
                - generic [ref=e123]: "4"
                - generic [ref=e124]: 筒
              - button "5筒" [ref=e126] [cursor=pointer]:
                - generic [ref=e127]: "5"
                - generic [ref=e128]: 筒
              - button "6筒" [ref=e130] [cursor=pointer]:
                - generic [ref=e131]: "6"
                - generic [ref=e132]: 筒
              - button "7筒" [ref=e134] [cursor=pointer]:
                - generic [ref=e135]: "7"
                - generic [ref=e136]: 筒
              - button "8筒" [ref=e138] [cursor=pointer]:
                - generic [ref=e139]: "8"
                - generic [ref=e140]: 筒
              - button "9筒" [ref=e142] [cursor=pointer]:
                - generic [ref=e143]: "9"
                - generic [ref=e144]: 筒
          - generic [ref=e145]:
            - generic [ref=e146]: 索子
            - generic [ref=e147]:
              - button "1索" [ref=e149] [cursor=pointer]:
                - generic [ref=e150]: "1"
                - generic [ref=e151]: 索
              - button "2索" [ref=e153] [cursor=pointer]:
                - generic [ref=e154]: "2"
                - generic [ref=e155]: 索
              - button "3索" [ref=e157] [cursor=pointer]:
                - generic [ref=e158]: "3"
                - generic [ref=e159]: 索
              - button "4索" [ref=e161] [cursor=pointer]:
                - generic [ref=e162]: "4"
                - generic [ref=e163]: 索
              - button "5索" [ref=e165] [cursor=pointer]:
                - generic [ref=e166]: "5"
                - generic [ref=e167]: 索
              - button "6索" [ref=e169] [cursor=pointer]:
                - generic [ref=e170]: "6"
                - generic [ref=e171]: 索
              - button "7索" [ref=e173] [cursor=pointer]:
                - generic [ref=e174]: "7"
                - generic [ref=e175]: 索
              - button "8索" [ref=e177] [cursor=pointer]:
                - generic [ref=e178]: "8"
                - generic [ref=e179]: 索
              - button "9索" [ref=e181] [cursor=pointer]:
                - generic [ref=e182]: "9"
                - generic [ref=e183]: 索
          - generic [ref=e184]:
            - generic [ref=e185]: 風牌
            - generic [ref=e186]:
              - button "東" [ref=e188] [cursor=pointer]:
                - generic [ref=e189]: 東
              - button "南" [ref=e191] [cursor=pointer]:
                - generic [ref=e192]: 南
              - button "西" [ref=e194] [cursor=pointer]:
                - generic [ref=e195]: 西
              - button "北" [ref=e197] [cursor=pointer]:
                - generic [ref=e198]: 北
          - generic [ref=e199]:
            - generic [ref=e200]: 三元牌
            - generic [ref=e201]:
              - button "白" [ref=e203] [cursor=pointer]:
                - generic [ref=e204]: 白
              - button "發" [ref=e206] [cursor=pointer]:
                - generic [ref=e207]: 發
              - button "中" [ref=e209] [cursor=pointer]:
                - generic [ref=e210]: 中
          - generic [ref=e211]:
            - generic [ref=e212]: 赤ドラ（各1枚まで）
            - generic [ref=e213]:
              - button "赤 5" [ref=e215] [cursor=pointer]:
                - generic [ref=e216]:
                  - generic [ref=e217]: 赤
                  - generic [ref=e218]: "5"
              - button "赤 5" [ref=e220] [cursor=pointer]:
                - generic [ref=e221]:
                  - generic [ref=e222]: 赤
                  - generic [ref=e223]: "5"
              - button "赤 5" [ref=e225] [cursor=pointer]:
                - generic [ref=e226]:
                  - generic [ref=e227]: 赤
                  - generic [ref=e228]: "5"
            - paragraph [ref=e229]: 赤ドラは手牌に追加されると、ドラ1として自動加算されます
      - generic [ref=e230]:
        - heading "聴牌判定" [level=2] [ref=e232]
        - generic [ref=e233]:
          - button "聴牌判定する" [disabled] [ref=e234]
          - paragraph [ref=e235]: 13枚必要です（現在0枚）
    - contentinfo [ref=e236]: Tenpai Scorer — Sprint 9 (最終版)
  - button "Open Next.js Dev Tools" [ref=e242] [cursor=pointer]:
    - img [ref=e243]
  - alert [ref=e246]
  - region "通知":
    - alert [ref=e247]:
      - generic [ref=e248]: ✓
      - generic [ref=e249]: 全てリセットしました
      - button "閉じる" [ref=e250]: ×
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const BASE_URL = 'http://localhost:3000';
  4   | 
  5   | async function resetAll(page: any) {
  6   |   await page.locator('button').filter({ hasText: '全リセット' }).first().click();
  7   |   await page.waitForTimeout(200);
  8   | }
  9   | 
  10  | test.describe('Sprint 9 最終確認', () => {
  11  | 
  12  |   test('エラートースト: 手牌14枚時の満杯メッセージ表示確認', async ({ page }) => {
  13  |     await page.setViewportSize({ width: 1280, height: 900 });
  14  |     await page.goto(BASE_URL);
  15  |     await page.waitForLoadState('networkidle');
  16  |     await resetAll(page);
  17  | 
  18  |     // Add 14 tiles
  19  |     const tiles14 = [
  20  |       '1萬', '1萬', '1萬', '1萬',
  21  |       '2萬', '2萬', '2萬', '2萬',
  22  |       '3萬', '3萬', '3萬', '3萬',
  23  |       '4萬', '4萬',
  24  |     ];
  25  | 
  26  |     for (const tile of tiles14) {
  27  |       await page.locator('button').filter({ hasText: new RegExp(`^${tile}$`) }).first().click();
  28  |       await page.waitForTimeout(30);
  29  |     }
  30  | 
  31  |     // Take screenshot of 14 tile state
  32  |     await page.screenshot({ path: '/tmp/sprint9_14tile_state.png' });
  33  | 
  34  |     // Check "手牌が満杯です" message in hand area
  35  |     const handAreaText = await page.evaluate(() => {
  36  |       // Find the hand area section
  37  |       const allText = document.body.innerText;
  38  |       return allText.match(/手牌[\s\S]{0,200}/)?.[0] || '';
  39  |     });
  40  |     console.log('Hand area text with 14 tiles:', handAreaText.substring(0, 200));
  41  | 
  42  |     // The error message "手牌が満杯です（最大14枚）" should be visible
  43  |     const bodyText = await page.locator('body').textContent();
  44  |     const hasSatisfiedMessage = bodyText?.includes('満杯') || bodyText?.includes('14/14');
  45  |     console.log('Has 満杯 message or 14/14:', hasSatisfiedMessage);
  46  |     expect(hasSatisfiedMessage).toBeTruthy();
  47  | 
  48  |     // Check that the 14/14 badge is shown in orange/red (indicating full)
  49  |     const handBadge = page.locator('text=14/14枚');
  50  |     const badgeVisible = await handBadge.isVisible();
  51  |     console.log('14/14枚 badge visible:', badgeVisible);
  52  | 
  53  |     // AC5 alternative: エラートーストを全リセット後に確認
  54  |     await resetAll(page);
  55  |     await page.waitForTimeout(600); // Wait for toast to appear
  56  |     await page.screenshot({ path: '/tmp/sprint9_reset_toast_final.png' });
  57  | 
  58  |     // Check for the reset toast
> 59  |     const toastVisible = await page.locator('[role="alert"]').isVisible();
      |                                                               ^ Error: locator.isVisible: Error: strict mode violation: locator('[role="alert"]') resolved to 2 elements:
  60  |     const toastText = toastVisible ? await page.locator('[role="alert"]').first().textContent() : 'not visible';
  61  |     console.log('Reset toast visible:', toastVisible, 'text:', toastText);
  62  | 
  63  |     expect(hasSatisfiedMessage || toastVisible).toBeTruthy();
  64  |   });
  65  | 
  66  |   test('ヘルプモーダル: オーバーレイクリックで閉じる', async ({ page }) => {
  67  |     await page.goto(BASE_URL);
  68  |     await page.waitForLoadState('networkidle');
  69  | 
  70  |     // Open help
  71  |     await page.locator('button').filter({ hasText: '?ヘルプ' }).first().click();
  72  |     await page.waitForTimeout(300);
  73  | 
  74  |     // Verify modal is open
  75  |     const modalOpen = await page.locator('button').filter({ hasText: '閉じる' }).isVisible();
  76  |     console.log('Modal open (閉じる visible):', modalOpen);
  77  |     expect(modalOpen).toBeTruthy();
  78  | 
  79  |     // Click 閉じる button
  80  |     await page.locator('button').filter({ hasText: '閉じる' }).click();
  81  |     await page.waitForTimeout(300);
  82  | 
  83  |     // Verify modal is closed
  84  |     const modalClosed = await page.locator('button').filter({ hasText: '閉じる' }).isHidden();
  85  |     console.log('Modal closed after clicking 閉じる:', modalClosed);
  86  |     expect(modalClosed).toBeTruthy();
  87  | 
  88  |     await page.screenshot({ path: '/tmp/sprint9_help_closed_final.png' });
  89  |   });
  90  | 
  91  |   test('アコーディオン: 符の内訳確認', async ({ page }) => {
  92  |     await page.setViewportSize({ width: 1280, height: 900 });
  93  |     await page.goto(BASE_URL);
  94  |     await page.waitForLoadState('networkidle');
  95  |     await resetAll(page);
  96  | 
  97  |     // Add shanpon tenpai hand
  98  |     const hand = ['2萬','2萬','2萬','4萬','4萬','4萬','6萬','6萬','6萬','2筒','2筒','4筒','4筒'];
  99  |     for (const t of hand) {
  100 |       await page.locator('button').filter({ hasText: new RegExp(`^${t}$`) }).first().click();
  101 |       await page.waitForTimeout(30);
  102 |     }
  103 | 
  104 |     // Click tenpai
  105 |     await page.locator('button').filter({ hasText: /聴牌判定/ }).first().click();
  106 |     await page.waitForTimeout(500);
  107 | 
  108 |     // Click a result row to open accordion
  109 |     const rows = page.locator('table tbody tr').filter({ has: page.locator('td') });
  110 |     await rows.first().click();
  111 |     await page.waitForTimeout(300);
  112 | 
  113 |     // Check accordion opened
  114 |     const accordionContent = await page.locator('body').textContent();
  115 |     const hasRoles = accordionContent?.includes('タンヤオ') || accordionContent?.includes('対々和');
  116 |     console.log('Accordion shows roles:', hasRoles);
  117 |     expect(hasRoles).toBeTruthy();
  118 | 
  119 |     // Click fu breakdown
  120 |     const fuBtn = page.locator('button').filter({ hasText: /符の内訳|内訳/ }).first();
  121 |     if (await fuBtn.isVisible()) {
  122 |       await fuBtn.click();
  123 |       await page.waitForTimeout(200);
  124 | 
  125 |       const fuText = await page.locator('body').textContent();
  126 |       const hasFu = fuText?.includes('副底') || fuText?.includes('+20符') || fuText?.includes('+4符');
  127 |       console.log('Fu breakdown visible:', hasFu);
  128 |       expect(hasFu).toBeTruthy();
  129 | 
  130 |       await page.screenshot({ path: '/tmp/sprint9_fu_final.png' });
  131 | 
  132 |       // Close fu breakdown
  133 |       await fuBtn.click();
  134 |       await page.waitForTimeout(200);
  135 |     }
  136 | 
  137 |     // Close accordion by clicking row again
  138 |     await rows.first().click();
  139 |     await page.waitForTimeout(200);
  140 | 
  141 |     const closedText = await page.locator('body').textContent();
  142 |     // After closing, the detailed content should not be visible
  143 |     await page.screenshot({ path: '/tmp/sprint9_accordion_closed_final.png' });
  144 |     console.log('Accordion close test completed');
  145 |   });
  146 | 
  147 |   test('リロード後の状態復元 - 完全確認', async ({ page }) => {
  148 |     await page.goto(BASE_URL);
  149 |     await page.waitForLoadState('networkidle');
  150 |     await resetAll(page);
  151 |     await page.waitForTimeout(300);
  152 | 
  153 |     // Setup state
  154 |     // a) 親に設定
  155 |     await page.locator('button').filter({ hasText: /^親$/ }).first().click();
  156 |     await page.waitForTimeout(100);
  157 | 
  158 |     // b) 南場に設定
  159 |     await page.locator('button').filter({ hasText: /^南場$/ }).first().click();
```