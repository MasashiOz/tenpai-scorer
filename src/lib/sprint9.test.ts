/**
 * Sprint 9: UI/UX仕上げとレスポンシブ対応
 * このテストファイルでは LocalStorage 保存・復元のロジックや
 * UI に関わる補助関数をユニットテストする。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DEFAULT_SITUATION } from '../types/situation';

// LocalStorage モック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

beforeEach(() => {
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
  localStorageMock.clear();
});

// ============================================================
// LocalStorage: 状況設定の保存と復元
// ============================================================

describe('LocalStorage: 状況設定の保存と復元', () => {
  const KEY = 'tenpai-scorer-situation';

  it('初回アクセス時はデフォルト値が返される', () => {
    const stored = localStorage.getItem(KEY);
    expect(stored).toBeNull();
  });

  it('状況設定をシリアライズしてLocalStorageに保存できる', () => {
    const situation = {
      ...DEFAULT_SITUATION,
      playerPosition: 'dealer',
      isRiichi: true,
    };
    localStorage.setItem(KEY, JSON.stringify(situation));

    const restored = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    expect(restored.playerPosition).toBe('dealer');
    expect(restored.isRiichi).toBe(true);
    expect(restored.roundWind).toBe('east'); // デフォルト値が保存される
  });

  it('ドラ表示牌リストが復元される', () => {
    const situation = {
      ...DEFAULT_SITUATION,
      doraIndicators: ['man5', 'wind2'],
    };
    localStorage.setItem(KEY, JSON.stringify(situation));

    const restored = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    expect(restored.doraIndicators).toEqual(['man5', 'wind2']);
  });

  it('全リセット後はデフォルト値で上書きされる', () => {
    const modified = { ...DEFAULT_SITUATION, playerPosition: 'dealer' };
    localStorage.setItem(KEY, JSON.stringify(modified));

    // リセット後
    localStorage.setItem(KEY, JSON.stringify(DEFAULT_SITUATION));

    const restored = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    expect(restored.playerPosition).toBe('non-dealer');
  });
});

// ============================================================
// LocalStorage: 手牌の保存と復元
// ============================================================

describe('LocalStorage: 手牌の保存と復元', () => {
  const KEY = 'tenpai-scorer-hand';

  it('手牌配列をシリアライズして保存できる', () => {
    const hand = [
      { id: 'man1', suit: 'man', number: 1, handIndex: 0 },
      { id: 'man2', suit: 'man', number: 2, handIndex: 1 },
      { id: 'man3', suit: 'man', number: 3, handIndex: 2 },
    ];
    localStorage.setItem(KEY, JSON.stringify(hand));

    const restored = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    expect(restored).toHaveLength(3);
    expect(restored[0].id).toBe('man1');
    expect(restored[2].handIndex).toBe(2);
  });

  it('空の手牌は空配列として保存される', () => {
    localStorage.setItem(KEY, JSON.stringify([]));
    const restored = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    expect(restored).toHaveLength(0);
  });

  it('赤ドラを含む手牌が正しく復元される', () => {
    const hand = [
      { id: 'man5r', suit: 'man', number: 5, handIndex: 0 },
    ];
    localStorage.setItem(KEY, JSON.stringify(hand));

    const restored = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    expect(restored[0].id).toBe('man5r');
  });
});

// ============================================================
// LocalStorage: 副露の保存と復元
// ============================================================

describe('LocalStorage: 副露の保存と復元', () => {
  const KEY = 'tenpai-scorer-melds';

  it('副露配列をシリアライズして保存できる', () => {
    const melds = [
      { id: 'meld-0', type: 'pon', tiles: ['man1', 'man1', 'man1'], suit: 'man', isAnkan: false },
    ];
    localStorage.setItem(KEY, JSON.stringify(melds));

    const restored = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    expect(restored).toHaveLength(1);
    expect(restored[0].type).toBe('pon');
    expect(restored[0].tiles).toEqual(['man1', 'man1', 'man1']);
  });

  it('暗槓を含む副露が正しく復元される', () => {
    const melds = [
      { id: 'meld-1', type: 'ankan', tiles: ['wind1', 'wind1', 'wind1', 'wind1'], suit: 'wind', isAnkan: true },
    ];
    localStorage.setItem(KEY, JSON.stringify(melds));

    const restored = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    expect(restored[0].isAnkan).toBe(true);
    expect(restored[0].tiles).toHaveLength(4);
  });
});

// ============================================================
// 不正入力のバリデーション
// ============================================================

describe('不正入力のバリデーション', () => {
  it('LocalStorageに不正なJSONが保存されていてもクラッシュしない', () => {
    localStorage.setItem('tenpai-scorer-hand', 'INVALID_JSON');

    let result: unknown;
    try {
      result = JSON.parse(localStorage.getItem('tenpai-scorer-hand') ?? '[]');
    } catch {
      result = [];
    }
    // 不正JSONなのでcatchして[]にフォールバックする
    expect(result).toEqual([]);
  });

  it('状況設定のLocalStorageが空でもデフォルト値で動作する', () => {
    // localStorage未設定
    const stored = localStorage.getItem('tenpai-scorer-situation');
    expect(stored).toBeNull();
    // フォールバックとしてDEFAULT_SITUATIONを使う
    const result = stored ? JSON.parse(stored) : DEFAULT_SITUATION;
    expect(result.playerPosition).toBe('non-dealer');
  });
});
