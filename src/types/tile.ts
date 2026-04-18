// 牌のスーツ（種類）
export type Suit = 'man' | 'pin' | 'sou' | 'wind' | 'dragon';

// 牌の番号
// man/pin/sou: 1-9
// wind: 1=東, 2=南, 3=西, 4=北
// dragon: 1=白, 2=發, 3=中
export type TileNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// 牌の定義
export interface Tile {
  suit: Suit;
  number: TileNumber;
  id: string; // 一意ID (例: "man1", "pin5", "wind1", "dragon3")
}

// 手牌内の牌（インデックス付き）
export interface HandTile extends Tile {
  handIndex: number; // 手牌内での位置
}

// 手牌の状態
export interface HandState {
  tiles: HandTile[];
  maxTiles: number; // 通常14
}
