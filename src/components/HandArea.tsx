'use client';

import React from 'react';
import { HandTile } from '@/types/tile';
import { MAX_HAND_SIZE, TILE_LABELS } from '@/data/tiles';
import { TileButton } from './TileButton';
import { getTileById } from '@/data/tiles';
import { Meld, MELD_TYPE_LABELS } from '@/types/meld';

interface HandAreaProps {
  hand: HandTile[];
  onTileRemove: (handIndex: number) => void;
  onClear: () => void;
  melds?: Meld[];
  meldTileCount?: number;
}

function getMeldColor(type: Meld['type']): string {
  switch (type) {
    case 'chi': return 'bg-green-50 border-green-300 text-green-700';
    case 'pon': return 'bg-blue-50 border-blue-300 text-blue-700';
    case 'minkan': return 'bg-orange-50 border-orange-300 text-orange-700';
    case 'ankan': return 'bg-purple-50 border-purple-300 text-purple-700';
    case 'kakan': return 'bg-pink-50 border-pink-300 text-pink-700';
  }
}

export const HandArea: React.FC<HandAreaProps> = ({
  hand,
  onTileRemove,
  onClear,
  melds = [],
  meldTileCount = 0,
}) => {
  const totalTiles = hand.length + meldTileCount;
  const remaining = MAX_HAND_SIZE - totalTiles;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-600">手牌</h2>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium
              ${totalTiles === MAX_HAND_SIZE
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-500'}`}
          >
            {totalTiles}/{MAX_HAND_SIZE}枚
          </span>
          {melds.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 font-medium">
              副露{melds.length}面子
            </span>
          )}
        </div>
        <button
          onClick={onClear}
          disabled={hand.length === 0}
          className="text-xs px-3 py-1 rounded-lg bg-gray-100 text-gray-600
            hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors font-medium"
          type="button"
        >
          クリア
        </button>
      </div>

      {/* 手牌エリア */}
      <div
        className="min-h-[56px] bg-amber-50 border-2 border-dashed border-amber-200
          rounded-lg p-2 flex flex-wrap gap-1.5 items-center"
        role="region"
        aria-label="手牌エリア"
      >
        {hand.length === 0 ? (
          <span className="text-sm text-amber-300 font-medium mx-auto">
            パレットから牌を選んでください
          </span>
        ) : (
          hand.map((tile) => {
            const tileData = getTileById(tile.id);
            if (!tileData) return null;
            return (
              <div
                key={tile.handIndex}
                className="group relative"
                title="クリックで削除"
              >
                <TileButton
                  tile={tileData}
                  onClick={() => onTileRemove(tile.handIndex)}
                  size="lg"
                  variant="hand"
                />
                {/* 削除アイコン（ホバー時表示） */}
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white
                    rounded-full text-xs flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  aria-hidden="true"
                >
                  ×
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* 副露エリア（副露がある場合に表示） */}
      {melds.length > 0 && (
        <div className="mt-2 pt-2 border-t border-amber-200">
          <div className="text-xs text-gray-500 mb-1 font-medium">副露面子</div>
          <div className="flex flex-wrap gap-2">
            {melds.map((meld) => (
              <div
                key={meld.id}
                className={`flex items-center gap-0.5 px-2 py-1 rounded-lg border text-xs font-medium ${getMeldColor(meld.type)}`}
              >
                <span className="font-bold mr-1">[{MELD_TYPE_LABELS[meld.type]}]</span>
                {meld.tiles.map((tileId, idx) => {
                  const tileData = getTileById(tileId);
                  if (!tileData) return <span key={idx}>{TILE_LABELS[tileId] ?? tileId}</span>;
                  return (
                    <TileButton
                      key={idx}
                      tile={tileData}
                      size="sm"
                      variant="hand"
                      disabled
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 残り枚数・満杯メッセージ */}
      {totalTiles > 0 && (
        <p className="mt-2 text-xs text-gray-400">
          {totalTiles === MAX_HAND_SIZE
            ? '手牌が満杯です（最大14枚）'
            : `あと${remaining}枚追加できます`}
        </p>
      )}
    </div>
  );
};
