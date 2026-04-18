/**
 * Sprint 6: 状況役テスト（リーチ・一発・門前清自摸和・嶺上開花・海底・河底）
 */

import { describe, it, expect } from 'vitest';
import { detectYaku } from './yaku';
import { YakuContext } from '@/types/yaku';

// タンヤオ形の14枚アガリ手牌
// 2m3m4m + 5m6m7m + 2p3p4p + 5p6p7p + 6s6s（雀頭）winTile=5p(リャンメン)
// 実際は 5p6p7p の中の5p をアガリ牌とすることで平和リャンメン待ち
// ただし 4m5m6m の面子として分解される場合も... 確実にタンヤオ形を指定
// 単純な役牌なし対々和形で状況役だけをテスト

// 対々和タンヤオ形: 2m2m2m + 4m4m4m + 6p6p6p + 8s8s8s + 3s3s（雀頭）
// winTile = 3s → 雀頭完成（単騎待ち）
const TOITOI_TANYAO_HAND = [
  'man2', 'man2', 'man2',
  'man4', 'man4', 'man4',
  'pin6', 'pin6', 'pin6',
  'sou8', 'sou8', 'sou8',
  'sou3', 'sou3',
];

// 2m3m4m + 2m3m4m + 5p6p7p + 6s7s8s + 5m5m（雀頭）
// winTile = 5m → 単騎（平和なし）
// 確実なリャンメン: 2m3m4m + 5m6m7m + 2p3p4p + 5p6p + 5s5s(雀頭) + winTile=4p（リャンメン4p-7p）
const TANYAO_RYANMEN_HAND = [
  'man2', 'man3', 'man4',
  'man5', 'man6', 'man7',
  'pin2', 'pin3', 'pin4',
  'pin5', 'pin6',
  'sou5', 'sou5',
  'pin4', // アガリ牌 (3p4p5p の4p、または4p5p6p の4p)
];

function ctx(overrides: Partial<YakuContext> = {}): YakuContext {
  return {
    seatWind: 'east',
    roundWind: 'east',
    isOpen: false,
    winTile: 'sou3',
    isTsumo: false,
    ...overrides,
  };
}

describe('Sprint 6: 状況役テスト', () => {

  describe('リーチ', () => {
    it('リーチONで「リーチ」1翻が付与される（ロン）', () => {
      const result = detectYaku(TOITOI_TANYAO_HAND, ctx({ isRiichi: true, winTile: 'sou3' }));
      const yakuNames = result.yaku.map(y => y.name);
      expect(yakuNames).toContain('riichi');
    });

    it('リーチONで翻数が1増える', () => {
      const withoutRiichi = detectYaku(TOITOI_TANYAO_HAND, ctx({ isRiichi: false, winTile: 'sou3' }));
      const withRiichi = detectYaku(TOITOI_TANYAO_HAND, ctx({ isRiichi: true, winTile: 'sou3' }));
      expect(withRiichi.totalHan).toBe(withoutRiichi.totalHan + 1);
    });

    it('リーチOFFのとき「リーチ」は付与されない', () => {
      const result = detectYaku(TOITOI_TANYAO_HAND, ctx({ isRiichi: false, winTile: 'sou3' }));
      const yakuNames = result.yaku.map(y => y.name);
      expect(yakuNames).not.toContain('riichi');
    });
  });

  describe('一発', () => {
    it('リーチON + 一発ONで「一発」1翻が付与される', () => {
      const result = detectYaku(TOITOI_TANYAO_HAND, ctx({ isRiichi: true, isIppatsu: true, winTile: 'sou3' }));
      const yakuNames = result.yaku.map(y => y.name);
      expect(yakuNames).toContain('riichi');
      expect(yakuNames).toContain('ippatsu');
    });

    it('リーチOFF + 一発ONでも「一発」は付与されない', () => {
      const result = detectYaku(TOITOI_TANYAO_HAND, ctx({ isRiichi: false, isIppatsu: true, winTile: 'sou3' }));
      const yakuNames = result.yaku.map(y => y.name);
      expect(yakuNames).not.toContain('ippatsu');
    });
  });

  describe('門前清自摸和', () => {
    it('門前ツモで「門前清自摸和」1翻が付与される', () => {
      const result = detectYaku(TOITOI_TANYAO_HAND, ctx({ isTsumo: true, winTile: 'sou3' }));
      const yakuNames = result.yaku.map(y => y.name);
      expect(yakuNames).toContain('menzen-tsumo');
    });

    it('ロンアガリでは「門前清自摸和」は付与されない', () => {
      const result = detectYaku(TOITOI_TANYAO_HAND, ctx({ isTsumo: false, winTile: 'sou3' }));
      const yakuNames = result.yaku.map(y => y.name);
      expect(yakuNames).not.toContain('menzen-tsumo');
    });

    it('嶺上開花時は「門前清自摸和」は付与されない', () => {
      const result = detectYaku(TOITOI_TANYAO_HAND, ctx({ isTsumo: true, isRinshan: true, winTile: 'sou3' }));
      const yakuNames = result.yaku.map(y => y.name);
      expect(yakuNames).not.toContain('menzen-tsumo');
    });
  });

  describe('嶺上開花', () => {
    it('嶺上開花ONで「嶺上開花」1翻が付与される（ツモ）', () => {
      const result = detectYaku(TOITOI_TANYAO_HAND, ctx({ isTsumo: true, isRinshan: true, winTile: 'sou3' }));
      const yakuNames = result.yaku.map(y => y.name);
      expect(yakuNames).toContain('rinshan');
    });

    it('嶺上開花はロンでは付与されない（ツモ限定）', () => {
      const result = detectYaku(TOITOI_TANYAO_HAND, ctx({ isTsumo: false, isRinshan: true, winTile: 'sou3' }));
      const yakuNames = result.yaku.map(y => y.name);
      expect(yakuNames).not.toContain('rinshan');
    });
  });

  describe('海底撈月・河底撈魚', () => {
    it('海底ON + ツモで「海底撈月」1翻が付与される', () => {
      const result = detectYaku(TOITOI_TANYAO_HAND, ctx({ isTsumo: true, isHaitei: true, winTile: 'sou3' }));
      const yakuNames = result.yaku.map(y => y.name);
      expect(yakuNames).toContain('haitei');
    });

    it('海底ONでもロンでは「海底撈月」は付与されない', () => {
      const result = detectYaku(TOITOI_TANYAO_HAND, ctx({ isTsumo: false, isHaitei: true, winTile: 'sou3' }));
      const yakuNames = result.yaku.map(y => y.name);
      expect(yakuNames).not.toContain('haitei');
    });

    it('河底ON + ロンで「河底撈魚」1翻が付与される', () => {
      const result = detectYaku(TOITOI_TANYAO_HAND, ctx({ isTsumo: false, isHoutei: true, winTile: 'sou3' }));
      const yakuNames = result.yaku.map(y => y.name);
      expect(yakuNames).toContain('houtei');
    });

    it('河底ONでもツモでは「河底撈魚」は付与されない', () => {
      const result = detectYaku(TOITOI_TANYAO_HAND, ctx({ isTsumo: true, isHoutei: true, winTile: 'sou3' }));
      const yakuNames = result.yaku.map(y => y.name);
      expect(yakuNames).not.toContain('houtei');
    });

    it('海底と嶺上開花は同時に付かない', () => {
      const result = detectYaku(TOITOI_TANYAO_HAND, ctx({ isTsumo: true, isHaitei: true, isRinshan: true, winTile: 'sou3' }));
      const yakuNames = result.yaku.map(y => y.name);
      // 嶺上開花はあるが海底はない
      expect(yakuNames).toContain('rinshan');
      expect(yakuNames).not.toContain('haitei');
    });
  });

  describe('状況役の複合', () => {
    it('リーチ + 一発 + ツモ = 3つの状況役が同時に付く', () => {
      const result = detectYaku(TOITOI_TANYAO_HAND, ctx({
        isTsumo: true,
        isRiichi: true,
        isIppatsu: true,
        winTile: 'sou3',
      }));
      const yakuNames = result.yaku.map(y => y.name);
      expect(yakuNames).toContain('riichi');
      expect(yakuNames).toContain('ippatsu');
      expect(yakuNames).toContain('menzen-tsumo');
    });

    it('リーチ翻数加算: リーチなし翻数 + 1 = リーチあり翻数', () => {
      const withoutRiichi = detectYaku(TOITOI_TANYAO_HAND, ctx({ isTsumo: true, winTile: 'sou3' }));
      const withRiichi = detectYaku(TOITOI_TANYAO_HAND, ctx({ isTsumo: true, isRiichi: true, winTile: 'sou3' }));
      expect(withRiichi.totalHan).toBe(withoutRiichi.totalHan + 1);
    });

    it('リーチ + 一発で翻数 +2', () => {
      const base = detectYaku(TOITOI_TANYAO_HAND, ctx({ isTsumo: false, winTile: 'sou3' }));
      const withRiichiIppatsu = detectYaku(TOITOI_TANYAO_HAND, ctx({
        isTsumo: false,
        isRiichi: true,
        isIppatsu: true,
        winTile: 'sou3',
      }));
      expect(withRiichiIppatsu.totalHan).toBe(base.totalHan + 2);
    });
  });

  describe('七対子での状況役', () => {
    // 七対子形: 1m1m + 2p2p + 3s3s + 4m4m + 5p5p + 6s6s + 7m(単騎待ち)
    const CHIITOI_HAND = [
      'man1', 'man1',
      'pin2', 'pin2',
      'sou3', 'sou3',
      'man4', 'man4',
      'pin5', 'pin5',
      'sou6', 'sou6',
      'man7', 'man7',
    ];

    it('七対子でもリーチが付与される', () => {
      const result = detectYaku(CHIITOI_HAND, {
        seatWind: 'east',
        roundWind: 'east',
        isOpen: false,
        winTile: 'man7',
        isTsumo: false,
        isRiichi: true,
      });
      const yakuNames = result.yaku.map(y => y.name);
      expect(yakuNames).toContain('chiitoitsu');
      expect(yakuNames).toContain('riichi');
    });

    it('七対子でもツモが付与される', () => {
      const result = detectYaku(CHIITOI_HAND, {
        seatWind: 'east',
        roundWind: 'east',
        isOpen: false,
        winTile: 'man7',
        isTsumo: true,
      });
      const yakuNames = result.yaku.map(y => y.name);
      expect(yakuNames).toContain('chiitoitsu');
      expect(yakuNames).toContain('menzen-tsumo');
    });
  });
});
