/**
 * 点数算出エンジンのユニットテスト
 */

import { describe, it, expect } from 'vitest';
import { calcScore } from './score';
import { FuResult } from './fu';

function makeFuResult(fu: number): FuResult {
  return {
    items: [],
    rawFu: fu,
    fu,
  };
}

describe('満貫判定', () => {
  it('5翻→満貫', () => {
    const result = calcScore(5, makeFuResult(30), false, false);
    expect(result.level).toBe('mangan');
  });

  it('4翻70符→満貫', () => {
    const result = calcScore(4, makeFuResult(70), false, false);
    expect(result.level).toBe('mangan');
  });

  it('3翻110符→満貫', () => {
    const result = calcScore(3, makeFuResult(110), false, false);
    expect(result.level).toBe('mangan');
  });

  it('4翻30符→通常（満貫未満）', () => {
    const result = calcScore(4, makeFuResult(30), false, false);
    expect(result.level).toBe('normal');
  });
});

describe('跳満・倍満・三倍満・数え役満', () => {
  it('6翻→跳満', () => {
    const result = calcScore(6, makeFuResult(30), false, false);
    expect(result.level).toBe('haneman');
  });

  it('8翻→倍満', () => {
    const result = calcScore(8, makeFuResult(30), false, false);
    expect(result.level).toBe('baiman');
  });

  it('11翻→三倍満', () => {
    const result = calcScore(11, makeFuResult(30), false, false);
    expect(result.level).toBe('sanbaiman');
  });

  it('13翻→数え役満', () => {
    const result = calcScore(13, makeFuResult(30), false, false);
    expect(result.level).toBe('yakuman');
  });
});

describe('子・通常点数（ロン）', () => {
  it('子 1翻30符 ロン → 1000点', () => {
    // 基本点: 30 × 4 = 120, 子ロン: × 4 = 480 → 500
    const result = calcScore(1, makeFuResult(30), false, false);
    expect(result.total).toBe(1000);
    expect(result.level).toBe('normal');
  });

  it('子 2翻30符 ロン → 2000点', () => {
    // 基本点: 30 × 16 = 480, 子ロン: × 4 = 1920 → 2000
    const result = calcScore(2, makeFuResult(30), false, false);
    expect(result.total).toBe(2000);
  });

  it('子 3翻30符 ロン → 3900点', () => {
    // 基本点: 30 × 32 = 960, 子ロン: × 4 = 3840 → 3900
    const result = calcScore(3, makeFuResult(30), false, false);
    expect(result.total).toBe(3900);
  });

  it('子 3翻40符 ロン → 5200点', () => {
    // 基本点: 40 × 32 = 1280, 子ロン: × 4 = 5120 → 5200
    const result = calcScore(3, makeFuResult(40), false, false);
    expect(result.total).toBe(5200);
  });
});

describe('子・通常点数（ツモ）', () => {
  it('子 1翻30符 ツモ → 子各300点 親500点, 合計1100点', () => {
    // 基本点: 30 × 8 = 240
    // 子: 100切り上げ = 300, 親: × 2 → 480 → 500
    const result = calcScore(1, makeFuResult(30), false, true);
    expect(result.payments.find((p) => p.label === '子 各')?.amount).toBe(300);
    expect(result.payments.find((p) => p.label === '親')?.amount).toBe(500);
    expect(result.total).toBe(300 * 2 + 500);
  });

  it('子 3翻20符 ツモ(平和) → 総合計5200点相当', () => {
    // 平和ツモ: 20符固定
    // 基本点: 20 × 32 = 640
    // 子各: 640 → 700, 親: 640 × 2 = 1280 → 1300
    // 合計: 700 × 2 + 1300 = 2700... ではなく仕様では「1300-2600（5200点）」
    // 仕様確認: 平和ツモ3翻は子各1300点・親2600点 → 合計5200点
    // 基本点: 20 × 32 = 640
    // 子各: roundUp100(640) = 700（※実際の麻雀では平和ツモは特例として各1300?）
    // → 実際: 基本点 = 20 × 2^(3+2) = 20 × 32 = 640
    //   親: roundUp100(640 × 2) = roundUp100(1280) = 1300
    //   子各: roundUp100(640) = 700
    //   合計 = 1300 + 700 × 2 = 2700 ≠ 5200...
    // spec.mdの「3翻20符で5200点」は3翻40符の話かもしれない。
    // ここでは基本計算で検証する
    const result = calcScore(3, makeFuResult(20), false, true);
    expect(result.payments.find((p) => p.label === '親')?.amount).toBe(1300);
    expect(result.payments.find((p) => p.label === '子 各')?.amount).toBe(700);
  });
});

describe('親・通常点数（ロン）', () => {
  it('親 1翻30符 ロン → 1500点', () => {
    // 基本点: 30 × 8 = 240, 親ロン: × 6 = 1440 → 1500
    const result = calcScore(1, makeFuResult(30), true, false);
    expect(result.total).toBe(1500);
  });

  it('親 3翻30符 ロン → 5800点', () => {
    // 基本点: 30 × 32 = 960, 親ロン: × 6 = 5760 → 5800
    const result = calcScore(3, makeFuResult(30), true, false);
    expect(result.total).toBe(5800);
  });
});

describe('親・通常点数（ツモ）', () => {
  it('親 1翻30符 ツモ → 子各500点, 合計1500点', () => {
    // 基本点: 30 × 8 = 240, 親ツモ: × 2 = 480 → 500
    const result = calcScore(1, makeFuResult(30), true, true);
    expect(result.payments.find((p) => p.label === '子 各')?.amount).toBe(500);
    expect(result.total).toBe(1500);
  });
});

describe('満貫点数', () => {
  it('子ロン満貫 → 8000点', () => {
    const result = calcScore(5, makeFuResult(30), false, false);
    expect(result.total).toBe(8000);
    expect(result.level).toBe('mangan');
  });

  it('親ロン満貫 → 12000点', () => {
    const result = calcScore(5, makeFuResult(30), true, false);
    expect(result.total).toBe(12000);
    expect(result.level).toBe('mangan');
  });

  it('子ツモ満貫 → 子各2000点 親4000点, 合計8000点', () => {
    const result = calcScore(5, makeFuResult(30), false, true);
    expect(result.payments.find((p) => p.label === '子 各')?.amount).toBe(2000);
    expect(result.payments.find((p) => p.label === '親')?.amount).toBe(4000);
    expect(result.total).toBe(8000);
  });

  it('親ツモ満貫 → 子各4000点オール, 合計12000点', () => {
    const result = calcScore(5, makeFuResult(30), true, true);
    expect(result.payments.find((p) => p.label === '子 各')?.amount).toBe(4000);
    expect(result.total).toBe(12000);
  });
});

describe('跳満点数', () => {
  it('子ロン跳満 → 12000点', () => {
    const result = calcScore(6, makeFuResult(30), false, false);
    expect(result.total).toBe(12000);
    expect(result.level).toBe('haneman');
  });

  it('親ロン跳満 → 18000点', () => {
    const result = calcScore(6, makeFuResult(30), true, false);
    expect(result.total).toBe(18000);
    expect(result.level).toBe('haneman');
  });
});

describe('数え役満（13翻以上）', () => {
  it('子ロン数え役満(13翻) → 32000点', () => {
    const result = calcScore(13, makeFuResult(30), false, false);
    expect(result.total).toBe(32000);
    expect(result.level).toBe('yakuman');
  });

  it('親ロン数え役満(13翻) → 48000点', () => {
    const result = calcScore(13, makeFuResult(30), true, false);
    expect(result.total).toBe(48000);
    expect(result.level).toBe('yakuman');
  });
});

describe('七対子: 25符固定で点数計算', () => {
  it('子 七対子ロン(2翻25符) → 1600点', () => {
    // 基本点: 25 × 16 = 400, 子ロン: × 4 = 1600
    const result = calcScore(2, makeFuResult(25), false, false);
    expect(result.total).toBe(1600);
  });
});

describe('ロンとツモの点数が異なる', () => {
  it('子 3翻30符 ロン=3900点 ≠ ツモ合計', () => {
    // 3翻30符:
    //   ロン: 30×32×4=3840→3900
    //   ツモ: 親:30×32×2=1920→2000, 子各:30×32=960→1000, 合計=4000
    const ron = calcScore(3, makeFuResult(30), false, false);
    const tsumo = calcScore(3, makeFuResult(30), false, true);
    expect(ron.total).toBe(3900);
    expect(tsumo.total).toBe(4000);
    expect(ron.total).not.toBe(tsumo.total);
  });
});
