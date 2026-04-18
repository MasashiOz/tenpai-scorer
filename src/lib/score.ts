/**
 * 点数算出エンジン（Sprint 5）
 *
 * 翻数と符数から最終点数を計算する。
 * - 満貫未満: 基本点 = 符 × 2^(翻+2) を 10 の位に切り上げ × 支払い人数
 * - 満貫以上: 満貫/跳満/倍満/三倍満/数え役満の固定点数
 */

import { FuResult } from './fu';
import { YakumanResult } from '@/types/yaku';

// ============================================================
// 型定義
// ============================================================

export type ScoreLevel =
  | 'normal'      // 満貫未満
  | 'mangan'      // 満貫 (5翻 or 4翻70符以上 or 3翻110符以上)
  | 'haneman'     // 跳満
  | 'baiman'      // 倍満
  | 'sanbaiman'   // 三倍満
  | 'yakuman'     // 数え役満（13翻以上）
  | 'yakuman1'    // 役満（1倍）
  | 'yakuman2'    // ダブル役満
  | 'yakuman3'    // トリプル役満
  | 'yakuman4';   // 四倍役満（理論上）

export interface ScoreResult {
  /** 点数の合計 */
  total: number;
  /** 支払い内訳（ロン: 1要素, ツモ: 2要素（子と親の支払い）） */
  payments: { label: string; amount: number }[];
  /** 点数レベル */
  level: ScoreLevel;
  /** 表示用テキスト（例: "3翻40符 3900点"） */
  displayText: string;
  /** 翻数 */
  han: number;
  /** 符数 */
  fu: number;
}

// ============================================================
// 点数テーブル
// ============================================================

/** 満貫・跳満・倍満・三倍満・数え役満の点数 */
const FIXED_SCORES: Record<ScoreLevel, { dealer: number; nonDealer: number; nonDealerTsumo: { dealer: number; nonDealer: number } }> = {
  normal: { dealer: 0, nonDealer: 0, nonDealerTsumo: { dealer: 0, nonDealer: 0 } }, // unused
  mangan: {
    dealer: 12000,
    nonDealer: 8000,
    nonDealerTsumo: { dealer: 4000, nonDealer: 2000 },
  },
  haneman: {
    dealer: 18000,
    nonDealer: 12000,
    nonDealerTsumo: { dealer: 6000, nonDealer: 3000 },
  },
  baiman: {
    dealer: 24000,
    nonDealer: 16000,
    nonDealerTsumo: { dealer: 8000, nonDealer: 4000 },
  },
  sanbaiman: {
    dealer: 36000,
    nonDealer: 24000,
    nonDealerTsumo: { dealer: 12000, nonDealer: 6000 },
  },
  yakuman: {
    dealer: 48000,
    nonDealer: 32000,
    nonDealerTsumo: { dealer: 16000, nonDealer: 8000 },
  },
  // Sprint 8: 役満系（役満1倍 = 数え役満と同額）
  yakuman1: {
    dealer: 48000,
    nonDealer: 32000,
    nonDealerTsumo: { dealer: 16000, nonDealer: 8000 },
  },
  yakuman2: {
    dealer: 96000,
    nonDealer: 64000,
    nonDealerTsumo: { dealer: 32000, nonDealer: 16000 },
  },
  yakuman3: {
    dealer: 144000,
    nonDealer: 96000,
    nonDealerTsumo: { dealer: 48000, nonDealer: 24000 },
  },
  yakuman4: {
    dealer: 192000,
    nonDealer: 128000,
    nonDealerTsumo: { dealer: 64000, nonDealer: 32000 },
  },
};

// ============================================================
// 点数レベル判定
// ============================================================

function determineLevel(han: number, fu: number): ScoreLevel {
  // 数え役満
  if (han >= 13) return 'yakuman';
  // 三倍満
  if (han >= 11) return 'sanbaiman';
  // 倍満
  if (han >= 8) return 'baiman';
  // 跳満
  if (han >= 6) return 'haneman';
  // 満貫
  if (han >= 5) return 'mangan';
  // 4翻70符以上 or 3翻110符以上（切り上げ満貫）
  if (han === 4 && fu >= 70) return 'mangan';
  if (han === 3 && fu >= 110) return 'mangan';
  return 'normal';
}

// ============================================================
// 基本点の計算
// ============================================================

/**
 * 基本点 = 符 × 2^(翻+2)
 * ※ ロン親: 基本点 × 6 (10点切り上げ)
 * ※ ロン子: 基本点 × 4 (10点切り上げ)
 * ※ ツモ親: 子全員 基本点 × 2 (100点切り上げ)
 * ※ ツモ子: 親 基本点 × 2 (100点切り上げ), 子 基本点 × 1 (100点切り上げ)
 */
function calcBasePoints(fu: number, han: number): number {
  return fu * Math.pow(2, han + 2);
}

function roundUp10(n: number): number {
  return Math.ceil(n / 10) * 10;
}

function roundUp100(n: number): number {
  return Math.ceil(n / 100) * 100;
}

// ============================================================
// 点数算出メイン
// ============================================================

// ============================================================
// 本場ボーナス計算
// ============================================================

/**
 * 本場ボーナスを payments に加算したコピーを返す。
 * - ロン: 放銃者が 300×honba 点追加
 * - ツモ: 各支払い者が 100×honba 点追加
 */
function applyHonba(
  result: ScoreResult,
  honba: number,
  isTsumo: boolean,
): ScoreResult {
  if (honba === 0) return result;
  const bonus = honba * 100; // 1人あたりの本場ボーナス（ツモ）or 放銃者合計 / 3
  const bonusTotal = honba * 300; // 合計本場ボーナス（常に300×honba）
  const honbaLabel = `${honba}本場(+${bonusTotal})`;

  const newPayments = isTsumo
    ? result.payments.map((p) => ({ ...p, amount: p.amount + bonus }))
    : result.payments.map((p) => ({ ...p, amount: p.amount + bonusTotal }));

  const newTotal = result.total + bonusTotal;
  const newDisplayText = `${result.displayText} [${honbaLabel}]`;

  return { ...result, total: newTotal, payments: newPayments, displayText: newDisplayText };
}

/**
 * 点数算出のメイン関数
 *
 * @param han         翻数
 * @param fuResult    符計算結果
 * @param isDealer    親かどうか
 * @param isTsumo     ツモアガリかどうか
 * @param honba       本場数（デフォルト0）
 * @param playerCount プレイヤー人数（4人麻雀=4, 三人麻雀=3, デフォルト4）
 * @returns ScoreResult
 */
export function calcScore(
  han: number,
  fuResult: FuResult,
  isDealer: boolean,
  isTsumo: boolean,
  honba: number = 0,
  playerCount: number = 4,
): ScoreResult {
  const fu = fuResult.fu;
  const level = determineLevel(han, fu);
  // ツモ時: 親ツモで支払う子の人数、子ツモで支払う他子の人数
  const numOtherNonDealers = playerCount - 2; // 4P=2, 3P=1

  if (level !== 'normal') {
    // 固定点数
    const fixedData = FIXED_SCORES[level];
    const levelLabels: Record<ScoreLevel, string> = {
      normal: '',
      mangan: '満貫',
      haneman: '跳満',
      baiman: '倍満',
      sanbaiman: '三倍満',
      yakuman: '数え役満',
      yakuman1: '役満',
      yakuman2: 'ダブル役満',
      yakuman3: 'トリプル役満',
      yakuman4: '4倍役満',
    };
    const levelLabel = levelLabels[level];

    if (isTsumo) {
      if (isDealer) {
        // 親ツモ: 子全員が同額支払い（1人あたりの支払い額は4人基準固定）
        const payEach = fixedData.dealer / 3;
        const numChildren = playerCount - 1;
        const total = payEach * numChildren;
        const base: ScoreResult = {
          total,
          payments: [{ label: '子 各', amount: payEach }],
          level,
          displayText: `${levelLabel} ${total}点（${payEach}点オール）`,
          han,
          fu,
        };
        return applyHonba(base, honba, true);
      } else {
        // 子ツモ: 親と子で支払い額が異なる
        const dealerPays = fixedData.nonDealerTsumo.dealer;
        const nonDealerPays = fixedData.nonDealerTsumo.nonDealer;
        const total = dealerPays + nonDealerPays * numOtherNonDealers;
        const base: ScoreResult = {
          total,
          payments: [
            { label: '親', amount: dealerPays },
            { label: '子 各', amount: nonDealerPays },
          ],
          level,
          displayText: `${levelLabel} ${total}点（子${nonDealerPays}点 親${dealerPays}点）`,
          han,
          fu,
        };
        return applyHonba(base, honba, true);
      }
    } else {
      // ロン
      const total = isDealer ? fixedData.dealer : fixedData.nonDealer;
      const base: ScoreResult = {
        total,
        payments: [{ label: '放銃', amount: total }],
        level,
        displayText: `${levelLabel} ${total}点`,
        han,
        fu,
      };
      return applyHonba(base, honba, false);
    }
  }

  // 通常（満貫未満）
  const basePoints = calcBasePoints(fu, han);

  if (isTsumo) {
    if (isDealer) {
      // 親ツモ: 子全員が 基本点×2 (100点切り上げ)
      const payEach = roundUp100(basePoints * 2);
      const numChildren = playerCount - 1;
      const total = payEach * numChildren;
      const base: ScoreResult = {
        total,
        payments: [{ label: '子 各', amount: payEach }],
        level,
        displayText: `${han}翻${fu}符 ${total}点（${payEach}点オール）`,
        han,
        fu,
      };
      return applyHonba(base, honba, true);
    } else {
      // 子ツモ: 親は 基本点×2 (100点切り上げ), 子は 基本点×1 (100点切り上げ)
      const dealerPays = roundUp100(basePoints * 2);
      const nonDealerPays = roundUp100(basePoints);
      const total = dealerPays + nonDealerPays * numOtherNonDealers;
      const base: ScoreResult = {
        total,
        payments: [
          { label: '親', amount: dealerPays },
          { label: '子 各', amount: nonDealerPays },
        ],
        level,
        displayText: `${han}翻${fu}符 ${total}点（子${nonDealerPays}点 親${dealerPays}点）`,
        han,
        fu,
      };
      return applyHonba(base, honba, true);
    }
  } else {
    // ロン
    if (isDealer) {
      // 親ロン: 基本点×6 (100点切り上げ)
      const total = roundUp100(basePoints * 6);
      const base: ScoreResult = {
        total,
        payments: [{ label: '放銃', amount: total }],
        level,
        displayText: `${han}翻${fu}符 ${total}点`,
        han,
        fu,
      };
      return applyHonba(base, honba, false);
    } else {
      // 子ロン: 基本点×4 (100点切り上げ)
      const total = roundUp100(basePoints * 4);
      const base: ScoreResult = {
        total,
        payments: [{ label: '放銃', amount: total }],
        level,
        displayText: `${han}翻${fu}符 ${total}点`,
        han,
        fu,
      };
      return applyHonba(base, honba, false);
    }
  }
}

// ============================================================
// Sprint 8: 役満点数計算
// ============================================================

/**
 * 役満点数を計算する。
 * @param yakumanResult 役満判定結果
 * @param isDealer      親かどうか
 * @param isTsumo       ツモアガリかどうか
 * @param honba         本場数（デフォルト0）
 * @param playerCount   プレイヤー人数（4人麻雀=4, 三人麻雀=3, デフォルト4）
 * @returns ScoreResult
 */
export function calcYakumanScore(
  yakumanResult: YakumanResult,
  isDealer: boolean,
  isTsumo: boolean,
  honba: number = 0,
  playerCount: number = 4,
): ScoreResult {
  const multiplier = yakumanResult.totalMultiplier;

  // レベルを倍率から決定
  let level: ScoreLevel;
  if (multiplier >= 4) level = 'yakuman4';
  else if (multiplier === 3) level = 'yakuman3';
  else if (multiplier === 2) level = 'yakuman2';
  else level = 'yakuman1';

  const fixedData = FIXED_SCORES[level];

  const labelParts = yakumanResult.entries.map((e) => e.label).join('・');
  const multiplierLabel = multiplier >= 2 ? `${multiplier}倍役満` : '役満';
  const numOtherNonDealers = playerCount - 2;

  let base: ScoreResult;
  if (isTsumo) {
    if (isDealer) {
      const payEach = fixedData.dealer / 3;
      const numChildren = playerCount - 1;
      const total = payEach * numChildren;
      base = {
        total,
        payments: [{ label: '子 各', amount: payEach }],
        level,
        displayText: `${multiplierLabel} ${total}点（${payEach}点オール）`,
        han: 13 * multiplier, // 役満翻数は表示用に13×倍率
        fu: 0,
      };
    } else {
      const dealerPays = fixedData.nonDealerTsumo.dealer;
      const nonDealerPays = fixedData.nonDealerTsumo.nonDealer;
      const total = dealerPays + nonDealerPays * numOtherNonDealers;
      base = {
        total,
        payments: [
          { label: '親', amount: dealerPays },
          { label: '子 各', amount: nonDealerPays },
        ],
        level,
        displayText: `${multiplierLabel} ${total}点（子${nonDealerPays}点 親${dealerPays}点）`,
        han: 13 * multiplier,
        fu: 0,
      };
    }
  } else {
    const total = isDealer ? fixedData.dealer : fixedData.nonDealer;
    base = {
      total,
      payments: [{ label: '放銃', amount: total }],
      level,
      displayText: `${multiplierLabel} ${total}点`,
      han: 13 * multiplier,
      fu: 0,
    };
  }

  void labelParts; // 将来の表示拡張用
  return applyHonba(base, honba, isTsumo);
}
