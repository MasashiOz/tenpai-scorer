'use client';

import { useCallback, useRef, useEffect } from 'react';
import { Meld, MeldType } from '@/types/meld';
import { tileIdToKey } from '@/lib/tenpai';
import { useLocalStorage } from './useLocalStorage';

let nextMeldId = 0;

function getSuit(tileId: string): string {
  if (tileId.startsWith('man')) return 'man';
  if (tileId.startsWith('pin')) return 'pin';
  if (tileId.startsWith('sou')) return 'sou';
  if (tileId.startsWith('wind')) return 'wind';
  return 'dragon';
}

export interface UseMeldReturn {
  melds: Meld[];
  /** 副露を追加する */
  addMeld: (type: MeldType, tiles: string[]) => { success: boolean; reason?: string };
  /** 副露を削除する */
  removeMeld: (id: string) => void;
  /** 副露を全クリア */
  clearMelds: () => void;
  /** 全副露牌の合計枚数（手牌上限計算用） */
  totalMeldTileCount: number;
  /** 副露が存在するかどうか（門前フラグ用） */
  isOpen: boolean;
  /** カン副露数（手牌上限+1用） */
  kanCount: number;
}

export function useMeld(): UseMeldReturn {
  // Sprint 9: LocalStorage で副露を永続化
  const [melds, setMelds] = useLocalStorage<Meld[]>('tenpai-scorer-melds', []);

  // リストア時に nextMeldId を最大値より大きい値に設定
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && melds.length > 0) {
      const maxId = Math.max(...melds.map((m) => {
        const num = parseInt(m.id.replace('meld-', ''), 10);
        return isNaN(num) ? 0 : num;
      }));
      nextMeldId = maxId + 1;
      initialized.current = true;
    }
  }, [melds]);

  const totalMeldTileCount = melds.reduce((sum, m) => sum + m.tiles.length, 0);
  const isOpen = melds.some((m) => m.type !== 'ankan');
  const kanCount = melds.filter((m) => m.type === 'minkan' || m.type === 'ankan' || m.type === 'kakan').length;

  const addMeld = useCallback(
    (type: MeldType, tiles: string[]): { success: boolean; reason?: string } => {
      // 枚数チェック
      const expectedCount = type === 'pon' || type === 'chi' ? 3 : 4;
      if (tiles.length !== expectedCount) {
        return { success: false, reason: `${type === 'pon' || type === 'chi' ? '3枚' : '4枚'}選択してください` };
      }

      // ポン・刻子: 全て同じ牌か
      if (type === 'pon' || type === 'minkan' || type === 'ankan' || type === 'kakan') {
        if (!tiles.every((t) => t === tiles[0])) {
          return { success: false, reason: '同じ牌を選択してください' };
        }
      }

      // チー: 数牌の連続3枚か
      if (type === 'chi') {
        const suit = getSuit(tiles[0]);
        if (!['man', 'pin', 'sou'].includes(suit)) {
          return { success: false, reason: 'チーは数牌のみ可能です' };
        }
        if (!tiles.every((t) => getSuit(t) === suit)) {
          return { success: false, reason: 'チーは同一スーツの牌を選択してください' };
        }
        const nums = tiles.map((t) => tileIdToKey(t) % 10 || (tileIdToKey(t) - (suit === 'man' ? 0 : suit === 'pin' ? 10 : 20))).sort((a, b) => a - b);
        // 実際のキーで判断
        const keys = tiles.map((t) => tileIdToKey(t)).sort((a, b) => a - b);
        if (keys[1] !== keys[0] + 1 || keys[2] !== keys[0] + 2) {
          return { success: false, reason: 'チーは連続する3枚の数牌を選択してください' };
        }
      }

      const suit = getSuit(tiles[0]);
      const meld: Meld = {
        id: `meld-${nextMeldId++}`,
        type,
        tiles: type === 'chi' ? [...tiles].sort((a, b) => tileIdToKey(a) - tileIdToKey(b)) : tiles,
        suit,
        isAnkan: type === 'ankan',
      };

      setMelds((prev) => [...prev, meld]);
      return { success: true };
    },
    [],
  );

  const removeMeld = useCallback((id: string) => {
    setMelds((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clearMelds = useCallback(() => {
    setMelds([]);
  }, []);

  return {
    melds,
    addMeld,
    removeMeld,
    clearMelds,
    totalMeldTileCount,
    isOpen,
    kanCount,
  };
}
