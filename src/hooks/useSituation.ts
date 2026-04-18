'use client';

import { useCallback } from 'react';
import {
  SituationState,
  PlayerPosition,
  RoundWind,
  SeatWind,
  DoraIndicator,
  GameMode,
  DEFAULT_SITUATION,
  MAX_DORA_INDICATORS,
  MAX_URA_DORA_INDICATORS,
  MAX_HONBA,
  MAX_NUKIDORI,
} from '@/types/situation';
import { useLocalStorage } from './useLocalStorage';

export interface UseSituationReturn {
  situation: SituationState;
  setGameMode: (mode: GameMode) => void;
  setPlayerPosition: (pos: PlayerPosition) => void;
  setRoundWind: (wind: RoundWind) => void;
  setSeatWind: (wind: SeatWind) => void;
  addDoraIndicator: (tileId: DoraIndicator) => { success: boolean; reason?: string };
  removeDoraIndicator: (index: number) => void;
  // Sprint 6: 状況役トグル
  setRiichi: (value: boolean) => void;
  setDoubleRiichi: (value: boolean) => void;
  setIppatsu: (value: boolean) => void;
  setHaitei: (value: boolean) => void;
  setHoutei: (value: boolean) => void;
  // Sprint 6: 裏ドラ
  addUraDoraIndicator: (tileId: DoraIndicator) => { success: boolean; reason?: string };
  removeUraDoraIndicator: (index: number) => void;
  // 本場
  setHonba: (honba: number) => void;
  // 三人麻雀: 抜き北
  setNukidoriCount: (count: number) => void;
  resetSituation: () => void;
}

export function useSituation(): UseSituationReturn {
  // Sprint 9: LocalStorage で状況設定を永続化
  const [situation, setSituation] = useLocalStorage<SituationState>(
    'tenpai-scorer-situation',
    DEFAULT_SITUATION,
  );

  const setGameMode = useCallback((mode: GameMode) => {
    setSituation((prev) => ({
      ...prev,
      gameMode: mode,
      // 三人麻雀に切り替えた際、北家なら東家にリセット
      seatWind: mode === '3p' && prev.seatWind === 'north' ? 'east' : prev.seatWind,
      // 三人麻雀以外に戻したら抜き北をクリア
      nukidoriCount: mode === '4p' ? 0 : prev.nukidoriCount,
    }));
  }, []);

  const setPlayerPosition = useCallback((pos: PlayerPosition) => {
    setSituation((prev) => ({ ...prev, playerPosition: pos }));
  }, []);

  const setRoundWind = useCallback((wind: RoundWind) => {
    setSituation((prev) => ({ ...prev, roundWind: wind }));
  }, []);

  const setSeatWind = useCallback((wind: SeatWind) => {
    setSituation((prev) => ({ ...prev, seatWind: wind }));
  }, []);

  const addDoraIndicator = useCallback(
    (tileId: DoraIndicator): { success: boolean; reason?: string } => {
      if (situation.doraIndicators.length >= MAX_DORA_INDICATORS) {
        return {
          success: false,
          reason: `ドラ表示牌は最大${MAX_DORA_INDICATORS}枚までです`,
        };
      }
      setSituation((prev) => ({
        ...prev,
        doraIndicators: [...prev.doraIndicators, tileId],
      }));
      return { success: true };
    },
    [situation.doraIndicators.length]
  );

  const removeDoraIndicator = useCallback((index: number) => {
    setSituation((prev) => ({
      ...prev,
      doraIndicators: prev.doraIndicators.filter((_, i) => i !== index),
    }));
  }, []);

  // Sprint 6: 状況役トグル
  const setRiichi = useCallback((value: boolean) => {
    setSituation((prev) => ({
      ...prev,
      isRiichi: value,
      // リーチOFFにしたら一発・ダブルリーチもOFF、裏ドラをクリア
      isDoubleRiichi: value ? prev.isDoubleRiichi : false,
      isIppatsu: value ? prev.isIppatsu : false,
      uraDoraIndicators: value ? prev.uraDoraIndicators : [],
    }));
  }, []);

  const setDoubleRiichi = useCallback((value: boolean) => {
    setSituation((prev) => ({
      ...prev,
      isDoubleRiichi: value,
    }));
  }, []);

  const setIppatsu = useCallback((value: boolean) => {
    setSituation((prev) => ({ ...prev, isIppatsu: value }));
  }, []);

  const setHaitei = useCallback((value: boolean) => {
    setSituation((prev) => ({
      ...prev,
      isHaitei: value,
      // 海底と河底は排他
      isHoutei: value ? false : prev.isHoutei,
    }));
  }, []);

  const setHoutei = useCallback((value: boolean) => {
    setSituation((prev) => ({
      ...prev,
      isHoutei: value,
      // 海底と河底は排他
      isHaitei: value ? false : prev.isHaitei,
    }));
  }, []);

  // Sprint 6: 裏ドラ表示牌
  const addUraDoraIndicator = useCallback(
    (tileId: DoraIndicator): { success: boolean; reason?: string } => {
      if (situation.uraDoraIndicators.length >= MAX_URA_DORA_INDICATORS) {
        return {
          success: false,
          reason: `裏ドラ表示牌は最大${MAX_URA_DORA_INDICATORS}枚までです`,
        };
      }
      setSituation((prev) => ({
        ...prev,
        uraDoraIndicators: [...prev.uraDoraIndicators, tileId],
      }));
      return { success: true };
    },
    [situation.uraDoraIndicators.length]
  );

  const removeUraDoraIndicator = useCallback((index: number) => {
    setSituation((prev) => ({
      ...prev,
      uraDoraIndicators: prev.uraDoraIndicators.filter((_, i) => i !== index),
    }));
  }, []);

  const setHonba = useCallback((honba: number) => {
    const clamped = Math.max(0, Math.min(MAX_HONBA, honba));
    setSituation((prev) => ({ ...prev, honba: clamped }));
  }, []);

  const setNukidoriCount = useCallback((count: number) => {
    const clamped = Math.max(0, Math.min(MAX_NUKIDORI, count));
    setSituation((prev) => ({ ...prev, nukidoriCount: clamped }));
  }, []);

  const resetSituation = useCallback(() => {
    setSituation(DEFAULT_SITUATION);
  }, []);

  return {
    situation,
    setGameMode,
    setPlayerPosition,
    setRoundWind,
    setSeatWind,
    addDoraIndicator,
    removeDoraIndicator,
    setRiichi,
    setDoubleRiichi,
    setIppatsu,
    setHaitei,
    setHoutei,
    addUraDoraIndicator,
    removeUraDoraIndicator,
    setHonba,
    setNukidoriCount,
    resetSituation,
  };
}
