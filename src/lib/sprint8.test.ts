/**
 * Sprint 8: ドラ反映・赤ドラ・数え役満の統合テスト
 */

import { describe, it, expect } from 'vitest';
import { getDoraFromIndicator } from './dora';
import { calcScore, calcYakumanScore } from './score';
import { detectYakuman } from './yakuman';
import { YakuContext } from '@/types/yaku';
import { isAkaDora, getAkaDoraBaseId } from '@/data/tiles';

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
// ドラ表示牌 → 実ドラ変換
// ============================================================
describe('ドラ表示牌 → 実ドラ変換', () => {
  it('数牌のドラ: 5萬表示牌 → 6萬が実ドラ', () => {
    expect(getDoraFromIndicator('man5')).toBe('man6');
  });

  it('数牌のドラ循環: 9萬表示牌 → 1萬が実ドラ', () => {
    expect(getDoraFromIndicator('man9')).toBe('man1');
  });

  it('風牌のドラ循環: 北（wind4）表示牌 → 東（wind1）が実ドラ', () => {
    expect(getDoraFromIndicator('wind4')).toBe('wind1');
  });

  it('三元牌のドラ循環: 中（dragon3）表示牌 → 白（dragon1）が実ドラ', () => {
    expect(getDoraFromIndicator('dragon3')).toBe('dragon1');
  });
});

// ============================================================
// 赤ドラ識別
// ============================================================
describe('赤ドラの識別', () => {
  it('赤五萬(man5r)は赤ドラとして識別される', () => {
    expect(isAkaDora('man5r')).toBe(true);
  });

  it('通常の五萬(man5)は赤ドラではない', () => {
    expect(isAkaDora('man5')).toBe(false);
  });

  it('赤ドラの通常牌IDを取得: man5r → man5', () => {
    expect(getAkaDoraBaseId('man5r')).toBe('man5');
    expect(getAkaDoraBaseId('pin5r')).toBe('pin5');
    expect(getAkaDoraBaseId('sou5r')).toBe('sou5');
  });
});

// ============================================================
// 数え役満（13翻以上 = 役満点数）
// ============================================================
describe('数え役満点数', () => {
  it('子ロン13翻: 数え役満 32000点', () => {
    const result = calcScore(13, { items: [], rawFu: 30, fu: 30 }, false, false);
    expect(result.total).toBe(32000);
    expect(result.level).toBe('yakuman');
  });

  it('親ロン13翻: 数え役満 48000点', () => {
    const result = calcScore(13, { items: [], rawFu: 30, fu: 30 }, true, false);
    expect(result.total).toBe(48000);
    expect(result.level).toBe('yakuman');
  });

  it('14翻以上でも数え役満: 子ロン32000点', () => {
    const result = calcScore(15, { items: [], rawFu: 30, fu: 30 }, false, false);
    expect(result.total).toBe(32000);
    expect(result.level).toBe('yakuman');
  });
});

// ============================================================
// 役満点数
// ============================================================
describe('役満点数', () => {
  it('子ロン役満1倍（国士無双）: 32000点', () => {
    const yakumanResult = {
      isYakuman: true as const,
      entries: [{ name: 'kokushi' as const, label: '国士無双', multiplier: 1 as const }],
      totalMultiplier: 1,
    };
    const score = calcYakumanScore(yakumanResult, false, false);
    expect(score.total).toBe(32000);
    expect(score.level).toBe('yakuman1');
  });

  it('親ロン役満1倍（国士無双）: 48000点', () => {
    const yakumanResult = {
      isYakuman: true as const,
      entries: [{ name: 'kokushi' as const, label: '国士無双', multiplier: 1 as const }],
      totalMultiplier: 1,
    };
    const score = calcYakumanScore(yakumanResult, true, false);
    expect(score.total).toBe(48000);
    expect(score.level).toBe('yakuman1');
  });

  it('子ロンダブル役満（四暗刻単騎）: 64000点', () => {
    const yakumanResult = {
      isYakuman: true as const,
      entries: [{ name: 'suanko' as const, label: '四暗刻単騎', multiplier: 2 as const }],
      totalMultiplier: 2,
    };
    const score = calcYakumanScore(yakumanResult, false, false);
    expect(score.total).toBe(64000);
    expect(score.level).toBe('yakuman2');
  });

  it('親ロンダブル役満（四暗刻単騎）: 96000点', () => {
    const yakumanResult = {
      isYakuman: true as const,
      entries: [{ name: 'suanko' as const, label: '四暗刻単騎', multiplier: 2 as const }],
      totalMultiplier: 2,
    };
    const score = calcYakumanScore(yakumanResult, true, false);
    expect(score.total).toBe(96000);
    expect(score.level).toBe('yakuman2');
  });

  it('子ツモ役満1倍（四暗刻）: 子各8000点・親16000点 = 合計32000点', () => {
    const yakumanResult = {
      isYakuman: true as const,
      entries: [{ name: 'suanko' as const, label: '四暗刻', multiplier: 1 as const }],
      totalMultiplier: 1,
    };
    const score = calcYakumanScore(yakumanResult, false, true);
    expect(score.total).toBe(32000);
    const dealerPay = score.payments.find((p) => p.label === '親')?.amount;
    const nonDealerPay = score.payments.find((p) => p.label === '子 各')?.amount;
    expect(dealerPay).toBe(16000);
    expect(nonDealerPay).toBe(8000);
  });
});

// ============================================================
// 役満判定（国士無双・四暗刻）
// ============================================================
describe('役満判定: 国士無双', () => {
  it('国士無双十三面待ちがダブル役満として検出される', () => {
    // 全13種各1枚の形でman1でアガリ = 純正13面待ち
    const tiles = [
      'man1', 'man1', 'man9', 'pin1', 'pin9', 'sou1', 'sou9',
      'wind1', 'wind2', 'wind3', 'wind4',
      'dragon1', 'dragon2', 'dragon3',
    ];
    const result = detectYakuman(tiles, ctx({ winTile: 'man1' }));
    expect(result).not.toBeNull();
    expect(result!.entries[0].name).toBe('kokushi');
    expect(result!.entries[0].multiplier).toBe(2);
    expect(result!.totalMultiplier).toBe(2);
  });

  it('通常手牌は役満でない', () => {
    const tiles = [
      'man1', 'man2', 'man3', 'man4', 'man5', 'man6',
      'man7', 'man8', 'man9', 'pin1', 'pin2', 'pin3',
      'pin1', 'pin1',
    ];
    const result = detectYakuman(tiles, ctx({ winTile: 'pin1' }));
    expect(result).toBeNull();
  });
});

describe('役満判定: 四暗刻単騎', () => {
  it('四暗刻単騎（ツモ）がダブル役満として検出される', () => {
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
});
