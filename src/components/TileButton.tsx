'use client';

import React from 'react';
import { Tile } from '@/types/tile';
import { TILE_LABELS, AKA_DORA_LABELS, TILE_SVG, isAkaDora } from '@/data/tiles';

interface TileButtonProps {
  tile: Tile;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'palette' | 'hand' | 'result';
  count?: number; // 手牌内の現在枚数（パレット表示用）
  className?: string;
}

// サイズ定義: SVG牌画像に合わせた寸法（縦長比率 約1:1.4）
const SIZE_CLASSES: Record<string, { w: string; h: string }> = {
  sm: { w: 'w-7',  h: 'h-10' },
  md: { w: 'w-9',  h: 'h-12' },
  lg: { w: 'w-11', h: 'h-[60px]' },
};

export const TileButton: React.FC<TileButtonProps> = ({
  tile,
  onClick,
  disabled = false,
  size = 'md',
  variant = 'palette',
  count,
  className = '',
}) => {
  const isAka = isAkaDora(tile.id);
  const label = isAka ? AKA_DORA_LABELS[tile.id] : TILE_LABELS[tile.id];
  const svgSrc = TILE_SVG[tile.id];
  const { w, h } = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  const interactiveClasses = disabled
    ? 'opacity-40 cursor-not-allowed'
    : 'hover:brightness-90 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:translate-y-0 active:shadow-sm active:brightness-95';

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={[
        'relative inline-flex items-center justify-center',
        'rounded border border-gray-300 shadow-sm',
        'transition-all duration-100 select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
        w, h,
        interactiveClasses,
        className,
      ].join(' ')}
      title={`${label}${count !== undefined ? ` (${count}/4枚)` : ''}`}
      aria-label={label}
      type="button"
    >
      {svgSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={svgSrc}
          alt={label}
          className="w-full h-full object-contain drop-shadow-sm"
          draggable={false}
        />
      ) : (
        <span className="text-xs font-bold text-gray-700">{label}</span>
      )}
      {variant === 'hand' && (
        <span className="sr-only">削除</span>
      )}
    </button>
  );
};
