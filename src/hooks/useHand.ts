'use client';

import { useCallback, useEffect, useRef } from 'react';
import { HandTile } from '@/types/tile';
import { MAX_TILE_COUNT, getAkaDoraBaseId } from '@/data/tiles';
import { useLocalStorage } from './useLocalStorage';

export interface UseHandReturn {
  hand: HandTile[];
  addTile: (tileId: string, suit: string, number: number) => { success: boolean; reason?: string };
  removeTile: (handIndex: number) => void;
  clearHand: () => void;
  getTileCount: (tileId: string) => number;
  canAddTile: (tileId: string) => boolean;
  getBaseTileCount: (tileId: string) => number;
}

let nextHandIndex = 0;

/**
 * 手牌管理フック
 * @param meldTileCount 副露牌の合計枚数
 * @param kanCount      カン副露の回数（1回につき上限+1）
 *
 * 手牌上限 = 13 + kanCount
 *   門前（カンなし）: 最大13枚
 *   カン1回: 最大10枚（嶺上牌分+1で合計14枚相当）
 *   カン2回: 最大7枚（合計15枚相当）
 *   カン3回: 最大4枚（合計16枚相当）
 *   カン4回: 最大1枚（合計17枚相当）
 */
export function useHand(meldTileCount: number = 0, kanCount: number = 0): UseHandReturn {
  const [hand, setHand] = useLocalStorage<HandTile[]>('tenpai-scorer-hand', []);

  // ref で常に最新値を保持 — stale closure を完全に回避
  const meldTileCountRef = useRef(meldTileCount);
  const kanCountRef = useRef(kanCount);
  meldTileCountRef.current = meldTileCount;
  kanCountRef.current = kanCount;

  // リストア時に nextHandIndex を最大値より大きい値に設定（重複防止）
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && hand.length > 0) {
      const maxIdx = Math.max(...hand.map((t) => t.handIndex));
      nextHandIndex = maxIdx + 1;
      initialized.current = true;
    }
  }, [hand]);

  const getTileCount = useCallback(
    (tileId: string): number => hand.filter((t) => t.id === tileId).length,
    [hand]
  );

  const getBaseTileCount = useCallback(
    (tileId: string): number => {
      const baseId = getAkaDoraBaseId(tileId);
      return hand.filter((t) => getAkaDoraBaseId(t.id) === baseId).length;
    },
    [hand]
  );

  /**
   * 追加可否チェック。
   * ref.current で最新の meldTileCount / kanCount を参照するため stale closure なし。
   */
  const canAddTile = useCallback(
    (tileId: string): boolean => {
      const maxHandTotal = 13 + kanCountRef.current;
      if (hand.length + meldTileCountRef.current >= maxHandTotal) return false;
      if (getBaseTileCount(tileId) >= MAX_TILE_COUNT) return false;
      return true;
    },
    [hand, getBaseTileCount]
  );

  /**
   * 牌を追加する。
   * ref.current で最新の上限を参照するため stale closure なし。
   */
  const addTile = useCallback(
    (tileId: string, suit: string, number: number): { success: boolean; reason?: string } => {
      const maxHandTotal = 13 + kanCountRef.current;
      if (hand.length + meldTileCountRef.current >= maxHandTotal) {
        return { success: false, reason: `手牌は最大${maxHandTotal}枚までです` };
      }
      if (getBaseTileCount(tileId) >= MAX_TILE_COUNT) {
        return { success: false, reason: `同一牌は最大${MAX_TILE_COUNT}枚までです` };
      }
      const newTile: HandTile = {
        id: tileId,
        suit: suit as HandTile['suit'],
        number: number as HandTile['number'],
        handIndex: nextHandIndex++,
      };
      setHand((prev) => [...prev, newTile]);
      return { success: true };
    },
    [hand, getBaseTileCount]
  );

  const removeTile = useCallback((handIndex: number) => {
    setHand((prev) => prev.filter((t) => t.handIndex !== handIndex));
  }, []);

  const clearHand = useCallback(() => {
    setHand([]);
  }, []);

  return { hand, addTile, removeTile, clearHand, getTileCount, canAddTile, getBaseTileCount };
}
