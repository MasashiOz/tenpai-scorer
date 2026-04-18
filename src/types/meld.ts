/**
 * 副露（鳴き）の型定義 (Sprint 7)
 */

export type MeldType = 'pon' | 'chi' | 'minkan' | 'ankan' | 'kakan';

/** 副露面子 */
export interface Meld {
  id: string;           // 一意ID
  type: MeldType;
  tiles: string[];      // 構成牌のIDリスト (pon: 3枚, chi: 3枚, minkan/ankan/kakan: 4枚)
  suit: string;         // スーツ
  /** 暗槓かどうか（符計算で暗槓扱いにするか） */
  isAnkan: boolean;
}

/** 副露の表示ラベル */
export const MELD_TYPE_LABELS: Record<MeldType, string> = {
  pon: 'ポン',
  chi: 'チー',
  minkan: '明槓',
  ankan: '暗槓',
  kakan: '加槓',
};
