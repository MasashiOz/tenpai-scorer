// 親/子
export type PlayerPosition = 'dealer' | 'non-dealer';

// 場風
export type RoundWind = 'east' | 'south';

// 自風
export type SeatWind = 'east' | 'south' | 'west' | 'north';

// ドラ表示牌（牌IDで管理）
export type DoraIndicator = string; // e.g., "man5", "wind1"

// 状況設定
export interface SituationState {
  playerPosition: PlayerPosition;
  roundWind: RoundWind;
  seatWind: SeatWind;
  doraIndicators: DoraIndicator[]; // ドラ表示牌のリスト（最大4枚）
  // Sprint 6: 状況役トグル
  isRiichi: boolean;          // リーチ
  isDoubleRiichi: boolean;    // ダブルリーチ（リーチON時に選択可）
  isIppatsu: boolean;         // 一発（リーチON時のみ有効）
  isHaitei: boolean;          // 海底撈月（ツモ限定）
  isHoutei: boolean;          // 河底撈魚（ロン限定）
  // Sprint 6: 裏ドラ表示牌（リーチON時のみ有効）
  uraDoraIndicators: DoraIndicator[]; // 裏ドラ表示牌（最大4枚）
  // 本場数（0〜10）
  honba: number;
}

// 実ドラ情報
export interface DoraInfo {
  indicator: string; // 表示牌ID
  dora: string;      // 実ドラID
  indicatorLabel: string;
  doraLabel: string;
}

export const DEFAULT_SITUATION: SituationState = {
  playerPosition: 'non-dealer',
  roundWind: 'east',
  seatWind: 'east',
  doraIndicators: [],
  isRiichi: false,
  isDoubleRiichi: false,
  isIppatsu: false,
  isHaitei: false,
  isHoutei: false,
  uraDoraIndicators: [],
  honba: 0,
};

export const MAX_DORA_INDICATORS = 4;
export const MAX_URA_DORA_INDICATORS = 4;
export const MAX_HONBA = 10;
