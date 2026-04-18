/**
 * 役判定エンジン（Sprint 4: 門前役）
 *
 * 対応役:
 * タンヤオ、平和、一盃口、二盃口、三色同順、三色同刻、
 * 一気通貫、対々和、三暗刻、七対子、混全帯么九（チャンタ）、
 * 純全帯么九（純チャン）、混一色、清一色、小三元、混老頭、
 * 役牌（場風/自風/三元牌）
 */

import { tileIdToKey, keyToTileId } from './tenpai';
import {
  Yaku,
  YakuName,
  YakuContext,
  Mentsu,
  MentsuType,
  Jantou,
  HandDecomposition,
  YakuResult,
} from '@/types/yaku';
import { SeatWind, RoundWind } from '@/types/situation';

// ============================================================
// 役の定義
// ============================================================

export const YAKU_DEFINITIONS: Record<YakuName, Yaku> = {
  tanyao: { name: 'tanyao', label: 'タンヤオ', han: 1, hanOpen: 1 },
  pinfu: { name: 'pinfu', label: '平和', han: 1 },
  iipeiko: { name: 'iipeiko', label: '一盃口', han: 1 },
  ryanpeiko: { name: 'ryanpeiko', label: '二盃口', han: 3 },
  'sanshoku-juntsu': { name: 'sanshoku-juntsu', label: '三色同順', han: 2, hanOpen: 1 },
  'sanshoku-doko': { name: 'sanshoku-doko', label: '三色同刻', han: 2, hanOpen: 2 },
  ittsu: { name: 'ittsu', label: '一気通貫', han: 2, hanOpen: 1 },
  toitoi: { name: 'toitoi', label: '対々和', han: 2, hanOpen: 2 },
  sananko: { name: 'sananko', label: '三暗刻', han: 2, hanOpen: 2 },
  chiitoitsu: { name: 'chiitoitsu', label: '七対子', han: 2 },
  chanta: { name: 'chanta', label: '混全帯么九', han: 2, hanOpen: 1 },
  junchan: { name: 'junchan', label: '純全帯么九', han: 3, hanOpen: 2 },
  honitsu: { name: 'honitsu', label: '混一色', han: 3, hanOpen: 2 },
  chinitsu: { name: 'chinitsu', label: '清一色', han: 6, hanOpen: 5 },
  shosangen: { name: 'shosangen', label: '小三元', han: 2, hanOpen: 2 },
  honroto: { name: 'honroto', label: '混老頭', han: 2, hanOpen: 2 },
  'yakuhai-round': { name: 'yakuhai-round', label: '役牌（場風）', han: 1, hanOpen: 1 },
  'yakuhai-seat': { name: 'yakuhai-seat', label: '役牌（自風）', han: 1, hanOpen: 1 },
  'yakuhai-haku': { name: 'yakuhai-haku', label: '役牌（白）', han: 1, hanOpen: 1 },
  'yakuhai-hatsu': { name: 'yakuhai-hatsu', label: '役牌（發）', han: 1, hanOpen: 1 },
  'yakuhai-chun': { name: 'yakuhai-chun', label: '役牌（中）', han: 1, hanOpen: 1 },
  // Sprint 6: 状況役（門前限定）
  riichi: { name: 'riichi', label: 'リーチ', han: 1 },
  'double-riichi': { name: 'double-riichi', label: 'ダブルリーチ', han: 2 },
  ippatsu: { name: 'ippatsu', label: '一発', han: 1 },
  'menzen-tsumo': { name: 'menzen-tsumo', label: '門前清自摸和', han: 1 },
  rinshan: { name: 'rinshan', label: '嶺上開花', han: 1 },
  haitei: { name: 'haitei', label: '海底撈月', han: 1, hanOpen: 1 },
  houtei: { name: 'houtei', label: '河底撈魚', han: 1, hanOpen: 1 },
  // Sprint 8: ドラ系（動的生成のため0翻プレースホルダー。実際の翻数は useYaku で設定）
  dora: { name: 'dora', label: 'ドラ', han: 0, hanOpen: 0 },
  uradora: { name: 'uradora', label: '裏ドラ', han: 0, hanOpen: 0 },
  akadora: { name: 'akadora', label: '赤ドラ', han: 0, hanOpen: 0 },
  // Sprint 8: 役満（通常役計算では使用しない。yakuman.ts で判定）
  kokushi: { name: 'kokushi', label: '国士無双', han: 13 },
  suanko: { name: 'suanko', label: '四暗刻', han: 13 },
  daisangen: { name: 'daisangen', label: '大三元', han: 13 },
  shosushi: { name: 'shosushi', label: '小四喜', han: 13, hanOpen: 13 },
  daisushi: { name: 'daisushi', label: '大四喜', han: 26, hanOpen: 26 },
  tsuiso: { name: 'tsuiso', label: '字一色', han: 13, hanOpen: 13 },
  ryuiso: { name: 'ryuiso', label: '緑一色', han: 13, hanOpen: 13 },
  chinroto: { name: 'chinroto', label: '清老頭', han: 13, hanOpen: 13 },
  churen: { name: 'churen', label: '九蓮宝燈', han: 13 },
  sukantsu: { name: 'sukantsu', label: '四槓子', han: 13, hanOpen: 13 },
};

// ============================================================
// ユーティリティ
// ============================================================

/** 幺九牌（么九牌）か判定 */
function isYaochuTile(tileId: string): boolean {
  const key = tileIdToKey(tileId);
  // 萬子・筒子・索子の1/9, 字牌全て
  if (key >= 1 && key <= 9) return key === 1 || key === 9;
  if (key >= 11 && key <= 19) return key === 11 || key === 19;
  if (key >= 21 && key <= 29) return key === 21 || key === 29;
  // 字牌
  if (key >= 31 && key <= 43) return true;
  return false;
}

/** 中張牌（2〜8の数牌）か判定 */
function isTanyaoTile(tileId: string): boolean {
  const key = tileIdToKey(tileId);
  if (key >= 2 && key <= 8) return true;
  if (key >= 12 && key <= 18) return true;
  if (key >= 22 && key <= 28) return true;
  return false;
}

/** 字牌か判定 */
function isZipai(tileId: string): boolean {
  const key = tileIdToKey(tileId);
  return key >= 31;
}

/** 数牌のスーツを返す（字牌は null） */
function getSuit(tileId: string): 'man' | 'pin' | 'sou' | null {
  if (tileId.startsWith('man')) return 'man';
  if (tileId.startsWith('pin')) return 'pin';
  if (tileId.startsWith('sou')) return 'sou';
  return null;
}

/** 牌IDから番号を取得 */
function getTileNumber(tileId: string): number {
  const m = tileId.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

/** スーツ変換 */
function seatWindToTileId(wind: SeatWind): string {
  const map: Record<SeatWind, string> = {
    east: 'wind1',
    south: 'wind2',
    west: 'wind3',
    north: 'wind4',
  };
  return map[wind];
}

function roundWindToTileId(wind: RoundWind): string {
  const map: Record<RoundWind, string> = {
    east: 'wind1',
    south: 'wind2',
  };
  return map[wind];
}

// ============================================================
// 面子分解（全パターン列挙）
// ============================================================

/**
 * 14枚の手牌から全ての有効な面子分解パターンを列挙する。
 * 各パターンは { mentsuList, jantou } の形。
 *
 * @param tileIds 14枚（または副露込みで残り手牌 + アガリ牌 = 面子数×3枚 + 雀頭2枚）
 * @param fixedMentsu 副露面子（固定面子として先に確定しているもの）
 */
export function getAllDecompositions(tileIds: string[], fixedMentsu: Mentsu[] = []): HandDecomposition[] {
  const results: HandDecomposition[] = [];

  // 牌をカウントマップへ
  const countMap = new Map<number, number>();
  for (const id of tileIds) {
    const key = tileIdToKey(id);
    if (key > 0) countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  const sortedKeys = Array.from(countMap.keys()).sort((a, b) => a - b);

  // 必要な面子数（固定面子を除いた残りの面子数）
  // 全体面子数 = 4, 残り面子数 = 4 - fixedMentsu.length
  const remainingMentsuCount = 4 - fixedMentsu.length;

  // 雀頭候補を全て試す
  for (const headKey of sortedKeys) {
    const cnt = countMap.get(headKey) ?? 0;
    if (cnt < 2) continue;

    const remaining = new Map(countMap);
    remaining.set(headKey, cnt - 2);
    if (remaining.get(headKey) === 0) remaining.delete(headKey);

    const headTileId = keyToTileId(headKey);
    const headSuit = getSuit(headTileId) ?? (headTileId.startsWith('wind') ? 'wind' : 'dragon');

    const jantou: Jantou = { tile: headTileId, suit: headSuit };

    // 残り牌を面子に分解
    const decomps = decomposeMentsu(remaining, []);
    for (const mentsuList of decomps) {
      if (mentsuList.length === remainingMentsuCount) {
        results.push({ mentsuList: [...fixedMentsu, ...mentsuList], jantou });
      }
    }
  }

  return results;
}

/**
 * 残り牌を面子（刻子/順子）に分解し、全パターンを返す（再帰）。
 */
function decomposeMentsu(
  countMap: Map<number, number>,
  current: Mentsu[],
): Mentsu[][] {
  if (countMap.size === 0) return [current];

  const results: Mentsu[][] = [];
  const sortedKeys = Array.from(countMap.keys()).sort((a, b) => a - b);
  const firstKey = sortedKeys[0];
  const cnt = countMap.get(firstKey) ?? 0;
  const firstTileId = keyToTileId(firstKey);
  const suit = getSuit(firstTileId);
  const suitStr = suit ?? (firstTileId.startsWith('wind') ? 'wind' : 'dragon');

  // 1. 刻子として使う
  if (cnt >= 3) {
    const next = new Map(countMap);
    const newCnt = cnt - 3;
    if (newCnt === 0) next.delete(firstKey);
    else next.set(firstKey, newCnt);

    const koutsu: Mentsu = {
      type: 'koutsu',
      tiles: [firstTileId, firstTileId, firstTileId],
      suit: suitStr,
    };
    const subResults = decomposeMentsu(next, [...current, koutsu]);
    results.push(...subResults);
  }

  // 2. 順子として使う（数牌のみ）
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

      const tile2Id = keyToTileId(k2);
      const tile3Id = keyToTileId(k3);
      const shuntsu: Mentsu = {
        type: 'shuntsu',
        tiles: [firstTileId, tile2Id, tile3Id],
        suit: suitStr,
      };
      const subResults = decomposeMentsu(next, [...current, shuntsu]);
      results.push(...subResults);
    }
  }

  return results;
}

function decrementKey(map: Map<number, number>, key: number): void {
  const cnt = map.get(key) ?? 0;
  if (cnt <= 1) map.delete(key);
  else map.set(key, cnt - 1);
}

// ============================================================
// 役判定ロジック
// ============================================================

/** タンヤオ判定: 全牌が中張牌（2〜8） */
function checkTanyao(decomp: HandDecomposition): boolean {
  const allTiles = [
    ...decomp.mentsuList.flatMap((m) => m.tiles),
    decomp.jantou.tile, decomp.jantou.tile,
  ];
  return allTiles.every(isTanyaoTile);
}

/** 平和判定: 全面子が順子、雀頭が役牌でない、待ちが両面 */
function checkPinfu(
  decomp: HandDecomposition,
  context: YakuContext,
): boolean {
  // 副露があれば平和不可
  if (context.isOpen) return false;

  // 全面子が順子
  if (!decomp.mentsuList.every((m) => m.type === 'shuntsu')) return false;

  // 雀頭が役牌でない
  const jantouTileId = decomp.jantou.tile;
  if (isYakuhaiTile(jantouTileId, context.seatWind, context.roundWind)) return false;

  // 待ちが両面（リャンメン）: アガリ牌を含む面子が順子で、両端でないこと
  // アガリ牌の入った面子を探す
  const winTile = context.winTile;
  for (const mentsu of decomp.mentsuList) {
    if (mentsu.type !== 'shuntsu') continue;
    if (!mentsu.tiles.includes(winTile)) continue;

    // 順子の最小・最大番号を確認
    const nums = mentsu.tiles.map(getTileNumber).sort((a, b) => a - b);
    const minNum = nums[0];
    const maxNum = nums[2];

    // アガリ牌が中間（カンチャン）でなく、かつ端（ペンチャン/タンキ）でもない
    const winNum = getTileNumber(winTile);

    // ペンチャン: 1-2-3の3 or 7-8-9の7
    if (minNum === 1 && winNum === 3) return false;
    if (maxNum === 9 && winNum === 7) return false;

    // カンチャン: 中間牌でアガリ
    if (winNum !== minNum && winNum !== maxNum) return false;

    // リャンメン確定
    return true;
  }

  return false;
}

/** 役牌牌か判定 */
function isYakuhaiTile(tileId: string, seatWind: SeatWind, roundWind: RoundWind): boolean {
  return (
    tileId === seatWindToTileId(seatWind) ||
    tileId === roundWindToTileId(roundWind) ||
    tileId === 'dragon1' || // 白
    tileId === 'dragon2' || // 發
    tileId === 'dragon3'    // 中
  );
}

/** 一盃口判定: 同一の順子が2組 */
function checkIipeiko(decomp: HandDecomposition, context: YakuContext): boolean {
  if (context.isOpen) return false;

  const shuntsus = decomp.mentsuList
    .filter((m) => m.type === 'shuntsu')
    .map((m) => m.tiles.slice().sort().join(','));

  // 同一順子のペアを探す
  const seen = new Set<string>();
  let pairCount = 0;
  const counted = new Set<string>();

  for (const key of shuntsus) {
    if (seen.has(key) && !counted.has(key)) {
      pairCount++;
      counted.add(key);
    }
    seen.add(key);
  }

  return pairCount === 1; // 1組のみ（2組あれば二盃口）
}

/** 二盃口判定: 同一の順子が2組×2 */
function checkRyanpeiko(decomp: HandDecomposition, context: YakuContext): boolean {
  if (context.isOpen) return false;

  const shuntsus = decomp.mentsuList
    .filter((m) => m.type === 'shuntsu')
    .map((m) => m.tiles.slice().sort().join(','));

  const counts = new Map<string, number>();
  for (const key of shuntsus) {
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let pairCount = 0;
  for (const cnt of counts.values()) {
    if (cnt >= 2) pairCount++;
  }

  return pairCount === 2;
}

/** 三色同順判定: 萬筒索の同番号順子 */
function checkSanshokuJuntsu(decomp: HandDecomposition): boolean {
  const manShuntsus = decomp.mentsuList
    .filter((m) => m.type === 'shuntsu' && m.suit === 'man')
    .map((m) => getTileNumber(m.tiles[0]));
  const pinShuntsus = decomp.mentsuList
    .filter((m) => m.type === 'shuntsu' && m.suit === 'pin')
    .map((m) => getTileNumber(m.tiles[0]));
  const souShuntsus = decomp.mentsuList
    .filter((m) => m.type === 'shuntsu' && m.suit === 'sou')
    .map((m) => getTileNumber(m.tiles[0]));

  for (const n of manShuntsus) {
    if (pinShuntsus.includes(n) && souShuntsus.includes(n)) return true;
  }
  return false;
}

/** 三色同刻判定: 萬筒索の同番号刻子 */
function checkSanshokuDoko(decomp: HandDecomposition): boolean {
  const manKotsus = decomp.mentsuList
    .filter((m) => (m.type === 'koutsu' || m.type === 'kantsu') && m.suit === 'man')
    .map((m) => getTileNumber(m.tiles[0]));
  const pinKotsus = decomp.mentsuList
    .filter((m) => (m.type === 'koutsu' || m.type === 'kantsu') && m.suit === 'pin')
    .map((m) => getTileNumber(m.tiles[0]));
  const souKotsus = decomp.mentsuList
    .filter((m) => (m.type === 'koutsu' || m.type === 'kantsu') && m.suit === 'sou')
    .map((m) => getTileNumber(m.tiles[0]));

  for (const n of manKotsus) {
    if (pinKotsus.includes(n) && souKotsus.includes(n)) return true;
  }
  return false;
}

/** 一気通貫判定: 同一スーツで1-2-3, 4-5-6, 7-8-9の順子 */
function checkIttsu(decomp: HandDecomposition): boolean {
  for (const suit of ['man', 'pin', 'sou'] as const) {
    const shuntsus = decomp.mentsuList
      .filter((m) => m.type === 'shuntsu' && m.suit === suit)
      .map((m) => getTileNumber(m.tiles[0]));
    if (shuntsus.includes(1) && shuntsus.includes(4) && shuntsus.includes(7)) return true;
  }
  return false;
}

/** 対々和判定: 全面子が刻子/槓子 */
function checkToitoi(decomp: HandDecomposition): boolean {
  return decomp.mentsuList.every((m) => m.type === 'koutsu' || m.type === 'kantsu');
}

/** 三暗刻判定: 暗刻が3組以上 */
function checkSananko(decomp: HandDecomposition, context: YakuContext): boolean {
  // ロンアガリの場合、アガリ牌の面子は明刻として扱う
  let ankoCount = 0;
  for (const m of decomp.mentsuList) {
    if (m.type !== 'koutsu') continue;

    // ロンアガリで、この刻子がアガリ牌を含む場合は明刻
    if (!context.isTsumo && m.tiles.includes(context.winTile)) {
      // シャンポン待ちのロンは明刻扱い
      continue;
    }
    ankoCount++;
  }
  return ankoCount >= 3;
}

/** 混全帯么九（チャンタ）判定: 全面子と雀頭に幺九牌が含まれ、字牌も含む */
function checkChanta(decomp: HandDecomposition): boolean {
  // 全面子に幺九牌が含まれる
  for (const m of decomp.mentsuList) {
    if (!m.tiles.some(isYaochuTile)) return false;
  }
  // 雀頭も幺九牌
  if (!isYaochuTile(decomp.jantou.tile)) return false;

  // 字牌が1枚以上含まれる（純チャンとの区別）
  const allTiles = [
    ...decomp.mentsuList.flatMap((m) => m.tiles),
    decomp.jantou.tile,
  ];
  return allTiles.some(isZipai);
}

/** 純全帯么九（純チャン）判定: 全面子と雀頭に幺九牌が含まれ、字牌なし */
function checkJunchan(decomp: HandDecomposition): boolean {
  // 全面子に幺九牌が含まれる
  for (const m of decomp.mentsuList) {
    if (!m.tiles.some(isYaochuTile)) return false;
  }
  // 雀頭も幺九牌
  if (!isYaochuTile(decomp.jantou.tile)) return false;

  // 字牌は含まれない（純チャン）
  const allTiles = [
    ...decomp.mentsuList.flatMap((m) => m.tiles),
    decomp.jantou.tile,
  ];
  if (allTiles.some(isZipai)) return false;

  // 順子が1組以上（対々との区別）
  return decomp.mentsuList.some((m) => m.type === 'shuntsu');
}

/** 混一色（ホンイツ）判定: 1種のスーツ数牌＋字牌のみ */
function checkHonitsu(decomp: HandDecomposition): boolean {
  const allTiles = [
    ...decomp.mentsuList.flatMap((m) => m.tiles),
    decomp.jantou.tile,
  ];
  const suits = new Set(allTiles.map((t) => getSuit(t)).filter((s) => s !== null));
  if (suits.size !== 1) return false;
  return allTiles.some(isZipai);
}

/** 清一色（チンイツ）判定: 全て1種のスーツ数牌のみ */
function checkChinitsu(decomp: HandDecomposition): boolean {
  const allTiles = [
    ...decomp.mentsuList.flatMap((m) => m.tiles),
    decomp.jantou.tile,
  ];
  if (allTiles.some(isZipai)) return false;
  const suits = new Set(allTiles.map((t) => getSuit(t)));
  return suits.size === 1;
}

/** 小三元判定: 三元牌の刻子2組＋雀頭1組 */
function checkShosangen(decomp: HandDecomposition): boolean {
  const dragonIds = ['dragon1', 'dragon2', 'dragon3'];
  const dragonKotsus = decomp.mentsuList.filter(
    (m) => (m.type === 'koutsu' || m.type === 'kantsu') && dragonIds.includes(m.tiles[0]),
  ).length;
  const jantouIsDragon = dragonIds.includes(decomp.jantou.tile);
  return dragonKotsus === 2 && jantouIsDragon;
}

/** 混老頭判定: 全牌が幺九牌（字牌＋数牌の端牌）で順子なし */
function checkHonroto(decomp: HandDecomposition): boolean {
  const allTiles = [
    ...decomp.mentsuList.flatMap((m) => m.tiles),
    decomp.jantou.tile,
  ];
  return allTiles.every(isYaochuTile) && decomp.mentsuList.every((m) => m.type !== 'shuntsu');
}

/** 役牌判定: 三元牌/場風/自風の刻子・槓子 */
function checkYakuhai(
  decomp: HandDecomposition,
  context: YakuContext,
): YakuName[] {
  const results: YakuName[] = [];

  for (const m of decomp.mentsuList) {
    if (m.type !== 'koutsu' && m.type !== 'kantsu') continue;
    const tileId = m.tiles[0];

    if (tileId === roundWindToTileId(context.roundWind)) {
      results.push('yakuhai-round');
    }
    if (tileId === seatWindToTileId(context.seatWind)) {
      results.push('yakuhai-seat');
    }
    if (tileId === 'dragon1') results.push('yakuhai-haku');
    if (tileId === 'dragon2') results.push('yakuhai-hatsu');
    if (tileId === 'dragon3') results.push('yakuhai-chun');
  }

  // 場風と自風が同じ場合（東場・東家など）は重複排除
  return [...new Set(results)];
}

// ============================================================
// 七対子判定
// ============================================================

function checkChiitoitsu(tileIds: string[]): boolean {
  if (tileIds.length !== 14) return false;

  const countMap = new Map<string, number>();
  for (const id of tileIds) {
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  // 7種類の対子
  let pairCount = 0;
  for (const [, cnt] of countMap.entries()) {
    if (cnt === 2) pairCount++;
  }
  return pairCount === 7;
}

// ============================================================
// 翻数計算ヘルパー
// ============================================================

function calcHanForDecomp(
  decomp: HandDecomposition,
  context: YakuContext,
  yakuList: Yaku[],
): number {
  return yakuList.reduce((sum, yaku) => {
    const han = context.isOpen ? (yaku.hanOpen ?? 0) : yaku.han;
    return sum + han;
  }, 0);
}

// ============================================================
// 役判定のメイン関数（1つの分解パターンに対して）
// ============================================================

function detectYakuForDecomp(
  decomp: HandDecomposition,
  context: YakuContext,
): Yaku[] {
  const yaku: Yaku[] = [];

  if (checkTanyao(decomp)) yaku.push(YAKU_DEFINITIONS.tanyao);
  if (checkPinfu(decomp, context)) yaku.push(YAKU_DEFINITIONS.pinfu);

  // 一盃口と二盃口は排他
  if (checkRyanpeiko(decomp, context)) {
    yaku.push(YAKU_DEFINITIONS.ryanpeiko);
  } else if (checkIipeiko(decomp, context)) {
    yaku.push(YAKU_DEFINITIONS.iipeiko);
  }

  if (checkSanshokuJuntsu(decomp)) yaku.push(YAKU_DEFINITIONS['sanshoku-juntsu']);
  if (checkSanshokuDoko(decomp)) yaku.push(YAKU_DEFINITIONS['sanshoku-doko']);
  if (checkIttsu(decomp)) yaku.push(YAKU_DEFINITIONS.ittsu);
  if (checkToitoi(decomp)) yaku.push(YAKU_DEFINITIONS.toitoi);
  if (checkSananko(decomp, context)) yaku.push(YAKU_DEFINITIONS.sananko);

  // 純チャンとチャンタは排他（純チャンが上位）
  if (checkJunchan(decomp)) {
    yaku.push(YAKU_DEFINITIONS.junchan);
  } else if (checkChanta(decomp)) {
    yaku.push(YAKU_DEFINITIONS.chanta);
  }

  // 清一色と混一色は排他（清一色が上位）
  if (checkChinitsu(decomp)) {
    yaku.push(YAKU_DEFINITIONS.chinitsu);
  } else if (checkHonitsu(decomp)) {
    yaku.push(YAKU_DEFINITIONS.honitsu);
  }

  if (checkShosangen(decomp)) yaku.push(YAKU_DEFINITIONS.shosangen);
  if (checkHonroto(decomp)) yaku.push(YAKU_DEFINITIONS.honroto);

  for (const yakuName of checkYakuhai(decomp, context)) {
    yaku.push(YAKU_DEFINITIONS[yakuName]);
  }

  return yaku;
}

// ============================================================
// 公開 API
// ============================================================

/**
 * 14枚の手牌から役を判定し、最も翻数の高い構成を返す。
 *
 * @param tileIds  14枚の手牌IDリスト（副露あり時は残り手牌 + アガリ牌）
 * @param context  役判定に必要な状況情報
 * @param fixedMentsu 副露面子（固定面子）
 * @returns YakuResult
 */
export function detectYaku(tileIds: string[], context: YakuContext, fixedMentsu: Mentsu[] = []): YakuResult {
  // 通常形: 全分解パターンを試す（七対子よりも先に試し、より高翻数なら通常形を優先）
  const decomps = getAllDecompositions(tileIds, fixedMentsu);

  let bestYakuNormal: Yaku[] = [];
  let bestHanNormal = -1; // -1 は「まだ分解なし」を示す
  let bestDecomp: HandDecomposition | null = null;

  for (const decomp of decomps) {
    const yaku = detectYakuForDecomp(decomp, context);
    const han = calcHanForDecomp(decomp, context, yaku);

    // 初回分解か、より高翻数の場合に採用（役なし=0翻でも分解を記録する）
    if (han > bestHanNormal) {
      bestHanNormal = han;
      bestYakuNormal = yaku;
      bestDecomp = decomp;
    }
  }

  // bestHanNormal が -1 のままなら分解なし
  if (bestHanNormal === -1) bestHanNormal = 0;

  // 七対子チェック（面子分解とは独立）
  if (checkChiitoitsu(tileIds)) {
    const chiitoitsuYaku = [YAKU_DEFINITIONS.chiitoitsu];

    // 七対子にも他の役（タンヤオ等）が乗ることがある
    // 七対子は面子分解不要なので、全牌で確認
    const additionalYaku: Yaku[] = [];
    const allTiles = tileIds;

    // タンヤオ（全牌中張）
    if (allTiles.every(isTanyaoTile)) {
      additionalYaku.push(YAKU_DEFINITIONS.tanyao);
    }

    // 混一色/清一色
    if (allTiles.every((t) => !isZipai(t))) {
      const suits = new Set(allTiles.map(getSuit).filter(Boolean));
      if (suits.size === 1) {
        additionalYaku.push(YAKU_DEFINITIONS.chinitsu);
      }
    } else {
      const suits = new Set(allTiles.filter((t) => !isZipai(t)).map(getSuit).filter(Boolean));
      if (suits.size === 1) {
        additionalYaku.push(YAKU_DEFINITIONS.honitsu);
      }
    }

    const totalHanChiitoi = [...chiitoitsuYaku, ...additionalYaku].reduce(
      (sum, y) => sum + (context.isOpen ? (y.hanOpen ?? 0) : y.han),
      0,
    );

    // 通常形より七対子の方が翻数が高い場合のみ七対子を採用
    if (totalHanChiitoi > bestHanNormal) {
      const situationalYakuChiitoi = detectSituationalYaku(context);
      const situationalHanChiitoi = situationalYakuChiitoi.reduce(
        (sum, y) => sum + (context.isOpen ? (y.hanOpen ?? 0) : y.han),
        0,
      );
      return {
        yaku: [...chiitoitsuYaku, ...additionalYaku, ...situationalYakuChiitoi],
        totalHan: totalHanChiitoi + situationalHanChiitoi,
        decomposition: null,
        isChiitoitsu: true,
      };
    }
  }

  // Sprint 6: 状況役を追加（門前役の最良構成に上乗せ）
  const situationalYaku = detectSituationalYaku(context);
  const situationalHan = situationalYaku.reduce(
    (sum, y) => sum + (context.isOpen ? (y.hanOpen ?? 0) : y.han),
    0,
  );

  return {
    yaku: [...bestYakuNormal, ...situationalYaku],
    totalHan: bestHanNormal + situationalHan,
    decomposition: bestDecomp,
    isChiitoitsu: false,
  };
}

// ============================================================
// Sprint 6: 状況役判定
// ============================================================

/**
 * 状況役（リーチ・一発・門前清自摸和・嶺上開花・海底・河底）を判定する。
 * これらはコンテキストフラグのみで決まり、手牌の分解には依存しない。
 */
function detectSituationalYaku(context: YakuContext): Yaku[] {
  const yaku: Yaku[] = [];

  // リーチ系（門前限定）
  if (context.isRiichi && !context.isOpen) {
    if (context.isDoubleRiichi) {
      // ダブルリーチ（2翻）: 通常リーチの代わりに付く
      yaku.push(YAKU_DEFINITIONS['double-riichi']);
    } else {
      yaku.push(YAKU_DEFINITIONS.riichi);
    }

    // 一発（リーチ/ダブルリーチON時のみ）
    if (context.isIppatsu) {
      yaku.push(YAKU_DEFINITIONS.ippatsu);
    }
  }

  // 門前清自摸和（門前ツモ）
  if (context.isTsumo && !context.isOpen && !context.isRinshan) {
    yaku.push(YAKU_DEFINITIONS['menzen-tsumo']);
  }

  // 嶺上開花（ツモ限定）
  if (context.isRinshan && context.isTsumo) {
    yaku.push(YAKU_DEFINITIONS.rinshan);
  }

  // 海底撈月（ツモ限定）
  if (context.isHaitei && context.isTsumo && !context.isRinshan) {
    yaku.push(YAKU_DEFINITIONS.haitei);
  }

  // 河底撈魚（ロン限定）
  if (context.isHoutei && !context.isTsumo) {
    yaku.push(YAKU_DEFINITIONS.houtei);
  }

  return yaku;
}
