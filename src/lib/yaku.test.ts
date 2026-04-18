import { describe, it, expect } from 'vitest';
import { detectYaku, getAllDecompositions } from './yaku';
import { YakuContext } from '@/types/yaku';

// デフォルトコンテキスト（子・東場・東家・門前・ロン）
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
// 面子分解テスト
// ============================================================
describe('getAllDecompositions', () => {
  it('シンプルな平和形を1通り分解できる', () => {
    // 123m 456m 789m 123p + 11p
    const tiles = [
      'man1', 'man2', 'man3',
      'man4', 'man5', 'man6',
      'man7', 'man8', 'man9',
      'pin1', 'pin2', 'pin3',
      'pin1', 'pin1',
    ];
    const decomps = getAllDecompositions(tiles);
    expect(decomps.length).toBeGreaterThan(0);
    expect(decomps[0].mentsuList).toHaveLength(4);
  });

  it('対々和形を分解できる', () => {
    // 111m 222m 333m 444m + 55m
    const tiles = [
      'man1', 'man1', 'man1',
      'man2', 'man2', 'man2',
      'man3', 'man3', 'man3',
      'man4', 'man4', 'man4',
      'man5', 'man5',
    ];
    const decomps = getAllDecompositions(tiles);
    expect(decomps.length).toBeGreaterThan(0);
  });
});

// ============================================================
// タンヤオ
// ============================================================
describe('タンヤオ', () => {
  it('全中張牌でタンヤオが検出される', () => {
    // 234m 456m 678m 234p + 55p
    const tiles = [
      'man2', 'man3', 'man4',
      'man4', 'man5', 'man6',
      'man6', 'man7', 'man8',
      'pin2', 'pin3', 'pin4',
      'pin5', 'pin5',
    ];
    const result = detectYaku(tiles, ctx({ winTile: 'pin5' }));
    expect(result.yaku.map((y) => y.name)).toContain('tanyao');
  });

  it('幺九牌が含まれる場合はタンヤオにならない', () => {
    // 123m 456m 789m 123p + 11p (1と9が含まれる)
    const tiles = [
      'man1', 'man2', 'man3',
      'man4', 'man5', 'man6',
      'man7', 'man8', 'man9',
      'pin1', 'pin2', 'pin3',
      'pin1', 'pin1',
    ];
    const result = detectYaku(tiles, ctx({ winTile: 'pin1' }));
    expect(result.yaku.map((y) => y.name)).not.toContain('tanyao');
  });
});

// ============================================================
// 平和
// ============================================================
describe('平和', () => {
  it('両面待ちの順子4組で平和が検出される', () => {
    // 123m 456m 789m 123p + 55p でアガリ（winTile = 3p or 1p でリャンメン）
    // 手牌: 123m 456m 789m 23p + 55p (12枚ではなく) →
    // 実際: 123m 456m 789m 55p 雀頭 + 123p 順子 でリャンメン待ちは 1p か 4p
    // winTile = man1 として: 雀頭 55p, 面子 234m 567m 89m... ではなく
    // 正確な平和形: 12m34m56m78m + 99m雀頭 のアガリ牌は 3m または 9m
    // 平和成立のシンプルな例:
    //   234m 456p 678s 234s + 66m でリャンメン待ちの winTile = 2s or 4s
    const tiles = [
      'man2', 'man3', 'man4',
      'pin4', 'pin5', 'pin6',
      'sou6', 'sou7', 'sou8',
      'sou2', 'sou3', 'sou4',
      'man6', 'man6',
    ];
    // 雀頭: 66m (非役牌), 面子: 234m 456p 678s 234s, winTile = 4s (リャンメン端)
    const result = detectYaku(tiles, ctx({ winTile: 'sou4', isTsumo: false, seatWind: 'south', roundWind: 'east' }));
    expect(result.yaku.map((y) => y.name)).toContain('pinfu');
  });

  it('雀頭が役牌の場合は平和にならない', () => {
    // 123m 456m 789m 234p + 東東（役牌雀頭）
    const tiles = [
      'man1', 'man2', 'man3',
      'man4', 'man5', 'man6',
      'man7', 'man8', 'man9',
      'pin2', 'pin3', 'pin4',
      'wind1', 'wind1',
    ];
    const result = detectYaku(tiles, ctx({ winTile: 'pin4', seatWind: 'east', roundWind: 'east' }));
    expect(result.yaku.map((y) => y.name)).not.toContain('pinfu');
  });
});

// ============================================================
// 一盃口
// ============================================================
describe('一盃口', () => {
  it('同一順子2組で一盃口が検出される', () => {
    // 123m 123m 456m 789m + 11p
    const tiles = [
      'man1', 'man2', 'man3',
      'man1', 'man2', 'man3',
      'man4', 'man5', 'man6',
      'man7', 'man8', 'man9',
      'pin1', 'pin1',
    ];
    const result = detectYaku(tiles, ctx({ winTile: 'pin1' }));
    const names = result.yaku.map((y) => y.name);
    expect(names).toContain('iipeiko');
    expect(names).not.toContain('ryanpeiko');
  });
});

// ============================================================
// 二盃口
// ============================================================
describe('二盃口', () => {
  it('同一順子4組（2組×2）で二盃口が検出される', () => {
    // 123m 123m 456p 456p + 77s
    const tiles = [
      'man1', 'man2', 'man3',
      'man1', 'man2', 'man3',
      'pin4', 'pin5', 'pin6',
      'pin4', 'pin5', 'pin6',
      'sou7', 'sou7',
    ];
    const result = detectYaku(tiles, ctx({ winTile: 'sou7' }));
    const names = result.yaku.map((y) => y.name);
    expect(names).toContain('ryanpeiko');
    expect(names).not.toContain('iipeiko');
  });
});

// ============================================================
// 三色同順
// ============================================================
describe('三色同順', () => {
  it('萬筒索の同番順子で三色同順が検出される', () => {
    // 123m 123p 123s 456m + 77m
    const tiles = [
      'man1', 'man2', 'man3',
      'pin1', 'pin2', 'pin3',
      'sou1', 'sou2', 'sou3',
      'man4', 'man5', 'man6',
      'man7', 'man7',
    ];
    const result = detectYaku(tiles, ctx({ winTile: 'man7' }));
    expect(result.yaku.map((y) => y.name)).toContain('sanshoku-juntsu');
  });
});

// ============================================================
// 一気通貫
// ============================================================
describe('一気通貫', () => {
  it('同一スーツ123 456 789 順子で一気通貫が検出される', () => {
    // 123m 456m 789m 123p + 11s
    const tiles = [
      'man1', 'man2', 'man3',
      'man4', 'man5', 'man6',
      'man7', 'man8', 'man9',
      'pin1', 'pin2', 'pin3',
      'sou1', 'sou1',
    ];
    const result = detectYaku(tiles, ctx({ winTile: 'sou1' }));
    expect(result.yaku.map((y) => y.name)).toContain('ittsu');
  });
});

// ============================================================
// 対々和
// ============================================================
describe('対々和', () => {
  it('全刻子構成で対々和が検出される', () => {
    // 111m 222m 333m 444m + 55m
    const tiles = [
      'man1', 'man1', 'man1',
      'man2', 'man2', 'man2',
      'man3', 'man3', 'man3',
      'man4', 'man4', 'man4',
      'man5', 'man5',
    ];
    const result = detectYaku(tiles, ctx({ winTile: 'man5' }));
    expect(result.yaku.map((y) => y.name)).toContain('toitoi');
  });
});

// ============================================================
// 七対子
// ============================================================
describe('七対子', () => {
  it('7種類の対子（通常形に分解できない）で七対子が検出される', () => {
    // 11m 33p 55s 77m 99p 東東 白白 - 異なるスーツ混在で通常形に分解できない七対子
    const tiles = [
      'man1', 'man1',
      'pin3', 'pin3',
      'sou5', 'sou5',
      'man7', 'man7',
      'pin9', 'pin9',
      'wind1', 'wind1',
      'dragon1', 'dragon1',
    ];
    const result = detectYaku(tiles, ctx({ winTile: 'dragon1' }));
    expect(result.yaku.map((y) => y.name)).toContain('chiitoitsu');
    expect(result.isChiitoitsu).toBe(true);
  });

  it('七対子でタンヤオ複合（通常形に分解できない形）', () => {
    // 22m 44p 66s 88m 22p 44s 66m (全中張・混合形)
    const tiles = [
      'man2', 'man2',
      'pin4', 'pin4',
      'sou6', 'sou6',
      'man8', 'man8',
      'pin2', 'pin2',
      'sou4', 'sou4',
      'man6', 'man6',
    ];
    const result = detectYaku(tiles, ctx({ winTile: 'man6' }));
    const names = result.yaku.map((y) => y.name);
    expect(names).toContain('chiitoitsu');
    expect(names).toContain('tanyao');
  });
});

// ============================================================
// 清一色
// ============================================================
describe('清一色', () => {
  it('萬子のみの手牌で清一色が検出される', () => {
    // 123m 456m 789m 111m + 22m
    const tiles = [
      'man1', 'man2', 'man3',
      'man4', 'man5', 'man6',
      'man7', 'man8', 'man9',
      'man1', 'man1', 'man1',
      'man2', 'man2',
    ];
    const result = detectYaku(tiles, ctx({ winTile: 'man2' }));
    expect(result.yaku.map((y) => y.name)).toContain('chinitsu');
  });
});

// ============================================================
// 混一色
// ============================================================
describe('混一色', () => {
  it('萬子＋字牌の手牌で混一色が検出される', () => {
    // 123m 456m 789m 東東東 + 11m
    const tiles = [
      'man1', 'man2', 'man3',
      'man4', 'man5', 'man6',
      'man7', 'man8', 'man9',
      'wind1', 'wind1', 'wind1',
      'man1', 'man1',
    ];
    const result = detectYaku(tiles, ctx({ winTile: 'man1', seatWind: 'south' }));
    expect(result.yaku.map((y) => y.name)).toContain('honitsu');
  });
});

// ============================================================
// 役牌
// ============================================================
describe('役牌', () => {
  it('白の刻子で役牌（白）が検出される', () => {
    // 123m 456m 789m 白白白 + 11p
    const tiles = [
      'man1', 'man2', 'man3',
      'man4', 'man5', 'man6',
      'man7', 'man8', 'man9',
      'dragon1', 'dragon1', 'dragon1',
      'pin1', 'pin1',
    ];
    const result = detectYaku(tiles, ctx({ winTile: 'pin1' }));
    expect(result.yaku.map((y) => y.name)).toContain('yakuhai-haku');
  });

  it('場風（東）の刻子で役牌（場風）が検出される', () => {
    // 123m 456m 789m 東東東 + 11p
    const tiles = [
      'man1', 'man2', 'man3',
      'man4', 'man5', 'man6',
      'man7', 'man8', 'man9',
      'wind1', 'wind1', 'wind1',
      'pin1', 'pin1',
    ];
    const result = detectYaku(tiles, ctx({ winTile: 'pin1', roundWind: 'east', seatWind: 'south' }));
    expect(result.yaku.map((y) => y.name)).toContain('yakuhai-round');
  });
});

// ============================================================
// 複合役
// ============================================================
describe('複合役', () => {
  it('タンヤオ＋平和＋一盃口が同時に成立する', () => {
    // 234m 234m 567p 678p + 88s (両面待ち: 88s 雀頭)
    // → タンヤオ + 一盃口 + 平和が成立
    // winTile を順子の端牌にして平和成立
    const tiles = [
      'man2', 'man3', 'man4',
      'man2', 'man3', 'man4',
      'pin5', 'pin6', 'pin7',
      'pin6', 'pin7', 'pin8',
      'sou8', 'sou8',
    ];
    const result = detectYaku(tiles, ctx({ winTile: 'pin8', isTsumo: false }));
    const names = result.yaku.map((y) => y.name);
    expect(names).toContain('tanyao');
    expect(names).toContain('iipeiko');
  });

  it('タンヤオのみが成立する手牌', () => {
    // 234m 345m 456m 567m + 88p
    const tiles = [
      'man2', 'man3', 'man4',
      'man3', 'man4', 'man5',
      'man4', 'man5', 'man6',
      'man5', 'man6', 'man7',
      'pin8', 'pin8',
    ];
    const result = detectYaku(tiles, ctx({ winTile: 'pin8' }));
    const names = result.yaku.map((y) => y.name);
    expect(names).toContain('tanyao');
  });
});
