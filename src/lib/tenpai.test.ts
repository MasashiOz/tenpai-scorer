import { describe, it, expect } from 'vitest';
import { checkTenpai, isWinningHand } from './tenpai';

// ============================================================
// isWinningHand: 和了形判定
// ============================================================
describe('isWinningHand', () => {
  it('シンプルな平和形を和了と判定', () => {
    // 123m 456m 789m 123p + 11p (雀頭)
    const tiles = [
      'man1', 'man2', 'man3',
      'man4', 'man5', 'man6',
      'man7', 'man8', 'man9',
      'pin1', 'pin2', 'pin3',
      'pin1', 'pin1',
    ];
    expect(isWinningHand(tiles)).toBe(true);
  });

  it('対々和形を和了と判定', () => {
    // 111m 222m 333m 444m 55m
    const tiles = [
      'man1', 'man1', 'man1',
      'man2', 'man2', 'man2',
      'man3', 'man3', 'man3',
      'man4', 'man4', 'man4',
      'man5', 'man5',
    ];
    expect(isWinningHand(tiles)).toBe(true);
  });

  it('バラバラの牌は和了と判定しない', () => {
    const tiles = [
      'man1', 'man3', 'man5',
      'pin2', 'pin4', 'pin6',
      'sou1', 'sou3', 'sou5',
      'wind1', 'wind2', 'wind3',
      'dragon1', 'dragon2',
    ];
    expect(isWinningHand(tiles)).toBe(false);
  });
});

// ============================================================
// checkTenpai: 聴牌判定
// ============================================================
describe('checkTenpai', () => {
  it('13枚未満はノーテン（理由あり）', () => {
    const result = checkTenpai(['man1', 'man2', 'man3']);
    expect(result.status).toBe('not-tenpai');
    if (result.status === 'not-tenpai') {
      expect(result.reason).toContain('13枚必要');
    }
  });

  it('明らかなノーテン手はノーテンと判定', () => {
    // バラバラな13枚
    const tiles = [
      'man1', 'man3', 'man5', 'man7', 'man9',
      'pin1', 'pin3', 'pin5',
      'wind1', 'wind2', 'wind3',
      'dragon1', 'dragon2',
    ];
    const result = checkTenpai(tiles);
    expect(result.status).toBe('not-tenpai');
  });

  it('シャンポン待ち（2種類）が正しく判定される', () => {
    // 123m 456m 789m 11p + 22p (シャンポン) → 1p か 2p のどちらかでアガリ
    const tiles = [
      'man1', 'man2', 'man3',
      'man4', 'man5', 'man6',
      'man7', 'man8', 'man9',
      'pin1', 'pin1',
      'pin2', 'pin2',
    ];
    const result = checkTenpai(tiles);
    expect(result.status).toBe('tenpai');
    if (result.status === 'tenpai') {
      expect(result.waits).toContain('pin1');
      expect(result.waits).toContain('pin2');
      expect(result.waits).toHaveLength(2);
    }
  });

  it('七対子聴牌（単騎待ち）が正しく判定される', () => {
    // 11m 22m 33m 44m 55m 66m + 7m (単騎)
    const tiles = [
      'man1', 'man1',
      'man2', 'man2',
      'man3', 'man3',
      'man4', 'man4',
      'man5', 'man5',
      'man6', 'man6',
      'man7',
    ];
    const result = checkTenpai(tiles);
    expect(result.status).toBe('tenpai');
    if (result.status === 'tenpai') {
      expect(result.waits).toContain('man7');
    }
  });

  it('国士無双13面待ちが全て列挙される', () => {
    // 1m9m 1p9p 1s9s 東南西北白發 + 中 (中が1枚で全么九牌揃い→13面)
    const tiles = [
      'man1', 'man9',
      'pin1', 'pin9',
      'sou1', 'sou9',
      'wind1', 'wind2', 'wind3', 'wind4',
      'dragon1', 'dragon2', 'dragon3',
    ];
    const result = checkTenpai(tiles);
    expect(result.status).toBe('tenpai');
    if (result.status === 'tenpai') {
      // 13面待ち
      expect(result.waits.length).toBe(13);
      const expected = [
        'man1', 'man9', 'pin1', 'pin9', 'sou1', 'sou9',
        'wind1', 'wind2', 'wind3', 'wind4',
        'dragon1', 'dragon2', 'dragon3',
      ];
      for (const w of expected) {
        expect(result.waits).toContain(w);
      }
    }
  });

  it('純正九蓮宝燈形（1m×3, 2-8m×1, 9m×3）の多面待ちが全て列挙される', () => {
    // 1112345678999m → 13枚、1-9m の9面待ち
    const tiles = [
      'man1', 'man1', 'man1',
      'man2', 'man3', 'man4', 'man5', 'man6', 'man7', 'man8',
      'man9', 'man9', 'man9',
    ];
    const result = checkTenpai(tiles);
    expect(result.status).toBe('tenpai');
    if (result.status === 'tenpai') {
      expect(result.waits.length).toBe(9);
      for (let i = 1; i <= 9; i++) {
        expect(result.waits).toContain(`man${i}`);
      }
    }
  });

  it('タンキ待ち（単騎）が正しく判定される', () => {
    // 123m 456m 789m 123p + 5m (タンキ待ち: 5m の刻子/雀頭)
    // 実際: 123m 456m 789m 123p = 12枚 + 5m単騎
    const tiles = [
      'man1', 'man2', 'man3',
      'man4', 'man5', 'man6',
      'man7', 'man8', 'man9',
      'pin1', 'pin2', 'pin3',
      'sou5',
    ];
    const result = checkTenpai(tiles);
    expect(result.status).toBe('tenpai');
    if (result.status === 'tenpai') {
      expect(result.waits).toContain('sou5');
    }
  });

  it('カンチャン待ちが正しく判定される', () => {
    // 123m 456m 789m 1p3p + 11p (カンチャン: 2p 待ち)
    const tiles = [
      'man1', 'man2', 'man3',
      'man4', 'man5', 'man6',
      'man7', 'man8', 'man9',
      'pin1', 'pin1',
      'pin2', 'pin4',
    ];
    const result = checkTenpai(tiles);
    expect(result.status).toBe('tenpai');
    if (result.status === 'tenpai') {
      expect(result.waits).toContain('pin3');
    }
  });

  it('国士無双単騎待ち（1種）が正しく判定される', () => {
    // 1m9m 1p9p 1s9s 東南西北白發 + 中中 → 中単騎
    const tiles = [
      'man1', 'man9',
      'pin1', 'pin9',
      'sou1', 'sou9',
      'wind1', 'wind2', 'wind3', 'wind4',
      'dragon1', 'dragon2', 'dragon2',
    ];
    const result = checkTenpai(tiles);
    // dragon2 が2枚あるので么九牌だけで構成されているが、dragon3(中)が欠けているので单騎待ち
    // ただし dragon2 が2枚 → 全种が1枚ずつではないので13面ではない
    expect(result.status).toBe('tenpai');
    if (result.status === 'tenpai') {
      // dragon3 (中) が欠けている → 中待ち
      expect(result.waits).toContain('dragon3');
    }
  });
});
