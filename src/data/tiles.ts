import { Tile, Suit, TileNumber } from '@/types/tile';

// 全34種類の牌を定義
export const ALL_TILES: Tile[] = [
  // ※ 赤ドラ（man5r/pin5r/sou5r）は別途 AKA_DORA_TILES で定義
  // 萬子 (man) 1-9
  ...([1, 2, 3, 4, 5, 6, 7, 8, 9] as TileNumber[]).map((n) => ({
    suit: 'man' as Suit,
    number: n,
    id: `man${n}`,
  })),
  // 筒子 (pin) 1-9
  ...([1, 2, 3, 4, 5, 6, 7, 8, 9] as TileNumber[]).map((n) => ({
    suit: 'pin' as Suit,
    number: n,
    id: `pin${n}`,
  })),
  // 索子 (sou) 1-9
  ...([1, 2, 3, 4, 5, 6, 7, 8, 9] as TileNumber[]).map((n) => ({
    suit: 'sou' as Suit,
    number: n,
    id: `sou${n}`,
  })),
  // 字牌 - 風牌: 東南西北
  { suit: 'wind' as Suit, number: 1 as TileNumber, id: 'wind1' }, // 東
  { suit: 'wind' as Suit, number: 2 as TileNumber, id: 'wind2' }, // 南
  { suit: 'wind' as Suit, number: 3 as TileNumber, id: 'wind3' }, // 西
  { suit: 'wind' as Suit, number: 4 as TileNumber, id: 'wind4' }, // 北
  // 字牌 - 三元牌: 白發中
  { suit: 'dragon' as Suit, number: 1 as TileNumber, id: 'dragon1' }, // 白
  { suit: 'dragon' as Suit, number: 2 as TileNumber, id: 'dragon2' }, // 發
  { suit: 'dragon' as Suit, number: 3 as TileNumber, id: 'dragon3' }, // 中
];

// 牌の表示名
export const TILE_LABELS: Record<string, string> = {
  man1: '1萬', man2: '2萬', man3: '3萬', man4: '4萬', man5: '5萬',
  man6: '6萬', man7: '7萬', man8: '8萬', man9: '9萬',
  pin1: '1筒', pin2: '2筒', pin3: '3筒', pin4: '4筒', pin5: '5筒',
  pin6: '6筒', pin7: '7筒', pin8: '8筒', pin9: '9筒',
  sou1: '1索', sou2: '2索', sou3: '3索', sou4: '4索', sou5: '5索',
  sou6: '6索', sou7: '7索', sou8: '8索', sou9: '9索',
  wind1: '東', wind2: '南', wind3: '西', wind4: '北',
  dragon1: '白', dragon2: '發', dragon3: '中',
};

// スーツの表示名
export const SUIT_LABELS: Record<Suit, string> = {
  man: '萬子',
  pin: '筒子',
  sou: '索子',
  wind: '風牌',
  dragon: '三元牌',
};

// Sprint 8: 赤ドラ牌（各スーツの5に1枚ずつ）
export const AKA_DORA_TILES: Tile[] = [
  { suit: 'man' as Suit, number: 5 as TileNumber, id: 'man5r' }, // 赤五萬
  { suit: 'pin' as Suit, number: 5 as TileNumber, id: 'pin5r' }, // 赤五筒
  { suit: 'sou' as Suit, number: 5 as TileNumber, id: 'sou5r' }, // 赤五索
];

// 赤ドラの表示名
export const AKA_DORA_LABELS: Record<string, string> = {
  man5r: '赤5萬',
  pin5r: '赤5筒',
  sou5r: '赤5索',
};

// 牌の絵文字マッピング
export const TILE_EMOJI: Record<string, string> = {
  man1: '🀇', man2: '🀈', man3: '🀉', man4: '🀊', man5: '🀋',
  man6: '🀌', man7: '🀍', man8: '🀎', man9: '🀏',
  pin1: '🀙', pin2: '🀚', pin3: '🀛', pin4: '🀜', pin5: '🀝',
  pin6: '🀞', pin7: '🀟', pin8: '🀠', pin9: '🀡',
  sou1: '🀐', sou2: '🀑', sou3: '🀒', sou4: '🀓', sou5: '🀔',
  sou6: '🀕', sou7: '🀖', sou8: '🀗', sou9: '🀘',
  wind1: '🀀', wind2: '🀁', wind3: '🀂', wind4: '🀃',
  dragon1: '🀆', dragon2: '🀅', dragon3: '🀄',
  man5r: '🀋', pin5r: '🀝', sou5r: '🀔',
};

// SVG牌画像のパスマッピング（/public/tiles/ 以下）
export const TILE_SVG: Record<string, string> = {
  man1: '/tiles/Man1.svg', man2: '/tiles/Man2.svg', man3: '/tiles/Man3.svg',
  man4: '/tiles/Man4.svg', man5: '/tiles/Man5.svg', man6: '/tiles/Man6.svg',
  man7: '/tiles/Man7.svg', man8: '/tiles/Man8.svg', man9: '/tiles/Man9.svg',
  pin1: '/tiles/Pin1.svg', pin2: '/tiles/Pin2.svg', pin3: '/tiles/Pin3.svg',
  pin4: '/tiles/Pin4.svg', pin5: '/tiles/Pin5.svg', pin6: '/tiles/Pin6.svg',
  pin7: '/tiles/Pin7.svg', pin8: '/tiles/Pin8.svg', pin9: '/tiles/Pin9.svg',
  sou1: '/tiles/Sou1.svg', sou2: '/tiles/Sou2.svg', sou3: '/tiles/Sou3.svg',
  sou4: '/tiles/Sou4.svg', sou5: '/tiles/Sou5.svg', sou6: '/tiles/Sou6.svg',
  sou7: '/tiles/Sou7.svg', sou8: '/tiles/Sou8.svg', sou9: '/tiles/Sou9.svg',
  wind1: '/tiles/Ton.svg',  wind2: '/tiles/Nan.svg',
  wind3: '/tiles/Shaa.svg', wind4: '/tiles/Pei.svg',
  dragon1: '/tiles/Haku.svg', dragon2: '/tiles/Hatsu.svg', dragon3: '/tiles/Chun.svg',
  // 赤ドラ専用SVG
  man5r: '/tiles/Man5-Dora.svg', pin5r: '/tiles/Pin5-Dora.svg', sou5r: '/tiles/Sou5-Dora.svg',
};

// 牌のカウント（最大枚数）
export const MAX_TILE_COUNT = 4;
export const MAX_HAND_SIZE = 14;

/** 赤ドラか判定 */
export const isAkaDora = (tileId: string): boolean =>
  tileId === 'man5r' || tileId === 'pin5r' || tileId === 'sou5r';

/** 赤ドラの通常牌IDを返す */
export const getAkaDoraBaseId = (tileId: string): string => {
  if (tileId === 'man5r') return 'man5';
  if (tileId === 'pin5r') return 'pin5';
  if (tileId === 'sou5r') return 'sou5';
  return tileId;
};

// 牌IDから牌オブジェクトを取得（赤ドラも含む）
export const getTileById = (id: string): Tile | undefined =>
  ALL_TILES.find((t) => t.id === id) ?? AKA_DORA_TILES.find((t) => t.id === id);

// 手牌内の同一牌の枚数をカウント
export const countTileInHand = (handTileIds: string[], tileId: string): number =>
  handTileIds.filter((id) => id === tileId).length;
