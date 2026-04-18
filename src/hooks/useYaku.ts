'use client';

import { useMemo } from 'react';
import { HandTile } from '@/types/tile';
import { SituationState } from '@/types/situation';
import { detectYaku } from '@/lib/yaku';
import { calcFu, FuResult } from '@/lib/fu';
import { calcScore, calcYakumanScore, ScoreResult } from '@/lib/score';
import { YakuContext, YakuResult, Yaku, Mentsu } from '@/types/yaku';
import { getDoraFromIndicator } from '@/lib/dora';
import { YAKU_DEFINITIONS } from '@/lib/yaku';
import { Meld } from '@/types/meld';
import { detectYakuman, normalizeAkaDoraId } from '@/lib/yakuman';
import { isAkaDora } from '@/data/tiles';

export interface AgariInfo {
  yakuResult: YakuResult;
  fuResult: FuResult;
  scoreResult: ScoreResult;
  /** Sprint 8: 役満フラグ */
  isYakuman?: boolean;
  /** Sprint 8: 役満ラベル（役満時のみ設定） */
  yakumanLabels?: string[];
}

export interface WaitYakuInfo {
  tileId: string;
  /** ロンアガリ情報 */
  ron: AgariInfo;
  /** ツモアガリ情報 */
  tsumo: AgariInfo;
  /** 嶺上開花アガリ情報（Sprint 6） */
  rinshan: AgariInfo;
  /** 後方互換性: 旧 ronResult（Sprint 4 の YakuResult） */
  ronResult: YakuResult;
  /** 後方互換性: 旧 tsumoResult */
  tsumoResult: YakuResult;
}

export interface UseYakuReturn {
  /** 各待ち牌の役判定・符・点数結果リスト */
  waitYakuList: WaitYakuInfo[];
}

/**
 * 副露（Meld）を YakuResult 用の Mentsu 型に変換する
 */
export function meldsToMentsu(melds: Meld[]): Mentsu[] {
  return melds.map((meld): Mentsu => {
    const suit = meld.suit;
    let type: Mentsu['type'];
    if (meld.type === 'chi') {
      type = 'shuntsu';
    } else if (meld.type === 'pon') {
      type = 'koutsu';
    } else {
      // minkan / ankan / kakan
      type = 'kantsu';
    }
    return {
      type,
      tiles: meld.tiles,
      suit,
      isOpen: !meld.isAnkan,
    };
  });
}

/**
 * ドラ表示牌リストから手牌中のドラ枚数を計算し、翻数として返す。
 * Sprint 8: 赤ドラは通常牌として扱う（man5r → man5）
 */
function countDoraHan(tileIds: string[], doraIndicators: string[]): number {
  const doraIds = doraIndicators.map(getDoraFromIndicator);
  let count = 0;
  for (const rawTileId of tileIds) {
    // 赤ドラを通常牌に正規化してドラ判定
    const tileId = normalizeAkaDoraId(rawTileId);
    for (const doraId of doraIds) {
      if (tileId === doraId) count++;
    }
  }
  return count;
}

/**
 * Sprint 8: 赤ドラ枚数を計算する
 */
function countAkaDoraHan(tileIds: string[]): number {
  return tileIds.filter(isAkaDora).length;
}

/**
 * 裏ドラ翻数を計算する（リーチON時のみ）
 */
function countUraDoraHan(tileIds: string[], uraDoraIndicators: string[], isRiichi: boolean): number {
  if (!isRiichi) return 0;
  return countDoraHan(tileIds, uraDoraIndicators);
}

/**
 * ドラ役を Yaku[] として生成する。
 * Sprint 8: dora/uradora/akadora の YakuName を使用
 */
function buildDoraYaku(doraHan: number, uraDoraHan: number, akaDoraHan: number = 0): Yaku[] {
  const result: Yaku[] = [];
  if (doraHan > 0) {
    result.push({
      name: 'dora',
      label: `ドラ${doraHan}`,
      han: doraHan,
      hanOpen: doraHan,
    });
  }
  if (uraDoraHan > 0) {
    result.push({
      name: 'uradora',
      label: `裏${uraDoraHan}`,
      han: uraDoraHan,
      hanOpen: uraDoraHan,
    });
  }
  if (akaDoraHan > 0) {
    result.push({
      name: 'akadora',
      label: `赤ドラ${akaDoraHan}`,
      han: akaDoraHan,
      hanOpen: akaDoraHan,
    });
  }
  return result;
}

/**
 * 聴牌手牌と待ち牌リストから、各待ち牌でのアガリ役・符・点数を計算する。
 * Sprint 6: リーチ・一発・門前清自摸・嶺上開花・海底・河底・裏ドラ対応
 * Sprint 7: 副露対応
 * Sprint 8: 赤ドラ・役満対応
 */
export function useYaku(
  hand: HandTile[],
  waits: string[],
  situation: SituationState,
  melds: Meld[] = [],
): UseYakuReturn {
  const waitYakuList = useMemo((): WaitYakuInfo[] => {
    // 副露あり: 残り手牌は面子数ベースで計算（カン副露でも正しく10枚になる）
    // melds.length が副露面子数（カンも1面子としてカウント）
    const meldFaceCount = melds.length;
    const requiredHandCount = 13 - meldFaceCount * 3;

    if (waits.length === 0 || hand.length !== requiredHandCount) return [];

    const handTileIds = hand.map((t) => t.id);
    const isDealer = situation.playerPosition === 'dealer';

    // 副露面子を Mentsu 型に変換
    const fixedMentsu = meldsToMentsu(melds);

    // 副露があれば isOpen = true
    // ただし暗槓のみの場合は門前扱い
    const hasOpenMeld = melds.some((m) => m.type !== 'ankan');

    return waits.map((waitTileId) => {
      // アガリ時の手牌: 残り手牌 + アガリ牌（副露牌は別途 fixedMentsu として渡す）
      const agariHand = [...handTileIds, waitTileId];
      // ドラカウント用: 副露牌も含む全手牌
      const allAgariTileIds = [...agariHand, ...melds.flatMap((m) => m.tiles)];

      // Sprint 8: ドラ翻数計算（通常ドラ + 赤ドラ）
      const doraHan = countDoraHan(allAgariTileIds, situation.doraIndicators);
      const uraDoraHan = countUraDoraHan(allAgariTileIds, situation.uraDoraIndicators, situation.isRiichi);
      const akaDoraHan = countAkaDoraHan(allAgariTileIds); // Sprint 8: 赤ドラ
      const doraYaku = buildDoraYaku(doraHan, uraDoraHan, akaDoraHan);
      const doraTotalHan = doraHan + uraDoraHan + akaDoraHan;

      // 副露があればリーチ・一発は無効
      const effectiveRiichi = hasOpenMeld ? false : situation.isRiichi;
      const effectiveIppatsu = hasOpenMeld ? false : situation.isIppatsu;

      const effectiveDoubleRiichi = hasOpenMeld ? false : situation.isDoubleRiichi;

      // ロンコンテキスト
      const ronCtx: YakuContext = {
        seatWind: situation.seatWind,
        roundWind: situation.roundWind,
        isOpen: hasOpenMeld,
        winTile: waitTileId,
        isTsumo: false,
        isRiichi: effectiveRiichi,
        isDoubleRiichi: effectiveDoubleRiichi,
        isIppatsu: effectiveIppatsu,
        isHaitei: false,
        isHoutei: situation.isHoutei,
        isRinshan: false,
      };

      // ツモコンテキスト
      const tsumoCtx: YakuContext = {
        ...ronCtx,
        isTsumo: true,
        isHoutei: false,
        isHaitei: situation.isHaitei,
      };

      // 嶺上開花コンテキスト（明槓後のツモアガリ）
      const rinshankCtx: YakuContext = {
        ...tsumoCtx,
        isRinshan: true,
        isHaitei: false, // 嶺上開花と海底は同時に付かない
      };

      // Sprint 8: 役満判定（通常役より先にチェック）
      // 役満判定用に赤ドラを正規化した手牌を使用
      const normalizedAgariHand = agariHand.map((id) => normalizeAkaDoraId(id));
      const ronYakuman = detectYakuman(normalizedAgariHand, ronCtx, fixedMentsu);
      const tsumoYakuman = detectYakuman(normalizedAgariHand, tsumoCtx, fixedMentsu);
      const rinshankYakuman = detectYakuman(normalizedAgariHand, rinshankCtx, fixedMentsu);

      const honba = situation.honba ?? 0;

      // ヘルパー: 役満アガリ情報を構築
      const buildYakumanAgari = (
        yakumanResult: typeof ronYakuman,
        ctx: YakuContext,
        isTsumoFlag: boolean,
      ): AgariInfo => {
        const score = calcYakumanScore(yakumanResult!, isDealer, isTsumoFlag, honba);
        // 役満用ダミーYakuResult（役名表示に使う）
        const dummyYakuResult: YakuResult = {
          yaku: [],
          totalHan: score.han,
          decomposition: null,
          isChiitoitsu: false,
        };
        return {
          yakuResult: dummyYakuResult,
          fuResult: { items: [], rawFu: 0, fu: 0 },
          scoreResult: score,
          isYakuman: true,
          yakumanLabels: yakumanResult!.entries.map((e) => e.label),
        };
      };

      // ロンが役満の場合
      if (ronYakuman) {
        const ronAgari = buildYakumanAgari(ronYakuman, ronCtx, false);
        const tsumoAgari = tsumoYakuman
          ? buildYakumanAgari(tsumoYakuman, tsumoCtx, true)
          : buildYakumanAgari(ronYakuman, tsumoCtx, true); // ツモ点数も役満として表示
        const rinshankAgari = rinshankYakuman
          ? buildYakumanAgari(rinshankYakuman, rinshankCtx, true)
          : buildYakumanAgari(ronYakuman, rinshankCtx, true);

        // 後方互換性用ダミーYakuResult
        const dummyYakuResult: YakuResult = {
          yaku: [],
          totalHan: ronAgari.scoreResult.han,
          decomposition: null,
          isChiitoitsu: false,
        };
        return {
          tileId: waitTileId,
          ron: ronAgari,
          tsumo: tsumoAgari,
          rinshan: rinshankAgari,
          ronResult: dummyYakuResult,
          tsumoResult: dummyYakuResult,
        };
      }

      // 通常役の計算（役満でない場合）
      const ronYaku = detectYaku(agariHand, ronCtx, fixedMentsu);
      const tsumoYaku = detectYaku(agariHand, tsumoCtx, fixedMentsu);
      const rinshankYaku = detectYaku(agariHand, rinshankCtx, fixedMentsu);

      // ドラを加算した最終 YakuResult
      const ronYakuWithDora: YakuResult = {
        ...ronYaku,
        yaku: [...ronYaku.yaku, ...doraYaku],
        totalHan: ronYaku.totalHan + doraTotalHan,
      };
      const tsumoYakuWithDora: YakuResult = {
        ...tsumoYaku,
        yaku: [...tsumoYaku.yaku, ...doraYaku],
        totalHan: tsumoYaku.totalHan + doraTotalHan,
      };
      // 嶺上開花でもドラ・裏ドラは有効
      const rinshankYakuWithDora: YakuResult = {
        ...rinshankYaku,
        yaku: [...rinshankYaku.yaku, ...doraYaku],
        totalHan: rinshankYaku.totalHan + doraTotalHan,
      };

      const ronFu = calcFu(ronYakuWithDora, ronCtx);
      const tsumoFu = calcFu(tsumoYakuWithDora, tsumoCtx);
      const rinshankFu = calcFu(rinshankYakuWithDora, rinshankCtx);

      const ronScore = calcScore(ronYakuWithDora.totalHan, ronFu, isDealer, false, honba);
      const tsumoScore = calcScore(tsumoYakuWithDora.totalHan, tsumoFu, isDealer, true, honba);
      const rinshankScore = calcScore(rinshankYakuWithDora.totalHan, rinshankFu, isDealer, true, honba);

      return {
        tileId: waitTileId,
        ron: { yakuResult: ronYakuWithDora, fuResult: ronFu, scoreResult: ronScore },
        tsumo: { yakuResult: tsumoYakuWithDora, fuResult: tsumoFu, scoreResult: tsumoScore },
        rinshan: { yakuResult: rinshankYakuWithDora, fuResult: rinshankFu, scoreResult: rinshankScore },
        // 後方互換性
        ronResult: ronYakuWithDora,
        tsumoResult: tsumoYakuWithDora,
      };
    });
  }, [hand, waits, situation, melds]);

  return { waitYakuList };
}
