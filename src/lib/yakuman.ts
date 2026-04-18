/**
 * 役満判定エンジン（Sprint 8）
 *
 * 対応役満:
 * - 国士無双（13面待ちはダブル役満）
 * - 四暗刻（単騎待ちはダブル役満）
 * - 大三元
 * - 小四喜
 * - 大四喜（ダブル役満）
 * - 字一色
 * - 緑一色
 * - 清老頭
 * - 九蓮宝燈（純正九蓮宝燈はダブル役満）
 * - 四槓子
 */

import { YakuContext, YakumanEntry, YakumanResult, Mentsu } from '@/types/yaku';
import { tileIdToKey } from './tenpai';
import { getAllDecompositions } from './yaku';

// ============================================================
// ユーティリティ
// ============================================================

/** 赤ドラを通常牌に正規化する（man5r → man5 等） */
export function normalizeAkaDoraId(tileId: string): string {
  if (tileId === 'man5r') return 'man5';
  if (tileId === 'pin5r') return 'pin5';
  if (tileId === 'sou5r') return 'sou5';
  return tileId;
}

/** 牌IDリストを正規化する */
export function normalizeTileIds(tileIds: string[]): string[] {
  return tileIds.map(normalizeAkaDoraId);
}

/** 幺九牌か */
function isYaochu(tileId: string): boolean {
  const key = tileIdToKey(tileId);
  if (key >= 1 && key <= 9) return key === 1 || key === 9;
  if (key >= 11 && key <= 19) return key === 11 || key === 19;
  if (key >= 21 && key <= 29) return key === 21 || key === 29;
  if (key >= 31) return true; // 字牌
  return false;
}

/** 字牌か */
function isZipai(tileId: string): boolean {
  const key = tileIdToKey(tileId);
  return key >= 31;
}

/** 数牌か */
function isSuhai(tileId: string): boolean {
  const key = tileIdToKey(tileId);
  return key >= 1 && key <= 29;
}

/** 牌から数値部分を取得 */
function getNumber(tileId: string): number {
  const m = tileId.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

/** 牌のスーツを取得 */
function getSuitPrefix(tileId: string): string | null {
  if (tileId.startsWith('man')) return 'man';
  if (tileId.startsWith('pin')) return 'pin';
  if (tileId.startsWith('sou')) return 'sou';
  return null;
}

// ============================================================
// 役満判定ロジック
// ============================================================

/**
 * 国士無双
 * 13種類の幺九牌（1m9m1p9p1s9s東南西北白發中）+ その中の1枚対子
 * 純粋13面待ち（全13種を1枚ずつ持ち、任意の幺九牌でアガリ）はダブル役満
 */
function checkKokushi(tileIds: string[], winTile: string): YakumanEntry | null {
  const YAOCHU_TILES = [
    'man1', 'man9', 'pin1', 'pin9', 'sou1', 'sou9',
    'wind1', 'wind2', 'wind3', 'wind4',
    'dragon1', 'dragon2', 'dragon3',
  ];

  // 全13種の幺九牌が含まれているか確認
  const hasAllYaochu = YAOCHU_TILES.every((t) => tileIds.includes(t));
  if (!hasAllYaochu) return null;

  // 14枚全てが幺九牌であること
  if (!tileIds.every(isYaochu)) return null;

  // 対子になっている牌を特定
  const countMap = new Map<string, number>();
  for (const id of tileIds) {
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  // 純正13面待ち判定: アガリ前に全13種を1枚ずつ持っていた
  // 14枚手牌でアガリ牌が幺九牌13種のいずれかで、かつアガリ前13枚に13種全て含まれていた
  // 判定: 各幺九牌が1枚ずつ（計13枚）+ アガリ牌（任意の幺九牌）という形
  const preHandIds = tileIds.filter((id, idx) => {
    // アガリ牌を1枚除いた13枚を作る（最後の1枚がアガリ牌と仮定）
    if (id === winTile && idx === tileIds.lastIndexOf(winTile)) return false;
    return true;
  });

  // 13面待ち確認: 13枚が全13種の幺九牌をちょうど1枚ずつ持つ
  const isJuusanmen = preHandIds.length === 13 &&
    YAOCHU_TILES.every((t) => preHandIds.filter((id) => id === t).length === 1);

  // 純正13面待ち判定:
  // アガリ前の13枚が全13種の幺九牌を1枚ずつ持つ形（どの幺九牌でもアガれる）
  // - isJuusanmen = true（アガリ前13枚が全13種各1枚）であれば純正13面
  //
  // 単騎待ちとの区別:
  // 単騎: アガリ前13枚に対子がある（13種の全てを1枚ずつ持っていない）→ isJuusanmen = false
  // 13面: アガリ前13枚が全13種各1枚ずつ持つ → isJuusanmen = true
  // ※ アガリ牌の14枚中の枚数（1枚か2枚か）は判定に影響しない
  //   （アガリ前13枚が全種揃っていれば13面待ちと判断する）
  const is13waits = isJuusanmen;

  return {
    name: 'kokushi',
    label: is13waits ? '国士無双十三面' : '国士無双',
    multiplier: is13waits ? 2 : 1,
  };
}

/**
 * 四暗刻
 * 4組の暗刻（暗槓含む）と雀頭
 * 単騎待ちでのアガリはダブル役満（四暗刻単騎）
 */
function checkSuanko(
  tileIds: string[],
  context: YakuContext,
  fixedMentsu: Mentsu[],
): YakumanEntry | null {
  // 副露（明刻/明槓）がある場合は四暗刻不可
  const hasOpenMeld = fixedMentsu.some((m) => m.isOpen);
  if (hasOpenMeld) return null;

  // 面子分解を試みる
  const decomps = getAllDecompositions(tileIds, fixedMentsu);
  if (decomps.length === 0) return null;

  for (const decomp of decomps) {
    const allMentsu = decomp.mentsuList;

    // 全面子が刻子/槓子（暗刻/暗槓）であること
    const allAnko = allMentsu.every(
      (m) => m.type === 'koutsu' || m.type === 'kantsu'
    );
    if (!allAnko) continue;

    // ロンアガリの場合: アガリ牌が雀頭（単騎）or 刻子（シャンポン待ち）
    if (!context.isTsumo) {
      const winTile = context.winTile;
      const jantouTile = decomp.jantou.tile;

      // 単騎待ち: 雀頭がアガリ牌 = ダブル役満
      if (jantouTile === winTile) {
        return {
          name: 'suanko',
          label: '四暗刻単騎',
          multiplier: 2,
        };
      }

      // シャンポン待ち（刻子の1つがアガリ牌）の場合
      // ロンはシャンポン待ちの刻子が明刻になるため四暗刻成立しない
      const winMentsu = allMentsu.find((m) => m.tiles.includes(winTile));
      if (winMentsu && (winMentsu.type === 'koutsu' || winMentsu.type === 'kantsu')) {
        // シャンポン待ちロン = 明刻扱い → 四暗刻不可
        return null;
      }

      return null;
    }

    // ツモアガリの場合: 単騎待ちチェック
    const jantouTile = decomp.jantou.tile;
    const isTanki = jantouTile === context.winTile;

    return {
      name: 'suanko',
      label: isTanki ? '四暗刻単騎' : '四暗刻',
      multiplier: isTanki ? 2 : 1,
    };
  }

  return null;
}

/**
 * 大三元
 * 白・發・中の3種全ての刻子/槓子
 */
function checkDaisangen(tileIds: string[], fixedMentsu: Mentsu[]): YakumanEntry | null {
  const decomps = getAllDecompositions(tileIds, fixedMentsu);
  if (decomps.length === 0) return null;

  for (const decomp of decomps) {
    const dragonKotsus = decomp.mentsuList.filter(
      (m) =>
        (m.type === 'koutsu' || m.type === 'kantsu') &&
        ['dragon1', 'dragon2', 'dragon3'].includes(m.tiles[0]),
    );
    if (dragonKotsus.length === 3) {
      return { name: 'daisangen', label: '大三元', multiplier: 1 };
    }
  }
  return null;
}

/**
 * 小四喜
 * 東南西北のうち3種の刻子/槓子 + 残り1種を雀頭
 */
function checkShosushi(tileIds: string[], fixedMentsu: Mentsu[]): YakumanEntry | null {
  const WIND_TILES = ['wind1', 'wind2', 'wind3', 'wind4'];
  const decomps = getAllDecompositions(tileIds, fixedMentsu);
  if (decomps.length === 0) return null;

  for (const decomp of decomps) {
    const windKotsus = decomp.mentsuList.filter(
      (m) =>
        (m.type === 'koutsu' || m.type === 'kantsu') &&
        WIND_TILES.includes(m.tiles[0]),
    );
    const jantouIsWind = WIND_TILES.includes(decomp.jantou.tile);
    if (windKotsus.length === 3 && jantouIsWind) {
      return { name: 'shosushi', label: '小四喜', multiplier: 1 };
    }
  }
  return null;
}

/**
 * 大四喜（ダブル役満）
 * 東南西北の全4種の刻子/槓子
 */
function checkDaisushi(tileIds: string[], fixedMentsu: Mentsu[]): YakumanEntry | null {
  const WIND_TILES = ['wind1', 'wind2', 'wind3', 'wind4'];
  const decomps = getAllDecompositions(tileIds, fixedMentsu);
  if (decomps.length === 0) return null;

  for (const decomp of decomps) {
    const windKotsus = decomp.mentsuList.filter(
      (m) =>
        (m.type === 'koutsu' || m.type === 'kantsu') &&
        WIND_TILES.includes(m.tiles[0]),
    );
    if (windKotsus.length === 4) {
      return { name: 'daisushi', label: '大四喜', multiplier: 2 };
    }
  }
  return null;
}

/**
 * 字一色
 * 全牌が字牌（風牌+三元牌）
 */
function checkTsuiso(tileIds: string[]): YakumanEntry | null {
  if (tileIds.every(isZipai)) {
    return { name: 'tsuiso', label: '字一色', multiplier: 1 };
  }
  return null;
}

/**
 * 緑一色
 * 索子の2,3,4,6,8と發のみで構成
 */
function checkRyuiso(tileIds: string[]): YakumanEntry | null {
  const GREEN_TILES = new Set(['sou2', 'sou3', 'sou4', 'sou6', 'sou8', 'dragon2']);
  if (tileIds.every((t) => GREEN_TILES.has(t))) {
    return { name: 'ryuiso', label: '緑一色', multiplier: 1 };
  }
  return null;
}

/**
 * 清老頭
 * 全牌が数牌の1か9（萬/筒/索の端牌）のみ
 */
function checkChinroto(tileIds: string[]): YakumanEntry | null {
  const CHINROTO_TILES = new Set(['man1', 'man9', 'pin1', 'pin9', 'sou1', 'sou9']);
  if (tileIds.every((t) => CHINROTO_TILES.has(t))) {
    return { name: 'chinroto', label: '清老頭', multiplier: 1 };
  }
  return null;
}

/**
 * 九蓮宝燈
 * 同一スーツで 1112345678999 + 任意の1枚
 * 純正九蓮宝燈（9面待ち）はダブル役満
 */
function checkChuren(tileIds: string[], winTile: string): YakumanEntry | null {
  // 全牌が同一スーツの数牌
  if (!tileIds.every(isSuhai)) return null;
  const suits = new Set(tileIds.map(getSuitPrefix));
  if (suits.size !== 1) return null;
  const suit = suits.values().next().value;

  // 枚数カウント
  const countMap = new Map<number, number>();
  for (const id of tileIds) {
    const n = getNumber(id);
    countMap.set(n, (countMap.get(n) ?? 0) + 1);
  }

  // 1,9が3枚以上、2-8が1枚以上存在すること（基本形）
  const cnt1 = countMap.get(1) ?? 0;
  const cnt9 = countMap.get(9) ?? 0;
  if (cnt1 < 3 || cnt9 < 3) return null;

  for (let n = 2; n <= 8; n++) {
    if ((countMap.get(n) ?? 0) < 1) return null;
  }

  // 純正九蓮宝燈判定: 1112345678999 の形でアガリ牌が1〜9のいずれか
  // アガリ前の13枚が 1112345678999 の形かを確認
  const winNumber = getNumber(winTile);
  const winSuit = getSuitPrefix(winTile);

  if (winSuit !== suit) return null;

  // アガリ牌を除いた13枚のカウント
  const preHand = [...tileIds];
  const winIdx = preHand.findIndex((id) => id === winTile);
  if (winIdx === -1) return null;
  preHand.splice(winIdx, 1);

  const preMap = new Map<number, number>();
  for (const id of preHand) {
    const n = getNumber(id);
    preMap.set(n, (preMap.get(n) ?? 0) + 1);
  }

  // 純正形: 1が3枚、2-8が1枚、9が3枚 (合計13枚)
  const isPure =
    (preMap.get(1) ?? 0) === 3 &&
    [2, 3, 4, 5, 6, 7, 8].every((n) => (preMap.get(n) ?? 0) === 1) &&
    (preMap.get(9) ?? 0) === 3;

  // 純正九蓮宝燈 = アガリ牌がどの数字でも成立（9面待ち）
  return {
    name: 'churen',
    label: isPure ? '純正九蓮宝燈' : '九蓮宝燈',
    multiplier: isPure ? 2 : 1,
  };
}

/**
 * 四槓子
 * 4組の槓子（明槓/暗槓）
 */
function checkSukantsu(tileIds: string[], fixedMentsu: Mentsu[]): YakumanEntry | null {
  const decomps = getAllDecompositions(tileIds, fixedMentsu);
  if (decomps.length === 0) return null;

  for (const decomp of decomps) {
    const kantsuCount = decomp.mentsuList.filter((m) => m.type === 'kantsu').length;
    if (kantsuCount === 4) {
      return { name: 'sukantsu', label: '四槓子', multiplier: 1 };
    }
  }
  return null;
}

// ============================================================
// 公開 API
// ============================================================

/**
 * 役満を判定する。
 * 役満が成立した場合は YakumanResult を返す。
 * 役満が成立しない場合は null を返す。
 *
 * @param tileIds    14枚の手牌（副露込みの残り手牌 + アガリ牌）正規化済み
 * @param context    役判定コンテキスト
 * @param fixedMentsu 副露面子
 * @returns YakumanResult | null
 */
export function detectYakuman(
  tileIds: string[],
  context: YakuContext,
  fixedMentsu: Mentsu[] = [],
): YakumanResult | null {
  const entries: YakumanEntry[] = [];

  // 国士無双
  const kokushi = checkKokushi(tileIds, context.winTile);
  if (kokushi) entries.push(kokushi);

  // 四暗刻（国士無双と複合しない）
  if (entries.length === 0) {
    const suanko = checkSuanko(tileIds, context, fixedMentsu);
    if (suanko) entries.push(suanko);
  }

  // 大三元
  const daisangen = checkDaisangen(tileIds, fixedMentsu);
  if (daisangen) entries.push(daisangen);

  // 大四喜（小四喜より先にチェック）
  const daisushi = checkDaisushi(tileIds, fixedMentsu);
  if (daisushi) {
    entries.push(daisushi);
  } else {
    // 小四喜（大四喜でない場合）
    const shosushi = checkShosushi(tileIds, fixedMentsu);
    if (shosushi) entries.push(shosushi);
  }

  // 字一色
  const tsuiso = checkTsuiso(tileIds);
  if (tsuiso) entries.push(tsuiso);

  // 緑一色
  const ryuiso = checkRyuiso(tileIds);
  if (ryuiso) entries.push(ryuiso);

  // 清老頭
  const chinroto = checkChinroto(tileIds);
  if (chinroto) entries.push(chinroto);

  // 九蓮宝燈
  const churen = checkChuren(tileIds, context.winTile);
  if (churen) entries.push(churen);

  // 四槓子
  const sukantsu = checkSukantsu(tileIds, fixedMentsu);
  if (sukantsu) entries.push(sukantsu);

  if (entries.length === 0) return null;

  const totalMultiplier = entries.reduce((sum, e) => sum + e.multiplier, 0);

  return {
    isYakuman: true,
    entries,
    totalMultiplier,
  };
}
