/**
 * 役（Yaku）の型定義
 */

import { SeatWind, RoundWind } from './situation';

// 役の識別子
export type YakuName =
  | 'tanyao'        // タンヤオ
  | 'pinfu'         // 平和
  | 'iipeiko'       // 一盃口
  | 'ryanpeiko'     // 二盃口
  | 'sanshoku-juntsu'  // 三色同順
  | 'sanshoku-doko'    // 三色同刻
  | 'ittsu'         // 一気通貫
  | 'toitoi'        // 対々和
  | 'sananko'       // 三暗刻
  | 'chiitoitsu'    // 七対子
  | 'chanta'        // 混全帯么九
  | 'junchan'       // 純全帯么九
  | 'honitsu'       // 混一色
  | 'chinitsu'      // 清一色
  | 'shosangen'     // 小三元
  | 'honroto'       // 混老頭
  | 'yakuhai-round' // 役牌（場風）
  | 'yakuhai-seat'  // 役牌（自風）
  | 'yakuhai-haku'  // 役牌（白）
  | 'yakuhai-hatsu' // 役牌（發）
  | 'yakuhai-chun'  // 役牌（中）
  // Sprint 6: 状況役（門前限定）
  | 'riichi'        // リーチ
  | 'double-riichi' // ダブルリーチ
  | 'ippatsu'       // 一発
  | 'menzen-tsumo'  // 門前清自摸和
  | 'rinshan'       // 嶺上開花
  | 'haitei'        // 海底撈月
  | 'houtei'        // 河底撈魚
  // Sprint 8: ドラ系（動的生成）
  | 'dora'          // ドラ
  | 'uradora'       // 裏ドラ
  | 'akadora'       // 赤ドラ
  // Sprint 8: 役満
  | 'kokushi'       // 国士無双（13面待ちはダブル役満）
  | 'suanko'        // 四暗刻（単騎はダブル役満）
  | 'daisangen'     // 大三元
  | 'shosushi'      // 小四喜
  | 'daisushi'      // 大四喜（ダブル役満）
  | 'tsuiso'        // 字一色
  | 'ryuiso'        // 緑一色
  | 'chinroto'      // 清老頭
  | 'churen'        // 九蓮宝燈（純正九蓮宝燈はダブル役満）
  | 'sukantsu';     // 四槓子

// 役情報
export interface Yaku {
  name: YakuName;
  label: string;    // 表示名（日本語）
  han: number;      // 翻数（門前時）
  hanOpen?: number; // 翻数（副露時。undefined の場合は門前専用役）
}

// 役判定に必要な情報
export interface YakuContext {
  seatWind: SeatWind;
  roundWind: RoundWind;
  isOpen: boolean;         // 副露あり（門前でない）
  winTile: string;         // アガリ牌のID
  isTsumo: boolean;        // ツモアガリか
  isRiichi?: boolean;        // リーチ
  isDoubleRiichi?: boolean;  // ダブルリーチ
  isIppatsu?: boolean;       // 一発
  isHaitei?: boolean;      // 海底撈月（ツモ限定）
  isHoutei?: boolean;      // 河底撈魚（ロン限定）
  isRinshan?: boolean;     // 嶺上開花
}

// 面子の種類
export type MentsuType = 'shuntsu' | 'koutsu' | 'kantsu';

// 分解された面子
export interface Mentsu {
  type: MentsuType;
  tiles: string[];   // 牌IDのリスト
  suit: string;      // スーツ (man/pin/sou/wind/dragon)
  isOpen?: boolean;  // 副露面子か（Sprint 7 で使用）
}

// 分解された雀頭
export interface Jantou {
  tile: string;     // 牌ID
  suit: string;
}

// 手牌の分解パターン
export interface HandDecomposition {
  mentsuList: Mentsu[];
  jantou: Jantou;
}

// 役判定結果
export interface YakuResult {
  yaku: Yaku[];
  totalHan: number;
  decomposition: HandDecomposition | null; // 採用した面子構成
  isChiitoitsu: boolean;  // 七対子アガリか
}

// Sprint 8: 役満結果
export type YakumanMultiplier = 1 | 2; // 1=役満, 2=ダブル役満

export interface YakumanEntry {
  name: YakuName;
  label: string;
  multiplier: YakumanMultiplier; // 役満倍率
}

export interface YakumanResult {
  isYakuman: true;
  entries: YakumanEntry[]; // 複合役満の場合は複数
  totalMultiplier: number;  // 合計倍率（1=役満、2=ダブル役満、3=トリプル役満等）
}

export interface NormalResult {
  isYakuman: false;
  yakuResult: YakuResult;
}

// 点数計算に渡す役判定結果の共用型
export type AgariResult = YakumanResult | NormalResult;
