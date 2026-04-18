/**
 * 符計算エンジンのユニットテスト
 */

import { describe, it, expect } from 'vitest';
import { calcFu } from './fu';
import { YakuResult, HandDecomposition, Mentsu, Jantou } from '@/types/yaku';
import { YakuContext } from '@/types/yaku';
import { YAKU_DEFINITIONS } from './yaku';

// ============================================================
// テスト用ヘルパー
// ============================================================

function makeContext(overrides: Partial<YakuContext> = {}): YakuContext {
  return {
    seatWind: 'east',
    roundWind: 'east',
    isOpen: false,
    winTile: 'man1',
    isTsumo: false,
    ...overrides,
  };
}

function makeMentsu(type: 'shuntsu' | 'koutsu' | 'kantsu', tiles: string[], isOpen = false): Mentsu {
  return {
    type,
    tiles,
    suit: tiles[0].startsWith('man') ? 'man'
      : tiles[0].startsWith('pin') ? 'pin'
      : tiles[0].startsWith('sou') ? 'sou'
      : tiles[0].startsWith('wind') ? 'wind'
      : 'dragon',
    isOpen,
  };
}

function makeDecomp(mentsuList: Mentsu[], jantouTile: string): HandDecomposition {
  const suit = jantouTile.startsWith('man') ? 'man'
    : jantouTile.startsWith('pin') ? 'pin'
    : jantouTile.startsWith('sou') ? 'sou'
    : jantouTile.startsWith('wind') ? 'wind'
    : 'dragon';
  return {
    mentsuList,
    jantou: { tile: jantouTile, suit } as Jantou,
  };
}

function makeYakuResult(overrides: Partial<YakuResult> = {}): YakuResult {
  return {
    yaku: [],
    totalHan: 0,
    decomposition: null,
    isChiitoitsu: false,
    ...overrides,
  };
}

// ============================================================
// テスト
// ============================================================

describe('七対子: 25符固定', () => {
  it('七対子は25符', () => {
    const result = calcFu(
      makeYakuResult({ isChiitoitsu: true }),
      makeContext(),
    );
    expect(result.fu).toBe(25);
    expect(result.rawFu).toBe(25);
  });
});

describe('平和: 固定符', () => {
  it('平和ツモ: 20符固定', () => {
    const decomp = makeDecomp(
      [
        makeMentsu('shuntsu', ['man2', 'man3', 'man4']),
        makeMentsu('shuntsu', ['pin4', 'pin5', 'pin6']),
        makeMentsu('shuntsu', ['sou6', 'sou7', 'sou8']),
        makeMentsu('shuntsu', ['man7', 'man8', 'man9']),
      ],
      'man6',
    );
    const result = calcFu(
      makeYakuResult({ yaku: [YAKU_DEFINITIONS.pinfu], decomposition: decomp }),
      makeContext({ winTile: 'man9', isTsumo: true }),
    );
    expect(result.fu).toBe(20);
  });

  it('平和ロン: 30符固定', () => {
    const decomp = makeDecomp(
      [
        makeMentsu('shuntsu', ['man2', 'man3', 'man4']),
        makeMentsu('shuntsu', ['pin4', 'pin5', 'pin6']),
        makeMentsu('shuntsu', ['sou6', 'sou7', 'sou8']),
        makeMentsu('shuntsu', ['man7', 'man8', 'man9']),
      ],
      'man6',
    );
    const result = calcFu(
      makeYakuResult({ yaku: [YAKU_DEFINITIONS.pinfu], decomposition: decomp }),
      makeContext({ winTile: 'man9', isTsumo: false }),
    );
    expect(result.fu).toBe(30);
  });
});

describe('副底: 20符', () => {
  it('副底は20符が加算される', () => {
    // 両面待ちロン、順子のみ、非役牌雀頭
    const decomp = makeDecomp(
      [
        makeMentsu('shuntsu', ['man1', 'man2', 'man3']),
        makeMentsu('shuntsu', ['man4', 'man5', 'man6']),
        makeMentsu('shuntsu', ['man7', 'man8', 'man9']),
        makeMentsu('shuntsu', ['pin2', 'pin3', 'pin4']),
      ],
      'pin6',
    );
    const result = calcFu(
      makeYakuResult({ decomposition: decomp }),
      makeContext({ winTile: 'pin4', isTsumo: false }),
    );
    // 副底20 + 門前ロン10 = 30符
    const fudaiItem = result.items.find((i) => i.label === '副底');
    expect(fudaiItem?.fu).toBe(20);
  });
});

describe('面子符', () => {
  it('中張明刻: 2符', () => {
    const decomp = makeDecomp(
      [
        makeMentsu('koutsu', ['man5', 'man5', 'man5'], true), // 中張明刻
        makeMentsu('shuntsu', ['pin2', 'pin3', 'pin4']),
        makeMentsu('shuntsu', ['sou5', 'sou6', 'sou7']),
        makeMentsu('shuntsu', ['man2', 'man3', 'man4']),
      ],
      'pin6',
    );
    const result = calcFu(
      makeYakuResult({ decomposition: decomp }),
      makeContext({ winTile: 'man4', isTsumo: false }),
    );
    const mentsuItem = result.items.find((i) => i.label === '中張明刻');
    expect(mentsuItem?.fu).toBe(2);
  });

  it('中張暗刻: 4符', () => {
    const decomp = makeDecomp(
      [
        makeMentsu('koutsu', ['man5', 'man5', 'man5'], false), // 中張暗刻
        makeMentsu('shuntsu', ['pin2', 'pin3', 'pin4']),
        makeMentsu('shuntsu', ['sou5', 'sou6', 'sou7']),
        makeMentsu('shuntsu', ['man2', 'man3', 'man4']),
      ],
      'pin6',
    );
    const result = calcFu(
      makeYakuResult({ decomposition: decomp }),
      makeContext({ winTile: 'man4', isTsumo: false }),
    );
    const mentsuItem = result.items.find((i) => i.label === '中張暗刻');
    expect(mentsuItem?.fu).toBe(4);
  });

  it('幺九明刻: 4符', () => {
    const decomp = makeDecomp(
      [
        makeMentsu('koutsu', ['man1', 'man1', 'man1'], true), // 幺九明刻
        makeMentsu('shuntsu', ['pin2', 'pin3', 'pin4']),
        makeMentsu('shuntsu', ['sou5', 'sou6', 'sou7']),
        makeMentsu('shuntsu', ['man2', 'man3', 'man4']),
      ],
      'pin6',
    );
    const result = calcFu(
      makeYakuResult({ decomposition: decomp }),
      makeContext({ winTile: 'man4', isTsumo: false }),
    );
    const mentsuItem = result.items.find((i) => i.label === '幺九明刻');
    expect(mentsuItem?.fu).toBe(4);
  });

  it('幺九暗刻: 8符', () => {
    const decomp = makeDecomp(
      [
        makeMentsu('koutsu', ['man1', 'man1', 'man1'], false), // 幺九暗刻
        makeMentsu('shuntsu', ['pin2', 'pin3', 'pin4']),
        makeMentsu('shuntsu', ['sou5', 'sou6', 'sou7']),
        makeMentsu('shuntsu', ['man2', 'man3', 'man4']),
      ],
      'pin6',
    );
    const result = calcFu(
      makeYakuResult({ decomposition: decomp }),
      makeContext({ winTile: 'man4', isTsumo: false }),
    );
    const mentsuItem = result.items.find((i) => i.label === '幺九暗刻');
    expect(mentsuItem?.fu).toBe(8);
  });

  it('幺九暗槓: 32符', () => {
    const decomp = makeDecomp(
      [
        makeMentsu('kantsu', ['man1', 'man1', 'man1', 'man1'], false), // 幺九暗槓
        makeMentsu('shuntsu', ['pin2', 'pin3', 'pin4']),
        makeMentsu('shuntsu', ['sou5', 'sou6', 'sou7']),
        makeMentsu('shuntsu', ['man2', 'man3', 'man4']),
      ],
      'pin6',
    );
    const result = calcFu(
      makeYakuResult({ decomposition: decomp }),
      makeContext({ winTile: 'man4', isTsumo: false }),
    );
    const mentsuItem = result.items.find((i) => i.label === '幺九暗槓');
    expect(mentsuItem?.fu).toBe(32);
  });
});

describe('待ち形符', () => {
  it('単騎待ち: 2符', () => {
    // 4面子 + 単騎雀頭
    const decomp = makeDecomp(
      [
        makeMentsu('koutsu', ['man2', 'man2', 'man2']),
        makeMentsu('shuntsu', ['pin2', 'pin3', 'pin4']),
        makeMentsu('shuntsu', ['sou5', 'sou6', 'sou7']),
        makeMentsu('shuntsu', ['man4', 'man5', 'man6']),
      ],
      'pin6', // アガリ牌 = 雀頭牌
    );
    const result = calcFu(
      makeYakuResult({ decomposition: decomp }),
      makeContext({ winTile: 'pin6', isTsumo: false }),
    );
    const waitItem = result.items.find((i) => i.label === '単騎待ち');
    expect(waitItem?.fu).toBe(2);
  });

  it('嵌張待ち: 2符', () => {
    const decomp = makeDecomp(
      [
        makeMentsu('shuntsu', ['man2', 'man3', 'man4']), // man3が嵌張
        makeMentsu('shuntsu', ['pin2', 'pin3', 'pin4']),
        makeMentsu('shuntsu', ['sou5', 'sou6', 'sou7']),
        makeMentsu('koutsu', ['man6', 'man6', 'man6']),
      ],
      'pin6',
    );
    const result = calcFu(
      makeYakuResult({ decomposition: decomp }),
      makeContext({ winTile: 'man3', isTsumo: false }),
    );
    const waitItem = result.items.find((i) => i.label === '嵌張待ち');
    expect(waitItem?.fu).toBe(2);
  });

  it('辺張待ち（1-2-3の3待ち）: 2符', () => {
    const decomp = makeDecomp(
      [
        makeMentsu('shuntsu', ['man1', 'man2', 'man3']), // 3が辺張
        makeMentsu('shuntsu', ['pin2', 'pin3', 'pin4']),
        makeMentsu('shuntsu', ['sou5', 'sou6', 'sou7']),
        makeMentsu('koutsu', ['man6', 'man6', 'man6']),
      ],
      'pin6',
    );
    const result = calcFu(
      makeYakuResult({ decomposition: decomp }),
      makeContext({ winTile: 'man3', isTsumo: false }),
    );
    const waitItem = result.items.find((i) => i.label === '辺張待ち');
    expect(waitItem?.fu).toBe(2);
  });

  it('両面待ち: 0符（符なし）', () => {
    const decomp = makeDecomp(
      [
        makeMentsu('shuntsu', ['man2', 'man3', 'man4']), // man2かman5の両面
        makeMentsu('shuntsu', ['pin2', 'pin3', 'pin4']),
        makeMentsu('shuntsu', ['sou5', 'sou6', 'sou7']),
        makeMentsu('koutsu', ['man6', 'man6', 'man6']),
      ],
      'pin6',
    );
    const result = calcFu(
      makeYakuResult({ decomposition: decomp }),
      makeContext({ winTile: 'man2', isTsumo: false }),
    );
    const waitItem = result.items.find(
      (i) => i.label === '辺張待ち' || i.label === '嵌張待ち' || i.label === '単騎待ち',
    );
    expect(waitItem).toBeUndefined();
  });
});

describe('役牌雀頭符', () => {
  it('役牌雀頭: 2符', () => {
    const decomp = makeDecomp(
      [
        makeMentsu('shuntsu', ['man1', 'man2', 'man3']),
        makeMentsu('shuntsu', ['pin2', 'pin3', 'pin4']),
        makeMentsu('shuntsu', ['sou5', 'sou6', 'sou7']),
        makeMentsu('shuntsu', ['man4', 'man5', 'man6']),
      ],
      'dragon3', // 中（三元牌）を雀頭
    );
    const result = calcFu(
      makeYakuResult({ decomposition: decomp }),
      makeContext({ winTile: 'man6', isTsumo: false }),
    );
    const jantouItem = result.items.find((i) => i.label === '役牌雀頭');
    expect(jantouItem?.fu).toBe(2);
  });

  it('非役牌雀頭: 0符（符なし）', () => {
    const decomp = makeDecomp(
      [
        makeMentsu('shuntsu', ['man1', 'man2', 'man3']),
        makeMentsu('shuntsu', ['pin2', 'pin3', 'pin4']),
        makeMentsu('shuntsu', ['sou5', 'sou6', 'sou7']),
        makeMentsu('shuntsu', ['man4', 'man5', 'man6']),
      ],
      'man8', // 非役牌雀頭
    );
    const result = calcFu(
      makeYakuResult({ decomposition: decomp }),
      makeContext({ winTile: 'man6', isTsumo: false }),
    );
    const jantouItem = result.items.find((i) => i.label === '役牌雀頭');
    expect(jantouItem).toBeUndefined();
  });
});

describe('ツモ符・門前ロン符', () => {
  it('ツモ符: 2符', () => {
    const decomp = makeDecomp(
      [
        makeMentsu('shuntsu', ['man1', 'man2', 'man3']),
        makeMentsu('shuntsu', ['pin2', 'pin3', 'pin4']),
        makeMentsu('shuntsu', ['sou5', 'sou6', 'sou7']),
        makeMentsu('koutsu', ['man6', 'man6', 'man6']),
      ],
      'pin6',
    );
    const result = calcFu(
      makeYakuResult({ decomposition: decomp }),
      makeContext({ winTile: 'man3', isTsumo: true }),
    );
    const tsumoItem = result.items.find((i) => i.label === 'ツモ');
    expect(tsumoItem?.fu).toBe(2);
  });

  it('門前ロン符: 10符', () => {
    const decomp = makeDecomp(
      [
        makeMentsu('shuntsu', ['man1', 'man2', 'man3']),
        makeMentsu('shuntsu', ['pin2', 'pin3', 'pin4']),
        makeMentsu('shuntsu', ['sou5', 'sou6', 'sou7']),
        makeMentsu('koutsu', ['man6', 'man6', 'man6']),
      ],
      'pin6',
    );
    const result = calcFu(
      makeYakuResult({ decomposition: decomp }),
      makeContext({ winTile: 'man3', isTsumo: false }),
    );
    const ronItem = result.items.find((i) => i.label === '門前ロン');
    expect(ronItem?.fu).toBe(10);
  });

  it('副露ありロンでは門前ロン符なし', () => {
    const decomp = makeDecomp(
      [
        makeMentsu('shuntsu', ['man1', 'man2', 'man3']),
        makeMentsu('shuntsu', ['pin2', 'pin3', 'pin4']),
        makeMentsu('shuntsu', ['sou5', 'sou6', 'sou7']),
        makeMentsu('koutsu', ['man6', 'man6', 'man6'], true),
      ],
      'pin6',
    );
    const result = calcFu(
      makeYakuResult({ decomposition: decomp }),
      makeContext({ winTile: 'man3', isTsumo: false, isOpen: true }),
    );
    const ronItem = result.items.find((i) => i.label === '門前ロン');
    expect(ronItem).toBeUndefined();
  });
});

describe('総合: 切り上げ確認', () => {
  it('副底20 + 中張暗刻4 + 単騎2 + 門前ロン10 = 36 → 40符', () => {
    const decomp = makeDecomp(
      [
        makeMentsu('koutsu', ['man5', 'man5', 'man5'], false), // 中張暗刻4符
        makeMentsu('shuntsu', ['pin2', 'pin3', 'pin4']),
        makeMentsu('shuntsu', ['sou5', 'sou6', 'sou7']),
        makeMentsu('shuntsu', ['man2', 'man3', 'man4']),
      ],
      'pin6', // アガリ牌=雀頭で単騎待ち
    );
    const result = calcFu(
      makeYakuResult({ decomposition: decomp }),
      makeContext({ winTile: 'pin6', isTsumo: false }),
    );
    expect(result.rawFu).toBe(36);
    expect(result.fu).toBe(40);
  });
});
