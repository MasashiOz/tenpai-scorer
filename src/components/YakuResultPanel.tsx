'use client';

import React, { useState } from 'react';
import { TileButton } from './TileButton';
import { getTileById } from '@/data/tiles';
import { WaitYakuInfo, AgariInfo } from '@/hooks/useYaku';
import { FuItem } from '@/lib/fu';
import { ScoreResult, ScoreLevel } from '@/lib/score';

interface YakuResultPanelProps {
  waitYakuList: WaitYakuInfo[];
}

type DetailMode = 'ron' | 'tsumo' | 'rinshan';

export const YakuResultPanel: React.FC<YakuResultPanelProps> = ({ waitYakuList }) => {
  const [selectedWait, setSelectedWait] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<DetailMode>('ron');

  if (waitYakuList.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-600">役・点数結果</h2>
        <span className="text-xs text-gray-400">待ち牌をタップで詳細確認</span>
      </div>

      {/* 待ち牌ヘッダー（3列） */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full min-w-0 text-xs">
          <thead>
            <tr className="text-gray-500">
              <th className="text-left py-1 px-1 sm:px-2 w-12 sm:w-16">待ち牌</th>
              <th className="text-center py-1 px-1 sm:px-2 text-rose-600">ロン</th>
              <th className="text-center py-1 px-1 sm:px-2 text-blue-600">ツモ</th>
              <th className="text-center py-1 px-1 sm:px-2 text-emerald-600">嶺上</th>
            </tr>
          </thead>
          <tbody>
            {waitYakuList.map(({ tileId, ron, tsumo, rinshan }) => {
              const tile = getTileById(tileId);
              if (!tile) return null;
              const isSelected = selectedWait === tileId;

              return (
                <React.Fragment key={tileId}>
                  <tr
                    onClick={() => {
                      if (selectedWait === tileId) {
                        setSelectedWait(null);
                      } else {
                        setSelectedWait(tileId);
                        setDetailMode('ron');
                      }
                    }}
                    className={`
                      cursor-pointer transition-colors border-b border-gray-100
                      ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}
                    `}
                    aria-expanded={isSelected}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (selectedWait === tileId) {
                          setSelectedWait(null);
                        } else {
                          setSelectedWait(tileId);
                          setDetailMode('ron');
                        }
                      }
                    }}
                  >
                    <td className="py-1.5 px-1 sm:px-2">
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <div className={`ring-2 ring-offset-1 rounded ${isSelected ? 'ring-indigo-400' : 'ring-orange-400'}`}>
                          <TileButton tile={tile} size="sm" variant="result" disabled />
                        </div>
                        <span className={`text-xs transition-transform ml-0.5 ${isSelected ? 'rotate-180' : ''} text-gray-400`}>
                          ▼
                        </span>
                      </div>
                    </td>
                    <td className="py-1.5 px-1 sm:px-2 text-center">
                      <ScoreSummary agariInfo={ron} color="rose" />
                    </td>
                    <td className="py-1.5 px-1 sm:px-2 text-center">
                      <ScoreSummary agariInfo={tsumo} color="blue" />
                    </td>
                    <td className="py-1.5 px-1 sm:px-2 text-center">
                      <ScoreSummary agariInfo={rinshan} color="emerald" />
                    </td>
                  </tr>
                  {/* アコーディオン: 行の直下に詳細を展開 */}
                  {isSelected && (
                    <tr>
                      <td colSpan={4} className="p-0">
                        <AccordionDetail
                          tileId={tileId}
                          ron={ron}
                          tsumo={tsumo}
                          rinshan={rinshan}
                          detailMode={detailMode}
                          onModeChange={setDetailMode}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};

// ============================================================
// AccordionDetail（テーブル行内アコーディオン）
// ============================================================

const AccordionDetail: React.FC<{
  tileId: string;
  ron: AgariInfo;
  tsumo: AgariInfo;
  rinshan: AgariInfo;
  detailMode: DetailMode;
  onModeChange: (mode: DetailMode) => void;
}> = ({ tileId, ron, tsumo, rinshan, detailMode, onModeChange }) => {
  const tile = getTileById(tileId);

  const activeInfo = detailMode === 'ron' ? ron : detailMode === 'tsumo' ? tsumo : rinshan;

  return (
    <div className="border-b border-indigo-200 bg-indigo-50 p-3 space-y-3">
      {/* アガリ牌表示 */}
      {tile && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">アガリ牌:</span>
          <div className="ring-2 ring-orange-400 ring-offset-1 rounded">
            <TileButton tile={tile} size="sm" variant="result" disabled />
          </div>
        </div>
      )}

      {/* ロン/ツモ/嶺上 切り替えタブ */}
      <div className="flex gap-1 bg-white rounded-lg p-0.5 border border-gray-200">
        {([
          { mode: 'ron', label: 'ロン', color: 'rose' },
          { mode: 'tsumo', label: 'ツモ', color: 'blue' },
          { mode: 'rinshan', label: '嶺上', color: 'emerald' },
        ] as { mode: DetailMode; label: string; color: string }[]).map(({ mode, label, color }) => {
          const activeClasses: Record<string, string> = {
            rose: 'bg-rose-600 text-white shadow-sm',
            blue: 'bg-blue-600 text-white shadow-sm',
            emerald: 'bg-emerald-600 text-white shadow-sm',
          };
          return (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all
                ${detailMode === mode
                  ? activeClasses[color]
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 詳細コンテンツ */}
      <AgariDetailView info={activeInfo} mode={detailMode} />
    </div>
  );
};

// ============================================================
// 点数サマリ（テーブルセル用）
// ============================================================

const ScoreSummary: React.FC<{
  agariInfo: AgariInfo;
  color: 'rose' | 'blue' | 'emerald';
}> = ({ agariInfo, color }) => {
  const { yakuResult, scoreResult, isYakuman, yakumanLabels } = agariInfo;
  const hasYaku = isYakuman || yakuResult.totalHan > 0;

  const textColorClass: Record<string, string> = {
    rose: 'text-rose-600',
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
  };

  if (!hasYaku) {
    return <span className="text-gray-300 text-xs">無役</span>;
  }

  if (isYakuman && yakumanLabels) {
    return (
      <div className="flex flex-col items-center">
        <span className={`font-bold text-xs ${textColorClass[color]}`}>
          {scoreResult.total.toLocaleString()}点
        </span>
        <span className="text-xs font-bold text-yellow-600">役満</span>
      </div>
    );
  }

  return (
    <span className={`font-semibold text-xs ${textColorClass[color]}`}>
      {scoreResult.total.toLocaleString()}点
    </span>
  );
};

// ============================================================
// アガリ詳細ビュー（役 + 符 + 点数）
// ============================================================

const AgariDetailView: React.FC<{
  info: AgariInfo;
  mode: DetailMode;
}> = ({ info, mode }) => {
  const [showFuBreakdown, setShowFuBreakdown] = useState(false);

  const { yakuResult, fuResult, scoreResult, isYakuman, yakumanLabels } = info;

  const modeLabel = mode === 'ron' ? 'ロン' : mode === 'tsumo' ? 'ツモ' : '嶺上開花';

  // Sprint 8: 役満表示
  if (isYakuman && yakumanLabels) {
    return (
      <div className="space-y-3">
        {/* 役満バナー */}
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-black text-yellow-700">役満</span>
            {scoreResult.level === 'yakuman2' && (
              <span className="text-sm font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                ダブル役満
              </span>
            )}
            {(scoreResult.level === 'yakuman3' || scoreResult.level === 'yakuman4') && (
              <span className="text-sm font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                {scoreResult.level === 'yakuman3' ? 'トリプル役満' : '4倍役満'}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {yakumanLabels.map((label, i) => (
              <div key={i} className="flex items-center justify-between px-2 py-1 bg-white rounded border border-yellow-200">
                <span className="text-sm font-bold text-gray-800">{label}</span>
                <span className="text-sm font-bold text-yellow-700">役満</span>
              </div>
            ))}
          </div>
        </div>
        {/* 点数表示 */}
        <ScoreView scoreResult={scoreResult} mode={mode} />
      </div>
    );
  }

  if (yakuResult.yaku.length === 0) {
    return (
      <div className="text-center py-3">
        <p className="text-sm text-gray-400">
          {modeLabel}では役なし（フリテンや無役）
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 役リスト */}
      <div className="space-y-1">
        {yakuResult.yaku.map((yaku, i) => (
          <div
            key={`${yaku.name}-${i}`}
            className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-gray-100"
          >
            <span className="text-sm font-medium text-gray-700">{yaku.label}</span>
            <span className={`text-sm font-bold ${
              yaku.name === 'dora' || yaku.name === 'uradora' || yaku.name === 'akadora'
                ? 'text-orange-500'
                : 'text-indigo-600'
            }`}>
              {yaku.han}翻
            </span>
          </div>
        ))}
      </div>

      {/* 翻合計 + 符 */}
      <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-200">
        <span className="text-sm font-bold text-indigo-700">
          合計 {yakuResult.totalHan}翻 {fuResult.fu}符
        </span>
        <span className="text-sm text-indigo-500">
          {scoreResult.level !== 'normal' ? getLevelLabel(scoreResult.level) : ''}
        </span>
      </div>

      {/* 点数表示 */}
      <ScoreView scoreResult={scoreResult} mode={mode} />

      {/* 符内訳アコーディオン */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFuBreakdown((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-xs text-gray-600 font-medium transition-colors"
        >
          <span>符の内訳</span>
          <span className={`transition-transform ${showFuBreakdown ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {showFuBreakdown && (
          <div className="p-2 space-y-1">
            <FuBreakdownView items={fuResult.items} rawFu={fuResult.rawFu} fu={fuResult.fu} />
          </div>
        )}
      </div>

      {/* 七対子注記 */}
      {yakuResult.isChiitoitsu && (
        <p className="text-xs text-gray-400 text-center">七対子形（25符固定）</p>
      )}
    </div>
  );
};

// ============================================================
// 点数表示
// ============================================================

const ScoreView: React.FC<{
  scoreResult: ScoreResult;
  mode: DetailMode;
}> = ({ scoreResult, mode }) => {
  const modeLabel = mode === 'ron' ? 'ロン' : mode === 'tsumo' ? 'ツモ' : '嶺上開花';
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{modeLabel}点数</span>
        <span className="text-xl font-bold text-gray-800">
          {scoreResult.total.toLocaleString()}点
        </span>
      </div>
      {/* 支払い内訳（ツモ・嶺上は常に表示） */}
      {mode !== 'ron' && scoreResult.payments.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          {scoreResult.payments.map((p, i) => (
            <span key={i}>
              {p.label}: <span className="font-semibold">{p.amount.toLocaleString()}点</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// 符内訳表示
// ============================================================

const FuBreakdownView: React.FC<{
  items: FuItem[];
  rawFu: number;
  fu: number;
}> = ({ items, rawFu, fu }) => {
  if (items.length === 0) {
    return <p className="text-xs text-gray-400 text-center">内訳なし</p>;
  }

  const breakdownStr = items.map((item) => `${item.label}${item.fu}符`).join(' + ');
  const cutupNote = rawFu !== fu ? `= ${rawFu}符 → 切り上げ ${fu}符` : `= ${fu}符`;

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between text-xs px-2 py-1">
          <span className="text-gray-600">{item.label}</span>
          <span className="font-medium text-gray-800">+{item.fu}符</span>
        </div>
      ))}
      <div className="border-t border-gray-200 pt-1 px-2">
        <p className="text-xs text-gray-500 leading-relaxed">
          {breakdownStr} {cutupNote}
        </p>
      </div>
    </div>
  );
};

// ============================================================
// ヘルパー
// ============================================================

function getLevelLabel(level: ScoreLevel): string {
  const labels: Record<ScoreLevel, string> = {
    normal: '',
    mangan: '満貫',
    haneman: '跳満',
    baiman: '倍満',
    sanbaiman: '三倍満',
    yakuman: '数え役満',
    yakuman1: '役満',
    yakuman2: 'ダブル役満',
    yakuman3: 'トリプル役満',
    yakuman4: '4倍役満',
  };
  return labels[level] ?? '';
}
