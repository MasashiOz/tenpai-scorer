/**
 * 符計算エンジン（Sprint 5）
 *
 * 符の内訳:
 * - 副底（フータイ）: 20符（全ての手牌）
 * - 面子符:
 *   - 順子: 0符
 *   - 刻子:
 *     - 中張明刻: 2符, 中張暗刻: 4符
 *     - 幺九明刻: 4符, 幺九暗刻: 8符
 *   - 槓子:
 *     - 中張明槓: 8符, 中張暗槓: 16符
 *     - 幺九明槓: 16符, 幺九暗槓: 32符
 * - 雀頭符:
 *   - 役牌雀頭: 2符, 非役牌雀頭: 0符
 * - 待ち形符:
 *   - 辺張・嵌張・単騎待ち: 2符
 *   - 両面・双碰: 0符
 * - ツモ符: 2符（平和ツモ以外）
 * - 門前ロン符: 10符（門前のみ）
 *
 * 特殊ケース:
 * - 七対子: 25符固定
 * - 平和ツモ: 20符固定
 * - 平和ロン: 30符固定
 */

import { HandDecomposition, Mentsu, Jantou, YakuResult } from '@/types/yaku';
import { YakuContext } from '@/types/yaku';
import { SeatWind, RoundWind } from '@/types/situation';
import { tileIdToKey } from './tenpai';

// ============================================================
// 型定義
// ============================================================

/** 符の内訳1項目 */
export interface FuItem {
  label: string;
  fu: number;
}

/** 符計算結果 */
export interface FuResult {
  items: FuItem[];   // 符内訳
  rawFu: number;     // 端数切り上げ前の符
  fu: number;        // 10符単位に切り上げた最終符
}

// ============================================================
// ユーティリティ
// ============================================================

/** 幺九牌か */
function isYaochu(tileId: string): boolean {
  const key = tileIdToKey(tileId);
  if (key >= 1 && key <= 9) return key === 1 || key === 9;
  if (key >= 11 && key <= 19) return key === 11 || key === 19;
  if (key >= 21 && key <= 29) return key === 21 || key === 29;
  return key >= 31; // 字牌
}

/** 役牌（場風/自風/三元牌）か */
function isYakuhai(tileId: string, seatWind: SeatWind, roundWind: RoundWind): boolean {
  const windMap: Record<SeatWind | RoundWind, string> = {
    east: 'wind1',
    south: 'wind2',
    west: 'wind3',
    north: 'wind4',
  };
  return (
    tileId === windMap[seatWind] ||
    tileId === windMap[roundWind] ||
    tileId === 'dragon1' ||
    tileId === 'dragon2' ||
    tileId === 'dragon3'
  );
}

/** 牌の番号取得 */
function getNumber(tileId: string): number {
  const m = tileId.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

// ============================================================
// 待ち形判定
// ============================================================

type WaitType = 'ryanmen' | 'penchan' | 'kanchan' | 'shanpon' | 'tanki';

/**
 * 待ち形を判定する。
 * - 七対子・国士無双は呼び出し元で別処理するため、ここでは通常形のみ対応。
 */
function detectWaitType(
  decomp: HandDecomposition,
  winTile: string,
): WaitType {
  // アガリ牌が雀頭に使われているか（単騎）
  if (decomp.jantou.tile === winTile) {
    // 雀頭が単騎かどうかを確認: アガリ牌を含む面子がない場合のみ単騎
    const inMentsu = decomp.mentsuList.some((m) => m.tiles.includes(winTile));
    if (!inMentsu) return 'tanki';
  }

  // アガリ牌が含まれる面子を探す
  for (const mentsu of decomp.mentsuList) {
    if (!mentsu.tiles.includes(winTile)) continue;

    if (mentsu.type === 'koutsu' || mentsu.type === 'kantsu') {
      // 刻子はシャンポン待ちの可能性あり
      // シャンポン: 2つの対子から1つをアガリ牌で完成させた形
      // → 面子の中に刻子があり、かつ雀頭と同種の牌でない場合
      return 'shanpon';
    }

    if (mentsu.type === 'shuntsu') {
      const nums = mentsu.tiles.map(getNumber).sort((a, b) => a - b);
      const winNum = getNumber(winTile);
      const minNum = nums[0];
      const maxNum = nums[2];

      // カンチャン（中間牌待ち）
      if (winNum !== minNum && winNum !== maxNum) return 'kanchan';

      // ペンチャン（1-2-3の3待ち or 7-8-9の7待ち）
      if (minNum === 1 && winNum === 3) return 'penchan';
      if (maxNum === 9 && winNum === 7) return 'penchan';

      // 両面
      return 'ryanmen';
    }
  }

  // フォールバック（通常は到達しない）
  return 'tanki';
}

// ============================================================
// 面子符計算
// ============================================================

function calcMentsuFu(mentsu: Mentsu, winTile: string, isTsumo: boolean): { fu: number; label: string } {
  const tile = mentsu.tiles[0];
  const yaochu = isYaochu(tile);
  const isOpen = mentsu.isOpen ?? false;
  const isWinMentsu = mentsu.tiles.includes(winTile) && mentsu.type === 'koutsu';
  // ロン時に和了牌を含む刻子は明刻扱い
  const effectiveIsOpen = isOpen || (!isTsumo && isWinMentsu);

  let fu = 0;
  let typeLabel = '';

  if (mentsu.type === 'shuntsu') {
    return { fu: 0, label: '' }; // 順子は0符
  } else if (mentsu.type === 'koutsu') {
    if (yaochu) {
      fu = effectiveIsOpen ? 4 : 8;
      typeLabel = effectiveIsOpen ? '幺九明刻' : '幺九暗刻';
    } else {
      fu = effectiveIsOpen ? 2 : 4;
      typeLabel = effectiveIsOpen ? '中張明刻' : '中張暗刻';
    }
  } else if (mentsu.type === 'kantsu') {
    if (yaochu) {
      fu = effectiveIsOpen ? 16 : 32;
      typeLabel = effectiveIsOpen ? '幺九明槓' : '幺九暗槓';
    } else {
      fu = effectiveIsOpen ? 8 : 16;
      typeLabel = effectiveIsOpen ? '中張明槓' : '中張暗槓';
    }
  }

  return { fu, label: typeLabel };
}

// ============================================================
// 符計算メイン
// ============================================================

/**
 * 符計算のメイン関数。
 *
 * @param yakuResult  役判定結果（YakuResult）
 * @param context     役判定コンテキスト
 * @returns FuResult
 */
export function calcFu(
  yakuResult: YakuResult,
  context: YakuContext,
): FuResult {
  const items: FuItem[] = [];

  // 七対子: 25符固定
  if (yakuResult.isChiitoitsu) {
    return {
      items: [{ label: '七対子固定', fu: 25 }],
      rawFu: 25,
      fu: 25,
    };
  }

  const decomp = yakuResult.decomposition;
  if (!decomp) {
    // 分解なし（役なし等）: 30符をデフォルトとして返す
    return { items: [], rawFu: 30, fu: 30 };
  }

  const isPinfu = yakuResult.yaku.some((y) => y.name === 'pinfu');

  // 平和ツモ: 20符固定
  if (isPinfu && context.isTsumo) {
    return {
      items: [{ label: '平和ツモ固定', fu: 20 }],
      rawFu: 20,
      fu: 20,
    };
  }

  // 平和ロン: 30符固定
  if (isPinfu && !context.isTsumo) {
    return {
      items: [{ label: '平和ロン固定', fu: 30 }],
      rawFu: 30,
      fu: 30,
    };
  }

  // ① 副底: 20符
  items.push({ label: '副底', fu: 20 });

  // ② 面子符
  for (const mentsu of decomp.mentsuList) {
    const { fu, label } = calcMentsuFu(mentsu, context.winTile, context.isTsumo);
    if (fu > 0) {
      items.push({ label, fu });
    }
  }

  // ③ 雀頭符
  if (isYakuhai(decomp.jantou.tile, context.seatWind, context.roundWind)) {
    items.push({ label: '役牌雀頭', fu: 2 });
  }

  // ④ 待ち形符
  const waitType = detectWaitType(decomp, context.winTile);
  if (waitType === 'penchan') {
    items.push({ label: '辺張待ち', fu: 2 });
  } else if (waitType === 'kanchan') {
    items.push({ label: '嵌張待ち', fu: 2 });
  } else if (waitType === 'tanki') {
    items.push({ label: '単騎待ち', fu: 2 });
  }
  // 両面・双碰は0符

  // ⑤ ツモ符: 2符（平和以外）
  if (context.isTsumo) {
    items.push({ label: 'ツモ', fu: 2 });
  }

  // ⑥ 門前ロン加符: 10符
  if (!context.isTsumo && !context.isOpen) {
    items.push({ label: '門前ロン', fu: 10 });
  }

  // 合計
  const rawFu = items.reduce((sum, item) => sum + item.fu, 0);

  // 10符単位に切り上げ
  const fu = Math.ceil(rawFu / 10) * 10;

  return { items, rawFu, fu };
}
