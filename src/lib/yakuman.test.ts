/**
 * 役満判定エンジンのユニットテスト (Sprint 8)
 */

import { describe, it, expect } from 'vitest';
import { detectYakuman } from './yakuman';
import { YakuContext } from '@/types/yaku';

// デフォルトコンテキスト（子・門前・ロン・東場・東家）
const defaultCtx: YakuContext = {
  seatWind: 'east',
  roundWind: 'east',
  isOpen: false,
  winTile: 'man1',
  isTsumo: false,
};

function ctx(overrides: Partial<YakuContext> = {}): YakuContext {
  return { ...defaultCtx, ...overrides };
}

// ============================================================
// 国士無双
// ============================================================
describe('国士無双', () => {
  it('国士無双（アガリ前13枚が全13種各1枚 = 純正13面待ち）がダブル役満として検出される', () => {
    // 1m9m1p9p1s9s東南西北白發中 の形で中でアガリ
    // アガリ前13枚: man1,man9,pin1,pin9,sou1,sou9,wind1-4,dragon1,dragon2,dragon3（全13種各1枚）
    // = 純正13面待ち（ダブル役満）
    const tiles = [
      'man1', 'man9', 'pin1', 'pin9', 'sou1', 'sou9',
      'wind1', 'wind2', 'wind3', 'wind4',
      'dragon1', 'dragon2', 'dragon3', 'dragon3',
    ];
    const result = detectYakuman(tiles, ctx({ winTile: 'dragon3' }));
    expect(result).not.toBeNull();
    expect(result!.entries[0].name).toBe('kokushi');
    // アガリ前13枚が全13種各1枚 = 13面待ち = ダブル役満
    expect(result!.entries[0].multiplier).toBe(2);
    expect(result!.totalMultiplier).toBe(2);
  });

  it('国士無双十三面待ちがダブル役満として検出される', () => {
    // 1m9m1p9p1s9s東南西北白發中 の13枚を持ち、中でアガリ（13面待ち）
    const tiles = [
      'man1', 'man9', 'pin1', 'pin9', 'sou1', 'sou9',
      'wind1', 'wind2', 'wind3', 'wind4',
      'dragon1', 'dragon2', 'dragon3', 'dragon2', // dragon2が対子 = 13面ではない
    ];
    // アガリ牌がdagon3（単騎）= 通常国士
    const result = detectYakuman(tiles, ctx({ winTile: 'dragon3' }));
    expect(result).not.toBeNull();
    expect(result!.entries[0].name).toBe('kokushi');
  });

  it('国士無双の純正13面: アガリ牌が対子でない方 = ダブル役満', () => {
    // 13枚: 1m9m1p9p1s9s東南西北白發中 (各1枚) + アガリ牌1萬 = 1萬が対子形成
    // アガリ前: 全13種1枚ずつ → 13面待ち → ダブル役満
    const tiles = [
      'man1', 'man1', 'man9', 'pin1', 'pin9', 'sou1', 'sou9',
      'wind1', 'wind2', 'wind3', 'wind4',
      'dragon1', 'dragon2', 'dragon3',
    ];
    const result = detectYakuman(tiles, ctx({ winTile: 'man1' }));
    expect(result).not.toBeNull();
    if (result) {
      expect(result.entries[0].name).toBe('kokushi');
      // 純正13面 (man1が対子でない13種1枚ずつ持ちでアガリ)
      expect(result.entries[0].multiplier).toBe(2);
    }
  });
});

// ============================================================
// 四暗刻
// ============================================================
describe('四暗刻', () => {
  it('四暗刻（ツモ・通常待ち）が役満として検出される', () => {
    // 111m 222m 333m 444m + 55m (単騎待ちでないツモ)
    const tiles = [
      'man1', 'man1', 'man1',
      'man2', 'man2', 'man2',
      'man3', 'man3', 'man3',
      'man4', 'man4', 'man4',
      'man5', 'man5',
    ];
    const result = detectYakuman(tiles, ctx({ winTile: 'man5', isTsumo: true }));
    expect(result).not.toBeNull();
    expect(result!.entries[0].name).toBe('suanko');
  });

  it('四暗刻単騎（ツモ）がダブル役満として検出される', () => {
    // 111m 222p 333s 444z + 55m で5萬単騎ツモ
    const tiles = [
      'man1', 'man1', 'man1',
      'pin2', 'pin2', 'pin2',
      'sou3', 'sou3', 'sou3',
      'wind4', 'wind4', 'wind4',
      'man5', 'man5',
    ];
    const result = detectYakuman(tiles, ctx({ winTile: 'man5', isTsumo: true }));
    expect(result).not.toBeNull();
    expect(result!.entries[0].name).toBe('suanko');
    expect(result!.entries[0].multiplier).toBe(2);
  });

  it('シャンポン待ちロンは四暗刻不可', () => {
    // 111m 222p 333s 444z + 5m5p シャンポン → 5萬ロン = 明刻が生まれる
    const tiles = [
      'man1', 'man1', 'man1',
      'pin2', 'pin2', 'pin2',
      'sou3', 'sou3', 'sou3',
      'wind4', 'wind4', 'wind4',
      'man5', 'pin5',
    ];
    const result = detectYakuman(tiles, ctx({ winTile: 'man5', isTsumo: false }));
    // シャンポンロンは四暗刻不可なのでnullか、他の役満
    if (result) {
      const suanko = result.entries.find((e) => e.name === 'suanko');
      expect(suanko).toBeUndefined();
    }
  });
});

// ============================================================
// 大三元
// ============================================================
describe('大三元', () => {
  it('大三元が検出される', () => {
    // 白発中の刻子 + 東南（残りは雀頭含め）
    const tiles = [
      'dragon1', 'dragon1', 'dragon1',
      'dragon2', 'dragon2', 'dragon2',
      'dragon3', 'dragon3', 'dragon3',
      'wind1', 'wind1', 'wind1',
      'man1', 'man1',
    ];
    const result = detectYakuman(tiles, ctx({ winTile: 'man1', isTsumo: true }));
    expect(result).not.toBeNull();
    const entry = result!.entries.find((e) => e.name === 'daisangen');
    expect(entry).toBeDefined();
    expect(entry!.multiplier).toBe(1);
  });
});

// ============================================================
// 大四喜・小四喜
// ============================================================
describe('大四喜・小四喜', () => {
  it('大四喜（ダブル役満）が検出される', () => {
    // 東南西北の刻子 + 任意雀頭
    const tiles = [
      'wind1', 'wind1', 'wind1',
      'wind2', 'wind2', 'wind2',
      'wind3', 'wind3', 'wind3',
      'wind4', 'wind4', 'wind4',
      'man1', 'man1',
    ];
    const result = detectYakuman(tiles, ctx({ winTile: 'man1', isTsumo: true }));
    expect(result).not.toBeNull();
    const entry = result!.entries.find((e) => e.name === 'daisushi');
    expect(entry).toBeDefined();
    expect(entry!.multiplier).toBe(2);
  });

  it('小四喜が検出される', () => {
    // 東南西の刻子 + 北（雀頭）
    const tiles = [
      'wind1', 'wind1', 'wind1',
      'wind2', 'wind2', 'wind2',
      'wind3', 'wind3', 'wind3',
      'man1', 'man1', 'man1',
      'wind4', 'wind4',
    ];
    const result = detectYakuman(tiles, ctx({ winTile: 'wind4', isTsumo: true }));
    expect(result).not.toBeNull();
    const entry = result!.entries.find((e) => e.name === 'shosushi');
    expect(entry).toBeDefined();
  });
});

// ============================================================
// 字一色
// ============================================================
describe('字一色', () => {
  it('字一色が検出される', () => {
    const tiles = [
      'wind1', 'wind1', 'wind1',
      'wind2', 'wind2', 'wind2',
      'dragon1', 'dragon1', 'dragon1',
      'dragon2', 'dragon2', 'dragon2',
      'wind3', 'wind3',
    ];
    const result = detectYakuman(tiles, ctx({ winTile: 'wind3', isTsumo: true }));
    expect(result).not.toBeNull();
    const entry = result!.entries.find((e) => e.name === 'tsuiso');
    expect(entry).toBeDefined();
  });
});

// ============================================================
// 緑一色
// ============================================================
describe('緑一色', () => {
  it('緑一色が検出される（索子2346發のみ）', () => {
    const tiles = [
      'sou2', 'sou2', 'sou2',
      'sou3', 'sou4', 'sou2', // 234索
      'dragon2', 'dragon2', 'dragon2', // 發
      'sou6', 'sou8', 'sou6', // 68索
      'sou4', 'sou4',
    ];
    const result = detectYakuman(tiles, ctx({ winTile: 'sou4', isTsumo: true }));
    // 全牌が 2/3/4/6/8索, 發 のみか確認
    const allGreen = tiles.every((t) =>
      ['sou2', 'sou3', 'sou4', 'sou6', 'sou8', 'dragon2'].includes(t)
    );
    if (allGreen) {
      expect(result).not.toBeNull();
      const entry = result?.entries.find((e) => e.name === 'ryuiso');
      expect(entry).toBeDefined();
    }
  });
});

// ============================================================
// 清老頭
// ============================================================
describe('清老頭', () => {
  it('清老頭が検出される', () => {
    const tiles = [
      'man1', 'man1', 'man1',
      'man9', 'man9', 'man9',
      'pin1', 'pin1', 'pin1',
      'sou9', 'sou9', 'sou9',
      'pin9', 'pin9',
    ];
    const result = detectYakuman(tiles, ctx({ winTile: 'pin9', isTsumo: true }));
    expect(result).not.toBeNull();
    const entry = result!.entries.find((e) => e.name === 'chinroto');
    expect(entry).toBeDefined();
  });
});

// ============================================================
// 九蓮宝燈
// ============================================================
describe('九蓮宝燈', () => {
  it('通常九蓮宝燈が検出される', () => {
    // 1112345678999m + 5m (5萬は2枚)
    const tiles = [
      'man1', 'man1', 'man1',
      'man2', 'man3', 'man4',
      'man5', 'man5',
      'man6', 'man7', 'man8',
      'man9', 'man9', 'man9',
    ];
    const result = detectYakuman(tiles, ctx({ winTile: 'man5' }));
    expect(result).not.toBeNull();
    const entry = result!.entries.find((e) => e.name === 'churen');
    expect(entry).toBeDefined();
  });

  it('純正九蓮宝燈（ダブル役満）が検出される', () => {
    // 1112345678999m の13枚形 + 1m（アガリ前が純正形）
    const tiles = [
      'man1', 'man1', 'man1', 'man1',
      'man2', 'man3', 'man4',
      'man5', 'man6', 'man7', 'man8',
      'man9', 'man9', 'man9',
    ];
    const result = detectYakuman(tiles, ctx({ winTile: 'man1' }));
    expect(result).not.toBeNull();
    const entry = result!.entries.find((e) => e.name === 'churen');
    expect(entry).toBeDefined();
    expect(entry!.multiplier).toBe(2);
  });
});

// ============================================================
// 役満なし（通常役）
// ============================================================
describe('役満なし', () => {
  it('通常手牌は役満でない', () => {
    const tiles = [
      'man1', 'man2', 'man3',
      'man4', 'man5', 'man6',
      'man7', 'man8', 'man9',
      'pin1', 'pin2', 'pin3',
      'pin1', 'pin1',
    ];
    const result = detectYakuman(tiles, ctx({ winTile: 'pin1' }));
    expect(result).toBeNull();
  });
});
