'use client';

import React, { useState } from 'react';
import { SituationState, PlayerPosition, RoundWind, SeatWind, MAX_DORA_INDICATORS, MAX_URA_DORA_INDICATORS, MAX_HONBA } from '@/types/situation';
import { ALL_TILES, TILE_LABELS, TILE_SVG } from '@/data/tiles';
import { buildDoraInfoList } from '@/lib/dora';
import { TileButton } from './TileButton';
import { Tile } from '@/types/tile';

interface SituationPanelProps {
  situation: SituationState;
  onPlayerPositionChange: (pos: PlayerPosition) => void;
  onRoundWindChange: (wind: RoundWind) => void;
  onSeatWindChange: (wind: SeatWind) => void;
  onAddDoraIndicator: (tileId: string) => { success: boolean; reason?: string };
  onRemoveDoraIndicator: (index: number) => void;
  // Sprint 6: 状況役
  onRiichiChange: (value: boolean) => void;
  onDoubleRiichiChange: (value: boolean) => void;
  onIppatsuChange: (value: boolean) => void;
  onHaiteiChange: (value: boolean) => void;
  onHouteiChange: (value: boolean) => void;
  // Sprint 6: 裏ドラ
  onAddUraDoraIndicator: (tileId: string) => { success: boolean; reason?: string };
  onRemoveUraDoraIndicator: (index: number) => void;
  onHonbaChange: (honba: number) => void;
  onReset: () => void;
  // Sprint 7: 副露ありかどうか（リーチを無効化するため）
  isOpen?: boolean;
}

const ROUND_WIND_OPTIONS: { value: RoundWind; label: string }[] = [
  { value: 'east', label: '東場' },
  { value: 'south', label: '南場' },
];

const SEAT_WIND_OPTIONS: { value: SeatWind; label: string }[] = [
  { value: 'east', label: '東家' },
  { value: 'south', label: '南家' },
  { value: 'west', label: '西家' },
  { value: 'north', label: '北家' },
];

export const SituationPanel: React.FC<SituationPanelProps> = ({
  situation,
  onPlayerPositionChange,
  onRoundWindChange,
  onSeatWindChange,
  onAddDoraIndicator,
  onRemoveDoraIndicator,
  onRiichiChange,
  onDoubleRiichiChange,
  onIppatsuChange,
  onHaiteiChange,
  onHouteiChange,
  onAddUraDoraIndicator,
  onRemoveUraDoraIndicator,
  onHonbaChange,
  onReset,
  isOpen = false,
}) => {
  const [showDoraPicker, setShowDoraPicker] = useState(false);
  const [showUraDoraPicker, setShowUraDoraPicker] = useState(false);
  const [doraError, setDoraError] = useState<string | null>(null);
  const [uraDoraError, setUraDoraError] = useState<string | null>(null);

  const doraInfoList = buildDoraInfoList(situation.doraIndicators);
  const uraDoraInfoList = buildDoraInfoList(situation.uraDoraIndicators);
  const canAddDora = situation.doraIndicators.length < MAX_DORA_INDICATORS;
  const canAddUraDora = situation.uraDoraIndicators.length < MAX_URA_DORA_INDICATORS;

  const handleDoraIndicatorClick = (tileId: string) => {
    const result = onAddDoraIndicator(tileId);
    if (!result.success) {
      setDoraError(result.reason ?? 'エラーが発生しました');
      setTimeout(() => setDoraError(null), 2000);
    } else {
      setDoraError(null);
      if (situation.doraIndicators.length + 1 >= MAX_DORA_INDICATORS) {
        setShowDoraPicker(false);
      }
    }
  };

  const handleUraDoraIndicatorClick = (tileId: string) => {
    const result = onAddUraDoraIndicator(tileId);
    if (!result.success) {
      setUraDoraError(result.reason ?? 'エラーが発生しました');
      setTimeout(() => setUraDoraError(null), 2000);
    } else {
      setUraDoraError(null);
      if (situation.uraDoraIndicators.length + 1 >= MAX_URA_DORA_INDICATORS) {
        setShowUraDoraPicker(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      {/* ヘッダー行 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-600">状況設定</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300 transition-colors"
        >
          リセット
        </button>
      </div>

      {/* 本場 */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-1.5 font-medium">本場</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onHonbaChange(situation.honba - 1)}
            disabled={situation.honba <= 0}
            className="w-8 h-8 rounded-lg border-2 border-gray-300 text-gray-600 font-bold text-lg flex items-center justify-center hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            −
          </button>
          <span className="w-10 text-center font-bold text-lg text-gray-800">
            {situation.honba}
          </span>
          <button
            type="button"
            onClick={() => onHonbaChange(situation.honba + 1)}
            disabled={situation.honba >= MAX_HONBA}
            className="w-8 h-8 rounded-lg border-2 border-gray-300 text-gray-600 font-bold text-lg flex items-center justify-center hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ＋
          </button>
          <span className="text-xs text-gray-400">（0〜{MAX_HONBA}本場）</span>
          {situation.honba > 0 && (
            <span className="text-xs text-amber-600 font-medium">
              +{situation.honba * 300}点
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 左列: 親/子、場風、自風 */}
        <div className="space-y-3">
          {/* 親/子トグル */}
          <div>
            <div className="text-xs text-gray-500 mb-1.5 font-medium">プレイヤー</div>
            <div className="flex gap-1.5">
              {(['dealer', 'non-dealer'] as PlayerPosition[]).map((pos) => {
                const isActive = situation.playerPosition === pos;
                const label = pos === 'dealer' ? '親' : '子';
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => onPlayerPositionChange(pos)}
                    className={`
                      px-4 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all
                      ${isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'}
                    `}
                  >
                    {label}
                    {isActive && (
                      <span className="ml-1 text-xs">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 場風 */}
          <div>
            <div className="text-xs text-gray-500 mb-1.5 font-medium">場風</div>
            <div className="flex gap-1.5">
              {ROUND_WIND_OPTIONS.map(({ value, label }) => {
                const isActive = situation.roundWind === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onRoundWindChange(value)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all
                      ${isActive
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400 hover:text-purple-600'}
                    `}
                  >
                    {label}
                    {isActive && (
                      <span className="ml-1 text-xs">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 自風 */}
          <div>
            <div className="text-xs text-gray-500 mb-1.5 font-medium">自風</div>
            <div className="flex gap-1.5 flex-wrap">
              {SEAT_WIND_OPTIONS.map(({ value, label }) => {
                const isActive = situation.seatWind === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onSeatWindChange(value)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all
                      ${isActive
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400 hover:text-teal-600'}
                    `}
                  >
                    {label}
                    {isActive && (
                      <span className="ml-1 text-xs">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sprint 6: 状況役トグル */}
          <div>
            <div className="text-xs text-gray-500 mb-1.5 font-medium">状況役</div>
            <div className="flex flex-wrap gap-1.5">
              {/* リーチ（副露ありの場合は無効） */}
              <ToggleButton
                label="リーチ"
                active={situation.isRiichi}
                disabled={isOpen}
                onClick={() => !isOpen && onRiichiChange(!situation.isRiichi)}
                colorClass="bg-red-600 border-red-600 text-white"
                hoverClass="hover:border-red-400 hover:text-red-600"
              />

              {/* ダブルリーチ（リーチONのみ有効） */}
              <ToggleButton
                label="Wリーチ"
                active={situation.isDoubleRiichi}
                disabled={!situation.isRiichi || isOpen}
                onClick={() => situation.isRiichi && !isOpen && onDoubleRiichiChange(!situation.isDoubleRiichi)}
                colorClass="bg-rose-700 border-rose-700 text-white"
                hoverClass="hover:border-rose-500 hover:text-rose-700"
              />

              {/* 一発（リーチONのみ有効） */}
              <ToggleButton
                label="一発"
                active={situation.isIppatsu}
                disabled={!situation.isRiichi || isOpen}
                onClick={() => situation.isRiichi && !isOpen && onIppatsuChange(!situation.isIppatsu)}
                colorClass="bg-orange-500 border-orange-500 text-white"
                hoverClass="hover:border-orange-400 hover:text-orange-600"
              />

              {/* 海底 */}
              <ToggleButton
                label="海底"
                active={situation.isHaitei}
                onClick={() => onHaiteiChange(!situation.isHaitei)}
                colorClass="bg-blue-600 border-blue-600 text-white"
                hoverClass="hover:border-blue-400 hover:text-blue-600"
              />

              {/* 河底 */}
              <ToggleButton
                label="河底"
                active={situation.isHoutei}
                onClick={() => onHouteiChange(!situation.isHoutei)}
                colorClass="bg-cyan-600 border-cyan-600 text-white"
                hoverClass="hover:border-cyan-400 hover:text-cyan-600"
              />
            </div>
            {isOpen && (
              <p className="text-xs text-red-400 mt-1 font-medium">副露ありのためリーチ・一発は無効</p>
            )}
            {!isOpen && !situation.isRiichi && (
              <p className="text-xs text-gray-400 mt-1">一発はリーチON時のみ有効</p>
            )}
          </div>
        </div>

        {/* 右列: ドラ表示牌 + 裏ドラ */}
        <div className="space-y-4">
          {/* 通常ドラ */}
          <div>
            <div className="text-xs text-gray-500 mb-1.5 font-medium">
              ドラ表示牌
              <span className="ml-1 text-gray-400">({situation.doraIndicators.length}/{MAX_DORA_INDICATORS}枚)</span>
            </div>

            {doraInfoList.length === 0 ? (
              <div className="text-xs text-gray-400 italic mb-2">ドラ表示牌が設定されていません</div>
            ) : (
              <div className="space-y-1.5 mb-2">
                {doraInfoList.map((info, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 w-4 text-right">{index + 1}.</span>
                    <DoraDisplayTile tileId={info.indicator} label={info.indicatorLabel} variant="indicator" />
                    <span className="text-gray-400 text-xs">→</span>
                    <DoraDisplayTile tileId={info.dora} label={info.doraLabel} variant="dora" />
                    <button
                      type="button"
                      onClick={() => onRemoveDoraIndicator(index)}
                      className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors px-1 py-0.5 rounded"
                      title="削除"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {canAddDora && (
              <button
                type="button"
                onClick={() => setShowDoraPicker((prev) => !prev)}
                className={`
                  text-xs px-3 py-1.5 rounded-lg border-2 font-medium transition-all w-full
                  ${showDoraPicker
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-orange-600 border-orange-400 hover:bg-orange-50'}
                `}
              >
                {showDoraPicker ? '▲ 閉じる' : '＋ ドラ表示牌を追加'}
              </button>
            )}

            {doraError && (
              <div className="mt-1 text-xs text-red-500">{doraError}</div>
            )}

            {showDoraPicker && (
              <DoraPicker onSelect={handleDoraIndicatorClick} />
            )}
          </div>

          {/* 裏ドラ表示牌（リーチON時のみ） */}
          {situation.isRiichi && (
            <div>
              <div className="text-xs text-gray-500 mb-1.5 font-medium">
                裏ドラ表示牌
                <span className="ml-1 text-gray-400">({situation.uraDoraIndicators.length}/{MAX_URA_DORA_INDICATORS}枚)</span>
                <span className="ml-1 text-red-500 font-bold">リーチON</span>
              </div>

              {uraDoraInfoList.length === 0 ? (
                <div className="text-xs text-gray-400 italic mb-2">裏ドラ表示牌が設定されていません</div>
              ) : (
                <div className="space-y-1.5 mb-2">
                  {uraDoraInfoList.map((info, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400 w-4 text-right">{index + 1}.</span>
                      <DoraDisplayTile tileId={info.indicator} label={info.indicatorLabel} variant="indicator" />
                      <span className="text-gray-400 text-xs">→</span>
                      <DoraDisplayTile tileId={info.dora} label={info.doraLabel} variant="ura-dora" />
                      <button
                        type="button"
                        onClick={() => onRemoveUraDoraIndicator(index)}
                        className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors px-1 py-0.5 rounded"
                        title="削除"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {canAddUraDora && (
                <button
                  type="button"
                  onClick={() => setShowUraDoraPicker((prev) => !prev)}
                  className={`
                    text-xs px-3 py-1.5 rounded-lg border-2 font-medium transition-all w-full
                    ${showUraDoraPicker
                      ? 'bg-violet-500 text-white border-violet-500'
                      : 'bg-white text-violet-600 border-violet-400 hover:bg-violet-50'}
                  `}
                >
                  {showUraDoraPicker ? '▲ 閉じる' : '＋ 裏ドラ表示牌を追加'}
                </button>
              )}

              {uraDoraError && (
                <div className="mt-1 text-xs text-red-500">{uraDoraError}</div>
              )}

              {showUraDoraPicker && (
                <DoraPicker onSelect={handleUraDoraIndicatorClick} accentColor="violet" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------------
// トグルボタン（状況役用）
// -------------------------------------------------------------------
interface ToggleButtonProps {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  colorClass: string;
  hoverClass: string;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  label, active, disabled, onClick, colorClass, hoverClass,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`
      px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all
      ${disabled
        ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
        : active
          ? `${colorClass} shadow-sm`
          : `bg-white text-gray-600 border-gray-300 ${hoverClass}`
      }
    `}
  >
    {label}
    {active && !disabled && <span className="ml-1 text-xs">✓</span>}
  </button>
);

// -------------------------------------------------------------------
// ドラ表示牌 / 実ドラ を小さく表示するコンポーネント
// -------------------------------------------------------------------
interface DoraDisplayTileProps {
  tileId: string;
  label: string;
  variant: 'indicator' | 'dora' | 'ura-dora';
}

const DoraDisplayTile: React.FC<DoraDisplayTileProps> = ({ tileId, label, variant }) => {
  const isDora = variant === 'dora';
  const isUraDora = variant === 'ura-dora';
  const svgSrc = TILE_SVG[tileId];

  const ringClass = isUraDora
    ? 'ring-2 ring-violet-400 ring-offset-1 rounded'
    : isDora
      ? 'ring-2 ring-orange-400 ring-offset-1 rounded'
      : '';

  const titleText = isUraDora
    ? `裏ドラ: ${label}`
    : isDora
      ? `実ドラ: ${label}`
      : `表示牌: ${label}`;

  return (
    <div
      className={`inline-flex items-center justify-center w-8 h-11 ${ringClass}`}
      title={titleText}
    >
      {svgSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={svgSrc} alt={label} className="w-full h-full object-contain" draggable={false} />
      ) : (
        <span className="text-xs font-bold text-gray-700 bg-gray-100 border rounded px-1">{label}</span>
      )}
    </div>
  );
};

// -------------------------------------------------------------------
// ドラ表示牌選択パレット
// -------------------------------------------------------------------
interface DoraPickerProps {
  onSelect: (tileId: string) => void;
  accentColor?: 'orange' | 'violet';
}

type SuitGroup = {
  label: string;
  tiles: Tile[];
};

const SUIT_ORDER = ['man', 'pin', 'sou', 'wind', 'dragon'] as const;
const SUIT_LABELS_MAP: Record<string, string> = {
  man: '萬子', pin: '筒子', sou: '索子', wind: '風牌', dragon: '三元牌',
};

const DoraPicker: React.FC<DoraPickerProps> = ({ onSelect, accentColor = 'orange' }) => {
  const groups: SuitGroup[] = SUIT_ORDER.map((suit) => ({
    label: SUIT_LABELS_MAP[suit],
    tiles: ALL_TILES.filter((t) => t.suit === suit),
  }));

  const bgClass = accentColor === 'violet'
    ? 'bg-violet-50 border-violet-200'
    : 'bg-orange-50 border-orange-200';
  const textClass = accentColor === 'violet'
    ? 'text-violet-700'
    : 'text-orange-700';

  return (
    <div className={`mt-2 p-3 border rounded-lg ${bgClass}`}>
      <div className={`text-xs font-medium mb-2 ${textClass}`}>
        表示牌を選択してください
      </div>
      <div className="space-y-1.5">
        {groups.map(({ label, tiles }) => (
          <div key={label}>
            <div className="text-xs text-gray-400 mb-0.5">{label}</div>
            <div className="flex flex-wrap gap-1">
              {tiles.map((tile) => (
                <TileButton
                  key={tile.id}
                  tile={tile}
                  onClick={() => onSelect(tile.id)}
                  size="sm"
                  variant="palette"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
