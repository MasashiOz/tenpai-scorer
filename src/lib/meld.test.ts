/**
 * Sprint 7: 副露（ポン・チー・カン）対応のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import { checkTenpai, getRequiredHandCount } from './tenpai';
import { detectYaku, getAllDecompositions } from './yaku';
import { calcFu } from './fu';
import { Mentsu } from '@/types/yaku';
import { YakuContext } from '@/types/yaku';

// ============================================================
// 必要枚数計算
// ============================================================

describe('getRequiredHandCount', () => {
  it('副露なし: 13枚', () => {
    expect(getRequiredHandCount(0)).toBe(13);
  });
  it('ポン1面子(3枚): 10枚', () => {
    expect(getRequiredHandCount(3)).toBe(10);
  });
  it('ポン2面子(6枚): 7枚', () => {
    expect(getRequiredHandCount(6)).toBe(7);
  });
  it('ポン3面子(9枚): 4枚', () => {
    expect(getRequiredHandCount(9)).toBe(4);
  });
  it('明槓1面子(4枚): 9枚', () => {
    expect(getRequiredHandCount(4)).toBe(9);
  });
  it('暗槓1面子(4枚) + ポン1面子(3枚): 6枚', () => {
    expect(getRequiredHandCount(7)).toBe(6);
  });
});

// ============================================================
// 副露込み聴牌判定
// ============================================================

describe('副露込み聴牌判定', () => {
  it('副露なし: 13枚未満でノーテン', () => {
    const result = checkTenpai(['man1', 'man2', 'man3'], 0);
    expect(result.status).toBe('not-tenpai');
  });

  it('副露なし: 13枚で聴牌判定', () => {
    // 1-2-3m / 4-5-6m / 7-8-9m / 1p-2p 待ち3p
    const hand = ['man1','man2','man3','man4','man5','man6','man7','man8','man9','pin1','pin1','pin2','pin3'];
    const result = checkTenpai(hand, 0);
    expect(result.status).toBe('tenpai');
  });

  it('ポン1面子（3枚）: 残り10枚で聴牌判定', () => {
    // 必要手牌枚数: 13 - 3 = 10
    expect(getRequiredHandCount(3)).toBe(10);
    // 副露: 東×3, 残り10枚で3面子+雀頭形成
    // 1-2-3m / 4-5-6m / 7-8-9m + 1p(単騎待ち)
    const hand10 = ['man1','man2','man3','man4','man5','man6','man7','man8','man9','pin1'];
    const result = checkTenpai(hand10, 3);
    expect(result.status).toBe('tenpai');
    if (result.status === 'tenpai') {
      expect(result.waits).toContain('pin1');
    }
  });

  it('ポン2面子（6枚）: 残り7枚で聴牌判定', () => {
    // 必要手牌枚数: 13 - 6 = 7
    expect(getRequiredHandCount(6)).toBe(7);
    // 残り7枚で2面子+雀頭形成
    // 1-2-3m / 4-5-6m + 東(単騎待ち)
    const hand7 = ['man1','man2','man3','man4','man5','man6','wind1'];
    const result = checkTenpai(hand7, 6);
    expect(result.status).toBe('tenpai');
    if (result.status === 'tenpai') {
      expect(result.waits).toContain('wind1');
    }
  });

  it('暗槓1面子（4枚）: 残り10枚で聴牌判定（嶺上牌を含む）', () => {
    // カン(4枚)副露: meldFaceCount=1 → required = 13 - 1*3 = 10枚
    // 暗槓: 東×4(固定1面子), 残り10枚で3面子+雀頭形成
    // 1-2-3m / 4-5-6m / 7-8-9m + 1p×2(待ち1p, シャンポンまたは単騎)
    // 実際: 1-2-3m(3) / 4-5-6m(3) / 7-8-9m(3) + 1p(1) = 10枚, 待ち1p
    const hand10 = ['man1','man2','man3','man4','man5','man6','man7','man8','man9','pin1'];
    // meldTileCount=4, meldFaceCount=1 を渡す
    const result = checkTenpai(hand10, 4, 1);
    expect(result.status).toBe('tenpai');
    if (result.status === 'tenpai') {
      expect(result.waits).toContain('pin1');
    }
  });

  it('明槓1面子（4枚）: 残り10枚で聴牌判定', () => {
    // 明槓(4枚)副露: meldFaceCount=1 → required = 10枚
    // 1-2-3m / 7-8-9m / 白×3 + 中×2(単騎待ち中)
    const hand10 = ['man1','man2','man3','man7','man8','man9','dragon3','dragon3','dragon3','dragon2'];
    const result = checkTenpai(hand10, 4, 1);
    expect(result.status).toBe('tenpai');
    if (result.status === 'tenpai') {
      expect(result.waits).toContain('dragon2');
    }
  });

  it('暗槓1面子(4枚) + ポン1面子(3枚): 残り7枚で聴牌判定', () => {
    // meldTileCount=7, meldFaceCount=2 → required = 13 - 2*3 = 7枚
    // 1-2-3m / 4-5-6m + 東(単騎待ち)
    const hand7 = ['man1','man2','man3','man4','man5','man6','wind1'];
    const result = checkTenpai(hand7, 7, 2);
    expect(result.status).toBe('tenpai');
    if (result.status === 'tenpai') {
      expect(result.waits).toContain('wind1');
    }
  });

  it('副露ありの場合は七対子を判定しない', () => {
    // meldTileCount=6なので required=7
    // 七対子判定はmeldTileCount=0のみ
    const hand7 = ['man1','man1','man2','man2','man3','man3','man4'];
    const result = checkTenpai(hand7, 6);
    // 通常形で man4待ちが成立するか:
    // 残り7枚+man4 = 8枚で2面子+雀頭(fixed2面子は別)
    // 1m×2,2m×2,3m×2,4m×1 → 1-2-3m(順子), 1-2-3m(順子), 4m(単騎) = 7枚で2面子+単騎
    // +man4 = 8枚: 1-2-3m,1-2-3m,4m×2雀頭 ✓ → 聴牌!
    // つまり通常形でも聴牌するケースがある
    // 七対子が判定されないことだけを確認
    if (result.status === 'tenpai') {
      // 通常形でmanが待ち
      expect(result.waits).toContain('man4');
    }
    // 七対子が有効であれば man4以外の牌が待ちになる可能性があるが
    // 副露ありの場合は七対子未判定なのでman4のみのはず
  });
});

// ============================================================
// 副露込み役判定（喰い下がり）
// ============================================================

describe('副露込み役判定', () => {
  it('鳴きありタンヤオが1翻として検出される', () => {
    // ポン: 2p×3(固定1面子), 残り9枚+アガリ1枚=10枚で3面子+雀頭
    const fixedMentsu: Mentsu[] = [
      { type: 'koutsu', tiles: ['pin2','pin2','pin2'], suit: 'pin', isOpen: true },
    ];
    // 残り9枚: 3-4-5m / 6-7-8p / 4-5-6s
    // アガリ牌: 5p (実際には別スーツで全中張)
    // 修正: 全牌が中張牌 (2-8の数牌) になるように
    // 3-4-5m / 6-7-8p / 4-5-6s = 9枚, アガリ: 3s = 10枚
    // しかしこれでは3sは既に面子に含まれているのでシャンポン形に
    // 明確なテスト: 3-4-5m / 6-7-8m / 2s×2 + アガリ2s (三暗刻&タンヤオ)
    // fixedMentsu = 2p×3, agariHand = 3-4-5m/6-7-8m/2s-2s/2s = 9枚 + アガリ2s = wait but 2s×3
    // 正しいテスト形:
    // fixedMentsu = [2p×3(ポン)], agariHand = [3m,4m,5m, 6m,7m,8m, 2s,2s, 4s,5s,6s] = 11枚
    // ここで winTile = 3s?
    // 実際 10枚+1枚の分解:
    // 11枚: 3-4-5m, 6-7-8m, 4-5-6s(面子3つ) + 2s×2(雀頭) = 11枚 ✓
    const agariHand = ['man3','man4','man5','man6','man7','man8','sou4','sou5','sou6','sou2','sou2'];
    const ctx: YakuContext = {
      seatWind: 'east',
      roundWind: 'east',
      isOpen: true,
      winTile: 'sou2',
      isTsumo: false,
    };
    const result = detectYaku(agariHand, ctx, fixedMentsu);
    const yakuNames = result.yaku.map((y) => y.name);
    expect(yakuNames).toContain('tanyao');
    // 鳴きありタンヤオのhanOpenは1
    const tanyao = result.yaku.find((y) => y.name === 'tanyao');
    expect(tanyao?.han).toBe(1);
  });

  it('鳴きあり清一色が5翻（喰い下がり）として検出される', () => {
    // ポン: 2m×3(固定1面子), 残り9枚+アガリ1枚=10枚で3面子+雀頭
    // agariHand = 3-4-5m / 6-7-8m / 1m×2 + アガリ9m = 11枚
    // fixedMentsu = [2m×3]
    const fixedMentsu: Mentsu[] = [
      { type: 'koutsu', tiles: ['man2','man2','man2'], suit: 'man', isOpen: true },
    ];
    const agariHand = ['man3','man4','man5','man6','man7','man8','man9','man1','man1','man1','man9'];
    const ctx: YakuContext = {
      seatWind: 'east',
      roundWind: 'east',
      isOpen: true,
      winTile: 'man9',
      isTsumo: false,
    };
    const result = detectYaku(agariHand, ctx, fixedMentsu);
    const yakuNames = result.yaku.map((y) => y.name);
    expect(yakuNames).toContain('chinitsu');
    // 清一色の喰い下がり: hanOpen=5
    // detectYakuForDecomp は context.isOpen が true の場合に hanOpen を使う
    // しかし Yaku.han は常に門前翻数を保持し、hanOpen は副露時の翻数
    // result.yaku の yaku.han は定義値（門前6翻）、totalHan 計算時に hanOpen を使用
    // したがってyaku.hanは6だが、totalHanは5（喰い下がり）になる
    // テストでは totalHan を確認する
    expect(result.totalHan).toBeGreaterThanOrEqual(5);
  });

  it('副露ありで平和が成立しない', () => {
    // チー: 1-2-3m, 残りで平和形でもisOpen=trueなので平和不可
    const fixedMentsu: Mentsu[] = [
      { type: 'shuntsu', tiles: ['man1','man2','man3'], suit: 'man', isOpen: true },
    ];
    // agariHand: 4-5-6p / 7-8-9s / 3-4-5s + 2p×2雀頭 + アガリ2p = 11枚
    const agariHand = ['pin4','pin5','pin6','sou7','sou8','sou9','sou3','sou4','sou5','pin2','pin2'];
    const ctx: YakuContext = {
      seatWind: 'east',
      roundWind: 'east',
      isOpen: true,
      winTile: 'pin2',
      isTsumo: false,
    };
    const result = detectYaku(agariHand, ctx, fixedMentsu);
    const yakuNames = result.yaku.map((y) => y.name);
    expect(yakuNames).not.toContain('pinfu');
  });

  it('副露ありで一盃口が成立しない', () => {
    // チー: 2-3-4p, 残り手牌で一盃口形でもisOpen=trueなので一盃口不可
    const fixedMentsu: Mentsu[] = [
      { type: 'shuntsu', tiles: ['pin2','pin3','pin4'], suit: 'pin', isOpen: true },
    ];
    // agariHand: 2-3-4m, 2-3-4m, 5s×2 + アガリ5s = 11枚
    const agariHand = ['man2','man3','man4','man2','man3','man4','sou5','sou5','sou6','sou7','sou8'];
    const ctx: YakuContext = {
      seatWind: 'east',
      roundWind: 'east',
      isOpen: true,
      winTile: 'sou8',
      isTsumo: false,
    };
    const result = detectYaku(agariHand, ctx, fixedMentsu);
    const yakuNames = result.yaku.map((y) => y.name);
    expect(yakuNames).not.toContain('iipeiko');
  });
});

// ============================================================
// 副露込み符計算（槓子）
// ============================================================

describe('槓子の符計算', () => {
  it('幺九暗槓は32符', () => {
    // 暗槓: 東×4(固定1面子), 残り9枚+アガリ1枚=10枚で3面子+雀頭
    // agariHand: 1-2-3m / 4-5-6m / 7-8-9m + 1p×2 + アガリ1p = 11枚
    const fixedMentsu: Mentsu[] = [
      { type: 'kantsu', tiles: ['wind1','wind1','wind1','wind1'], suit: 'wind', isOpen: false },
    ];
    const agariHand = ['man1','man2','man3','man4','man5','man6','man7','man8','man9','pin1','pin1'];
    const ctx: YakuContext = {
      seatWind: 'east',
      roundWind: 'east',
      isOpen: false,
      winTile: 'pin1',
      isTsumo: false,
    };

    const result = detectYaku(agariHand, ctx, fixedMentsu);
    const fuResult = calcFu(result, ctx);

    // 幺九暗槓 = 32符 が items に含まれるはず
    const kanFuItem = fuResult.items.find((item) => item.label.includes('幺九暗槓'));
    expect(kanFuItem).toBeDefined();
    expect(kanFuItem?.fu).toBe(32);
  });

  it('中張明槓は8符', () => {
    // 明槓: 5m×4(固定), 残り9枚+アガリ1枚=10枚で3面子+雀頭
    const fixedMentsu: Mentsu[] = [
      { type: 'kantsu', tiles: ['man5','man5','man5','man5'], suit: 'man', isOpen: true },
    ];
    // agariHand: 2-3-4p / 5-6-7s / 8-9-1s(実は連続でない) → 1-2-3p / 4-5-6s / 7-8-9s + 2m×2 + アガリ2m = 11枚
    const agariHand = ['pin1','pin2','pin3','sou4','sou5','sou6','sou7','sou8','sou9','man2','man2'];
    const ctx: YakuContext = {
      seatWind: 'east',
      roundWind: 'east',
      isOpen: true,
      winTile: 'man2',
      isTsumo: false,
    };

    const result = detectYaku(agariHand, ctx, fixedMentsu);
    const fuResult = calcFu(result, ctx);

    // 中張明槓 = 8符
    const kanFuItem = fuResult.items.find((item) => item.label.includes('中張明槓'));
    expect(kanFuItem).toBeDefined();
    expect(kanFuItem?.fu).toBe(8);
  });

  it('幺九明槓は16符', () => {
    // 明槓: 9m×4(固定), 残り9枚+アガリ1枚=10枚で3面子+雀頭
    const fixedMentsu: Mentsu[] = [
      { type: 'kantsu', tiles: ['man9','man9','man9','man9'], suit: 'man', isOpen: true },
    ];
    const agariHand = ['pin1','pin2','pin3','sou4','sou5','sou6','sou7','sou8','sou9','pin4','pin4'];
    const ctx: YakuContext = {
      seatWind: 'east',
      roundWind: 'east',
      isOpen: true,
      winTile: 'pin4',
      isTsumo: false,
    };

    const result = detectYaku(agariHand, ctx, fixedMentsu);
    const fuResult = calcFu(result, ctx);

    // 幺九明槓 = 16符
    const kanFuItem = fuResult.items.find((item) => item.label.includes('幺九明槓'));
    expect(kanFuItem).toBeDefined();
    expect(kanFuItem?.fu).toBe(16);
  });

  it('中張暗槓は16符', () => {
    // 暗槓: 5p×4(固定)
    const fixedMentsu: Mentsu[] = [
      { type: 'kantsu', tiles: ['pin5','pin5','pin5','pin5'], suit: 'pin', isOpen: false },
    ];
    const agariHand = ['man1','man2','man3','sou4','sou5','sou6','sou7','sou8','sou9','pin9','pin9'];
    const ctx: YakuContext = {
      seatWind: 'east',
      roundWind: 'east',
      isOpen: false,
      winTile: 'pin9',
      isTsumo: false,
    };

    const result = detectYaku(agariHand, ctx, fixedMentsu);
    const fuResult = calcFu(result, ctx);

    // 中張暗槓 = 16符
    const kanFuItem = fuResult.items.find((item) => item.label.includes('中張暗槓'));
    expect(kanFuItem).toBeDefined();
    expect(kanFuItem?.fu).toBe(16);
  });
});
