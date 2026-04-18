'use client';

import React, { useState } from 'react';
import { Meld, MeldType, MELD_TYPE_LABELS } from '@/types/meld';
import { ALL_TILES, TILE_LABELS } from '@/data/tiles';
import { Tile } from '@/types/tile';
import { TileButton } from './TileButton';
import { tileIdToKey } from '@/lib/tenpai';

interface MeldPanelProps {
  melds: Meld[];
  onAddMeld: (type: MeldType, tiles: string[]) => { success: boolean; reason?: string };
  onRemoveMeld: (id: string) => void;
  /** 残り使用可能枚数（副露追加可能かどうかの判定用） */
  canAddMeld: boolean;
}

// 副露タイプのボタン設定
const MELD_TYPE_OPTIONS: { type: MeldType; label: string; colorClass: string; count: number }[] = [
  { type: 'chi', label: 'チー', colorClass: 'bg-green-100 text-green-700 border-green-400', count: 3 },
  { type: 'pon', label: 'ポン', colorClass: 'bg-blue-100 text-blue-700 border-blue-400', count: 3 },
  { type: 'minkan', label: '明槓', colorClass: 'bg-orange-100 text-orange-700 border-orange-400', count: 4 },
  { type: 'ankan', label: '暗槓', colorClass: 'bg-purple-100 text-purple-700 border-purple-400', count: 4 },
  { type: 'kakan', label: '加槓', colorClass: 'bg-pink-100 text-pink-700 border-pink-400', count: 4 },
];

const SUIT_ORDER = ['man', 'pin', 'sou', 'wind', 'dragon'] as const;
const SUIT_LABELS_MAP: Record<string, string> = {
  man: '萬子', pin: '筒子', sou: '索子', wind: '風牌', dragon: '三元牌',
};

function getSuit(tileId: string): string {
  if (tileId.startsWith('man')) return 'man';
  if (tileId.startsWith('pin')) return 'pin';
  if (tileId.startsWith('sou')) return 'sou';
  if (tileId.startsWith('wind')) return 'wind';
  return 'dragon';
}

function getMeldColorClass(type: MeldType): string {
  const option = MELD_TYPE_OPTIONS.find((o) => o.type === type);
  return option?.colorClass ?? '';
}

function formatMeldTiles(meld: Meld): string {
  return meld.tiles.map((id) => TILE_LABELS[id] ?? id).join('・');
}

interface MeldPickerProps {
  meldType: MeldType;
  selectedTiles: string[];
  onTileClick: (tileId: string) => void;
  requiredCount: number;
}

const MeldPicker: React.FC<MeldPickerProps> = ({ meldType, selectedTiles, onTileClick, requiredCount }) => {
  const isChii = meldType === 'chi';

  const groups = SUIT_ORDER
    .filter((suit) => {
      // チーは数牌のみ
      if (isChii) return ['man', 'pin', 'sou'].includes(suit);
      // ポン・槓は全て
      return true;
    })
    .map((suit) => ({
      label: SUIT_LABELS_MAP[suit],
      tiles: ALL_TILES.filter((t) => t.suit === suit),
    }));

  const selectedCountMap = new Map<string, number>();
  for (const id of selectedTiles) {
    selectedCountMap.set(id, (selectedCountMap.get(id) ?? 0) + 1);
  }

  return (
    <div className="mt-2 p-3 border border-indigo-200 rounded-lg bg-indigo-50">
      <div className="text-xs font-medium text-indigo-700 mb-2">
        {MELD_TYPE_LABELS[meldType]}する牌を選択 ({selectedTiles.length}/{requiredCount}枚)
      </div>
      <div className="space-y-1.5">
        {groups.map(({ label, tiles }) => (
          <div key={label}>
            <div className="text-xs text-gray-400 mb-0.5">{label}</div>
            <div className="flex flex-wrap gap-1">
              {tiles.map((tile) => {
                const selCount = selectedCountMap.get(tile.id) ?? 0;
                const isSelected = selCount > 0;
                return (
                  <div key={tile.id} className="relative">
                    <TileButton
                      tile={tile}
                      onClick={() => onTileClick(tile.id)}
                      size="sm"
                      variant="palette"
                    />
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center font-bold pointer-events-none">
                        {selCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MeldPanel: React.FC<MeldPanelProps> = ({
  melds,
  onAddMeld,
  onRemoveMeld,
  canAddMeld,
}) => {
  const [activeMeldType, setActiveMeldType] = useState<MeldType | null>(null);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const requiredCount = MELD_TYPE_OPTIONS.find((o) => o.type === activeMeldType)?.count ?? 3;

  const handleMeldTypeClick = (type: MeldType) => {
    if (activeMeldType === type) {
      // 同じボタンで閉じる
      setActiveMeldType(null);
      setSelectedTiles([]);
      setError(null);
    } else {
      setActiveMeldType(type);
      setSelectedTiles([]);
      setError(null);
    }
  };

  const handleTileClick = (tileId: string) => {
    if (!activeMeldType) return;
    if (selectedTiles.length >= requiredCount) return;

    const newSelected = [...selectedTiles, tileId];
    setSelectedTiles(newSelected);

    if (newSelected.length === requiredCount) {
      // 自動確定
      const result = onAddMeld(activeMeldType, newSelected);
      if (result.success) {
        setActiveMeldType(null);
        setSelectedTiles([]);
        setError(null);
      } else {
        setError(result.reason ?? 'エラーが発生しました');
        setSelectedTiles([]);
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const handleCancelPicker = () => {
    setActiveMeldType(null);
    setSelectedTiles([]);
    setError(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-600">副露（鳴き）</h2>
        {melds.length > 0 && (
          <span className="text-xs text-gray-400">{melds.length}面子</span>
        )}
      </div>

      {/* 副露一覧 */}
      {melds.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {melds.map((meld) => (
            <div
              key={meld.id}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium ${getMeldColorClass(meld.type)}`}
            >
              <span className="font-bold">[{MELD_TYPE_LABELS[meld.type]}]</span>
              <span>{formatMeldTiles(meld)}</span>
              <button
                type="button"
                onClick={() => onRemoveMeld(meld.id)}
                className="ml-1 text-gray-500 hover:text-red-600 transition-colors"
                title="削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {melds.length === 0 && (
        <div className="text-xs text-gray-400 italic mb-3">副露なし（門前）</div>
      )}

      {/* 副露追加ボタン */}
      {canAddMeld && (
        <div className="flex flex-wrap gap-1.5">
          {MELD_TYPE_OPTIONS.map(({ type, label, colorClass }) => {
            const isActive = activeMeldType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleMeldTypeClick(type)}
                className={`
                  text-xs px-3 py-1.5 rounded-lg border-2 font-medium transition-all
                  ${isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : `${colorClass} hover:opacity-80`
                  }
                `}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {!canAddMeld && melds.length === 0 && (
        <div className="text-xs text-gray-400">手牌が満杯のため副露を追加できません</div>
      )}

      {error && (
        <div className="mt-2 text-xs text-red-500">{error}</div>
      )}

      {/* 牌選択パレット */}
      {activeMeldType && (
        <>
          <MeldPicker
            meldType={activeMeldType}
            selectedTiles={selectedTiles}
            onTileClick={handleTileClick}
            requiredCount={requiredCount}
          />
          <button
            type="button"
            onClick={handleCancelPicker}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            ▲ キャンセル
          </button>
        </>
      )}
    </div>
  );
};
