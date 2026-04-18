'use client';

import { useCallback, useEffect, useRef } from 'react';
import { HandTile } from '@/types/tile';
import { MAX_TILE_COUNT, MAX_HAND_SIZE, getAkaDoraBaseId } from '@/data/tiles';
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

export function useHand(meldTileCount: number = 0, kanCount: number = 0): UseHandReturn {
  // 手牌上限: 基本13枚、カン1回につき+1（カン後に嶺上牌をツモるため）
  const maxHandTotal = 13 + kanCount;
  // Sprint 9: LocalStorage で手牌を永続化
  const [hand, setHand] = useLocalStorage<HandTile[]>('tenpai-scorer-hand', []);

  // リストア時にnextHandIndexを最大値より大きい値に設定（重複防止）
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

  /**
   * Sprint 8: 同一基底IDの牌枚数を返す。
   * 例: man5rを追加しようとするとき、man5とman5rの合計枚数が MAX_TILE_COUNT 未満であることを確認
   */
  const getBaseTileCount = useCallback(
    (tileId: string): number => {
      const baseId = getAkaDoraBaseId(tileId);
      return hand.filter((t) => getAkaDoraBaseId(t.id) === baseId).length;
    },
    [hand]
  );

  const canAddTile = useCallback(
    (tileId: string): boolean => {
      // 手牌 + 副露牌の合計が上限を超えないようにする（カン数に応じて上限UP）
      if (hand.length + meldTileCount >= maxHandTotal) return false;
      // Sprint 8: 赤ドラは同一基底IDの合計枚数で判定（man5 + man5r の合計が4枚まで）
      if (getBaseTileCount(tileId) >= MAX_TILE_COUNT) return false;
      return true;
    },
    [hand.length, meldTileCount, maxHandTotal, getBaseTileCount]
  );

  const addTile = useCallback(
    (tileId: string, suit: string, number: number): { success: boolean; reason?: string } => {
      if (hand.length + meldTileCount >= maxHandTotal) {
        return { success: false, reason: `手牌は最大${maxHandTotal}枚までです` };
      }
      // Sprint 8: 赤ドラは同一基底IDの合計枚数で判定
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
    [hand.length, getTileCount]
  );

  const removeTile = useCallback((handIndex: number) => {
    setHand((prev) => prev.filter((t) => t.handIndex !== handIndex));
  }, []);

  const clearHand = useCallback(() => {
    setHand([]);
  }, []);

  return { hand, addTile, removeTile, clearHand, getTileCount, canAddTile, getBaseTileCount };
}
