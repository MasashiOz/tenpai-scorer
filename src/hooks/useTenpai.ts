'use client';

import { useState, useCallback, useMemo } from 'react';
import { HandTile } from '@/types/tile';
import { checkTenpai, getTenpaiButtonReason, TenpaiStatus } from '@/lib/tenpai';

export interface UseTenpaiReturn {
  /** 聴牌ボタンが押せるか */
  canCheck: boolean;
  /** 聴牌ボタンが押せない理由（押せる場合は null） */
  disabledReason: string | null;
  /** 聴牌判定結果（未実行なら null） */
  tenpaiResult: TenpaiStatus | null;
  /** 聴牌判定を実行する */
  checkTenpaiAction: () => void;
  /** 結果をクリアする */
  clearResult: () => void;
}

export function useTenpai(hand: HandTile[], meldTileCount: number = 0, meldFaceCount?: number): UseTenpaiReturn {
  const [tenpaiResult, setTenpaiResult] = useState<TenpaiStatus | null>(null);

  const disabledReason = useMemo(
    () => getTenpaiButtonReason(hand.length, meldTileCount, meldFaceCount),
    [hand.length, meldTileCount, meldFaceCount]
  );

  // 必要枚数のときのみボタン有効
  const canCheck = disabledReason === null;

  const checkTenpaiAction = useCallback(() => {
    if (!canCheck) return;
    const tileIds = hand.map((t) => t.id);
    const result = checkTenpai(tileIds, meldTileCount, meldFaceCount);
    setTenpaiResult(result);
  }, [canCheck, hand, meldTileCount, meldFaceCount]);

  const clearResult = useCallback(() => {
    setTenpaiResult(null);
  }, []);

  return {
    canCheck,
    disabledReason,
    tenpaiResult,
    checkTenpaiAction,
    clearResult,
  };
}
