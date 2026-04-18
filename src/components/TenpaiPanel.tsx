'use client';

import React from 'react';
import { TenpaiStatus } from '@/lib/tenpai';
import { getTileById } from '@/data/tiles';
import { TileButton } from './TileButton';

interface TenpaiPanelProps {
  canCheck: boolean;
  disabledReason: string | null;
  tenpaiResult: TenpaiStatus | null;
  onCheck: () => void;
  onClear: () => void;
}

export const TenpaiPanel: React.FC<TenpaiPanelProps> = ({
  canCheck,
  disabledReason,
  tenpaiResult,
  onCheck,
  onClear,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
      {/* ヘッダー行 */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-600">聴牌判定</h2>
        {tenpaiResult && (
          <button
            onClick={onClear}
            className="text-xs px-3 py-1 rounded-lg bg-gray-100 text-gray-500
              hover:bg-gray-200 transition-colors font-medium"
            type="button"
          >
            クリア
          </button>
        )}
      </div>

      {/* 聴牌ボタン */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onCheck}
          disabled={!canCheck}
          className={`w-full py-3 rounded-xl font-bold text-base transition-all duration-150
            ${canCheck
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-md cursor-pointer'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          type="button"
          aria-disabled={!canCheck}
        >
          聴牌判定する
        </button>

        {/* ボタン無効時の理由表示 */}
        {!canCheck && disabledReason && (
          <p className="text-xs text-gray-400">{disabledReason}</p>
        )}
      </div>

      {/* 判定結果 */}
      {tenpaiResult && (
        <div className="mt-2">
          {tenpaiResult.status === 'not-tenpai' ? (
            <NotTenpaiView reason={tenpaiResult.reason} />
          ) : (
            <TenpaiView waits={tenpaiResult.waits} />
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// ノーテン表示
// ============================================================
const NotTenpaiView: React.FC<{ reason: string }> = ({ reason }) => (
  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
    <span className="text-xl" aria-hidden="true">🀄</span>
    <div>
      <p className="text-sm font-bold text-gray-600">ノーテン</p>
      <p className="text-xs text-gray-400">{reason}</p>
    </div>
  </div>
);

// ============================================================
// 聴牌・待ち牌表示
// ============================================================
const TenpaiView: React.FC<{ waits: string[] }> = ({ waits }) => {
  return (
    <div className="space-y-3">
      {/* ステータスバナー */}
      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <span className="text-xl" aria-hidden="true">✅</span>
        <div>
          <p className="text-sm font-bold text-green-700">聴牌！</p>
          <p className="text-xs text-green-500">
            待ち牌 {waits.length}種類
          </p>
        </div>
      </div>

      {/* 待ち牌一覧 */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">待ち牌</p>
        <div className="flex flex-wrap gap-2">
          {waits.map((tileId) => {
            const tile = getTileById(tileId);
            if (!tile) return null;
            return (
              <div key={tileId} className="flex flex-col items-center gap-0.5">
                <div className="ring-2 ring-orange-400 ring-offset-1 rounded">
                  <TileButton
                    tile={tile}
                    size="lg"
                    variant="result"
                    disabled
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
