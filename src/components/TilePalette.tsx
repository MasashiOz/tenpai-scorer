'use client';

import React from 'react';
import { ALL_TILES, SUIT_LABELS, AKA_DORA_TILES } from '@/data/tiles';
import { Suit } from '@/types/tile';
import { TileButton } from './TileButton';

interface TilePaletteProps {
  onTileClick: (tileId: string, suit: string, number: number) => void;
  getTileCount: (tileId: string) => number;
  canAddTile: (tileId: string) => boolean;
  /** 三人麻雀モードの場合 true（萬子2-8を薄表示） */
  is3P?: boolean;
}

const SUIT_ORDER: Suit[] = ['man', 'pin', 'sou', 'wind', 'dragon'];

export const TilePalette: React.FC<TilePaletteProps> = ({
  onTileClick,
  getTileCount,
  canAddTile,
  is3P = false,
}) => {
  // 三人麻雀では萬子2-8は通常使用しない（薄表示）
  const isUnused3P = (tileId: string) =>
    is3P && tileId.startsWith('man') && ['man2','man3','man4','man5','man6','man7','man8'].includes(tileId);
  const tilesBySuit = SUIT_ORDER.reduce<Record<Suit, typeof ALL_TILES>>(
    (acc, suit) => {
      acc[suit] = ALL_TILES.filter((t) => t.suit === suit);
      return acc;
    },
    {} as Record<Suit, typeof ALL_TILES>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h2 className="text-sm font-semibold text-gray-600 mb-3">牌パレット</h2>
      <div className="space-y-3">
        {SUIT_ORDER.map((suit) => (
          <div key={suit}>
            <div className="text-xs text-gray-400 mb-1">
              {SUIT_LABELS[suit]}
              {is3P && suit === 'man' && (
                <span className="ml-1 text-gray-300">（2〜8は三人麻雀では不使用）</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {tilesBySuit[suit].map((tile) => {
                const count = getTileCount(tile.id);
                const disabled = !canAddTile(tile.id);
                const unused = isUnused3P(tile.id);
                return (
                  <div key={tile.id} className={`relative ${unused ? 'opacity-30' : ''}`}>
                    <TileButton
                      tile={tile}
                      onClick={() => onTileClick(tile.id, tile.suit, tile.number)}
                      disabled={disabled}
                      size="md"
                      variant="palette"
                      count={count}
                    />
                    {count > 0 && (
                      <span
                        className={`absolute -top-1 -right-1 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold
                          ${count >= 4 ? 'bg-red-500 text-white' : 'bg-indigo-500 text-white'}`}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 赤ドラパレット */}
        <div>
          <div className="text-xs text-gray-400 mb-1">赤ドラ（各1枚まで）</div>
          <div className="flex flex-wrap gap-1">
            {AKA_DORA_TILES.map((tile) => {
              const count = getTileCount(tile.id);
              const disabled = !canAddTile(tile.id) || count >= 1;
              return (
                <div key={tile.id} className="relative">
                  <TileButton
                    tile={tile}
                    onClick={() => onTileClick(tile.id, tile.suit, tile.number)}
                    disabled={disabled}
                    size="md"
                    variant="palette"
                  />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold bg-red-500 text-white">
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            赤ドラは手牌に追加されると、ドラ1として自動加算されます
          </p>
        </div>
      </div>
    </div>
  );
};
