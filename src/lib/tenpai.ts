/**
 * 聴牌判定エンジン
 *
 * 13枚の手牌（副露なし）から聴牌判定を行い、アガリ牌（待ち牌）を列挙する。
 * 対応する和了形：
 *   1. 4面子1雀頭（通常形）
 *   2. 七対子（チートイツ）
 *   3. 国士無双（コクシムソウ）
 */

import { ALL_TILES } from '@/data/tiles';

// 手牌を「suit+number」の数値配列に変換するための定数
// 萬子: 1-9, 筒子: 11-19, 索子: 21-29, 風牌: 31-34, 三元牌: 41-43
export function tileIdToKey(tileId: string): number {
  // Sprint 8: 赤ドラを通常牌として扱う（man5r → man5）
  if (tileId === 'man5r') return 5;
  if (tileId === 'pin5r') return 15;
  if (tileId === 'sou5r') return 25;

  const manMatch = tileId.match(/^man(\d)$/);
  if (manMatch) return parseInt(manMatch[1]);

  const pinMatch = tileId.match(/^pin(\d)$/);
  if (pinMatch) return 10 + parseInt(pinMatch[1]);

  const souMatch = tileId.match(/^sou(\d)$/);
  if (souMatch) return 20 + parseInt(souMatch[1]);

  const windMatch = tileId.match(/^wind(\d)$/);
  if (windMatch) return 30 + parseInt(windMatch[1]);

  const dragonMatch = tileId.match(/^dragon(\d)$/);
  if (dragonMatch) return 40 + parseInt(dragonMatch[1]);

  return 0;
}

export function keyToTileId(key: number): string {
  if (key >= 1 && key <= 9) return `man${key}`;
  if (key >= 11 && key <= 19) return `pin${key - 10}`;
  if (key >= 21 && key <= 29) return `sou${key - 20}`;
  if (key >= 31 && key <= 34) return `wind${key - 30}`;
  if (key >= 41 && key <= 43) return `dragon${key - 40}`;
  return '';
}

/** 手牌IDリストをキー→枚数のMapに変換 */
function toCountMap(tileIds: string[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const id of tileIds) {
    const key = tileIdToKey(id);
    if (key > 0) {
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return map;
}

/** 萬子/筒子/索子の連続判定用オフセット */
function getSuitKeys(suit: 'man' | 'pin' | 'sou'): number[] {
  const base = suit === 'man' ? 0 : suit === 'pin' ? 10 : 20;
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => base + n);
}

/**
 * 手牌が和了形か判定する（通常形）。
 * @param tileIds 手牌のIDリスト
 * @param requiredMentsuCount 必要な面子数（デフォルト4）。副露がある場合に減らす。
 * 例: 副露1面子（ポン3枚/カン4枚）の場合は 3 を渡す。
 */
export function isWinningHand(tileIds: string[], requiredMentsuCount: number = 4): boolean {
  const countMap = toCountMap(tileIds);
  const keys = Array.from(countMap.keys()).sort((a, b) => a - b);

  // 雀頭候補を全て試す
  for (const headKey of keys) {
    const cnt = countMap.get(headKey) ?? 0;
    if (cnt < 2) continue;

    // 雀頭を除いて面子分解を試みる
    const remaining = new Map(countMap);
    remaining.set(headKey, cnt - 2);
    if (remaining.get(headKey) === 0) remaining.delete(headKey);

    if (canDecomposeMentsuN(remaining, requiredMentsuCount)) return true;
  }

  return false;
}

/**
 * 残り牌をちょうど N 個の面子（刻子/順子）に分解できるか判定する（再帰）。
 * N=0 のとき残り牌が空であれば true。
 */
function canDecomposeMentsuN(countMap: Map<number, number>, n: number): boolean {
  if (n === 0) return countMap.size === 0;
  if (countMap.size === 0) return false;

  // 最小キーの牌から処理
  const sortedKeys = Array.from(countMap.keys()).sort((a, b) => a - b);
  const firstKey = sortedKeys[0];
  const cnt = countMap.get(firstKey) ?? 0;

  // 1. 刻子として使う
  if (cnt >= 3) {
    const next = new Map(countMap);
    const newCnt = cnt - 3;
    if (newCnt === 0) next.delete(firstKey);
    else next.set(firstKey, newCnt);
    if (canDecomposeMentsuN(next, n - 1)) return true;
  }

  // 2. 順子として使う（数牌のみ）
  const suit = getSuitOfKey(firstKey);
  if (suit !== null) {
    const k2 = firstKey + 1;
    const k3 = firstKey + 2;
    if (
      (countMap.get(k2) ?? 0) >= 1 &&
      (countMap.get(k3) ?? 0) >= 1
    ) {
      const next = new Map(countMap);
      decrementKey(next, firstKey);
      decrementKey(next, k2);
      decrementKey(next, k3);
      if (canDecomposeMentsuN(next, n - 1)) return true;
    }
  }

  return false;
}

/**
 * 残り牌を全て面子（刻子/順子）に分解できるか判定する（再帰）。
 */
function canDecomposeMentsu(countMap: Map<number, number>): boolean {
  if (countMap.size === 0) return true;

  // 最小キーの牌から処理
  const sortedKeys = Array.from(countMap.keys()).sort((a, b) => a - b);
  const firstKey = sortedKeys[0];
  const cnt = countMap.get(firstKey) ?? 0;

  // 1. 刻子として使う
  if (cnt >= 3) {
    const next = new Map(countMap);
    const newCnt = cnt - 3;
    if (newCnt === 0) next.delete(firstKey);
    else next.set(firstKey, newCnt);
    if (canDecomposeMentsu(next)) return true;
  }

  // 2. 順子として使う（数牌のみ）
  // firstKey の suit を判断
  const suit = getSuitOfKey(firstKey);
  if (suit !== null) {
    const k2 = firstKey + 1;
    const k3 = firstKey + 2;
    if (
      (countMap.get(k2) ?? 0) >= 1 &&
      (countMap.get(k3) ?? 0) >= 1
    ) {
      const next = new Map(countMap);
      decrementKey(next, firstKey);
      decrementKey(next, k2);
      decrementKey(next, k3);
      if (canDecomposeMentsu(next)) return true;
    }
  }

  // どちらでも分解できなかった場合
  return false;
}

/** キーのスーツを返す（数牌のみ: 'man'|'pin'|'sou'、字牌は null） */
function getSuitOfKey(key: number): 'man' | 'pin' | 'sou' | null {
  if (key >= 1 && key <= 9) return 'man';
  if (key >= 11 && key <= 19) return 'pin';
  if (key >= 21 && key <= 29) return 'sou';
  return null;
}

function decrementKey(map: Map<number, number>, key: number): void {
  const cnt = map.get(key) ?? 0;
  if (cnt <= 1) map.delete(key);
  else map.set(key, cnt - 1);
}

/**
 * 七対子の聴牌判定。
 * 6ペア＋単騎1枚 → 単騎の牌が待ち牌。
 */
function getChiitoisuWaits(tileIds: string[]): string[] {
  const countMap = toCountMap(tileIds);
  if (tileIds.length !== 13) return [];

  const pairs: number[] = [];
  const singles: number[] = [];

  for (const [key, cnt] of countMap.entries()) {
    if (cnt >= 2) pairs.push(key);
    if (cnt % 2 === 1) singles.push(key); // 奇数枚 → 単騎候補
  }

  // 厳密に: 6ペア + 1単騎
  if (pairs.length === 6 && singles.length === 1) {
    return [keyToTileId(singles[0])];
  }

  return [];
}

/**
 * 国士無双の聴牌判定。
 * 13種の么九牌があればそれ以外の牌が待ちになる。
 * 全么九牌1枚ずつあれば13面待ち。
 */
const KOKUSHI_KEYS = [1, 9, 11, 19, 21, 29, 31, 32, 33, 34, 41, 42, 43];
const KOKUSHI_TILE_IDS = KOKUSHI_KEYS.map(keyToTileId);

function getKokushiWaits(tileIds: string[]): string[] {
  if (tileIds.length !== 13) return [];

  const countMap = toCountMap(tileIds);
  const kokushiPresent = KOKUSHI_KEYS.filter((k) => (countMap.get(k) ?? 0) >= 1);

  // 么九牌以外の牌が含まれていたら国士無双にはなれない
  for (const [key] of countMap.entries()) {
    if (!KOKUSHI_KEYS.includes(key)) return [];
  }

  if (kokushiPresent.length === 13) {
    // 全13種揃っている → 13面待ち
    return [...KOKUSHI_TILE_IDS];
  }

  if (kokushiPresent.length === 12) {
    // 12種 + どこかに2枚ある → 足りない1種が待ち
    const missing = KOKUSHI_KEYS.filter((k) => !kokushiPresent.includes(k));
    return missing.map(keyToTileId);
  }

  return [];
}

// ============================================================
// 公開 API
// ============================================================

export type TenpaiStatus =
  | { status: 'tenpai'; waits: string[] }
  | { status: 'not-tenpai'; reason: string };

/**
 * 副露がある場合の必要手牌枚数を計算する。
 * 副露1面子（3枚）ごとに手牌は3枚減る。槓子（4枚）は4枚。
 * 13枚 - (副露牌枚数合計) が残り手牌の必要枚数。
 * @deprecated カン（4枚）副露の場合、必要手牌数は9ではなく10（嶺上牌分を含む）。
 * 正確な計算には getRequiredHandCountByFace を使用してください。
 */
export function getRequiredHandCount(meldTileCount: number): number {
  return 13 - meldTileCount;
}

/**
 * 副露面子数から必要手牌枚数を計算する（カン副露に対応）。
 * 副露1面子ごとに手牌は3枚減る（槓子も1面子として換算）。
 * @param meldFaceCount 副露面子数（副露の個数。カンも1面子としてカウント）
 */
export function getRequiredHandCountByFace(meldFaceCount: number): number {
  return 13 - meldFaceCount * 3;
}

/**
 * 副露牌の合計枚数から副露面子数（槓子=1面子として換算）を計算する。
 * ポン/チー(3枚)=1面子, カン(4枚)=1面子。
 * Math.floor(meldTileCount / 3) で正しく計算できる:
 *   3枚(ポン/チー) → 1面子, 4枚(カン) → 1面子,
 *   6枚(ポン×2) → 2面子, 7枚(ポン+カン) → 2面子,
 *   8枚(カン×2) → 2面子, 10枚(ポン×2+カン) → 3面子
 * 正確な面子数は呼び出し側（melds.length）から渡すことを推奨。
 * @param meldTileCount 副露牌の合計枚数
 */
export function getMeldFaceCount(meldTileCount: number): number {
  return Math.floor(meldTileCount / 3);
}

/**
 * 13枚の手牌（または副露込みで13枚相当）から聴牌判定を行い、待ち牌リストを返す。
 * @param tileIds 手牌のIDリスト（副露なし13枚 or 副露あり残り手牌）
 * @param meldTileCount 副露牌の合計枚数
 * @param meldFaceCount 副露面子数（省略時は meldTileCount から自動計算）
 * @returns TenpaiStatus
 */
export function checkTenpai(tileIds: string[], meldTileCount: number = 0, meldFaceCount?: number): TenpaiStatus {
  // 副露面子数: 渡されなければ自動計算
  // melds.length が渡された場合はそれを使用し、そうでなければ meldTileCount から推定
  const resolvedMeldFaceCount = meldFaceCount ?? getMeldFaceCount(meldTileCount);
  // 残り必要面子数（4面子 - 副露面子数）
  const remainingMentsuCount = 4 - resolvedMeldFaceCount;
  // 必要手牌枚数: 面子数ベースで計算（カン副露でも正しく10枚が計算される）
  const required = getRequiredHandCountByFace(resolvedMeldFaceCount);

  if (tileIds.length < required) {
    return {
      status: 'not-tenpai',
      reason: `${required}枚必要です（現在${tileIds.length}枚）`,
    };
  }
  if (tileIds.length > required) {
    return {
      status: 'not-tenpai',
      reason: `${required}枚で判定します（現在${tileIds.length}枚）`,
    };
  }

  const waits = new Set<string>();

  // 通常形（副露あり時は残り手牌のみで雀頭+面子を構成）
  for (const candidate of ALL_TILES) {
    const testHand = [...tileIds, candidate.id];
    // 同一牌が5枚になる場合はスキップ
    const cnt = tileIds.filter((id) => id === candidate.id).length;
    if (cnt >= 4) continue;

    if (isWinningHand(testHand, remainingMentsuCount)) {
      waits.add(candidate.id);
    }
  }

  // 副露なしの場合のみ七対子・国士無双を判定
  if (meldTileCount === 0) {
    // 七対子
    for (const cId of getChiitoisuWaits(tileIds)) {
      waits.add(cId);
    }

    // 国士無双
    for (const cId of getKokushiWaits(tileIds)) {
      waits.add(cId);
    }
  }

  if (waits.size === 0) {
    return { status: 'not-tenpai', reason: 'ノーテンです' };
  }

  // 待ち牌を ALL_TILES の順番でソート
  const sortedWaits = ALL_TILES.map((t) => t.id).filter((id) => waits.has(id));

  return { status: 'tenpai', waits: sortedWaits };
}

/**
 * 聴牌ボタンの状態を返す。
 * @param tileCount 手牌の枚数
 * @param meldTileCount 副露牌の合計枚数（後方互換性のため残す）
 * @param meldFaceCount 副露面子数（省略時は meldTileCount から自動計算）
 * @returns 活性化できる場合は null、できない場合は理由文字列
 */
export function getTenpaiButtonReason(tileCount: number, meldTileCount: number = 0, meldFaceCount?: number): string | null {
  const resolvedMeldFaceCount = meldFaceCount ?? getMeldFaceCount(meldTileCount);
  const required = getRequiredHandCountByFace(resolvedMeldFaceCount);
  if (tileCount < required) {
    return `${required}枚必要です（現在${tileCount}枚）`;
  }
  if (tileCount > required) {
    return `${required}枚で判定します（現在${tileCount}枚）`;
  }
  return null; // required枚なら判定可能
}
