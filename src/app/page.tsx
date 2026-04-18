'use client';

import { useCallback, useState } from 'react';
import { Header } from '@/components/Header';
import { TilePalette } from '@/components/TilePalette';
import { HandArea } from '@/components/HandArea';
import { SituationPanel } from '@/components/SituationPanel';
import { TenpaiPanel } from '@/components/TenpaiPanel';
import { YakuResultPanel } from '@/components/YakuResultPanel';
import { MeldPanel } from '@/components/MeldPanel';
import { HelpModal } from '@/components/HelpModal';
import { useHand } from '@/hooks/useHand';
import { useSituation } from '@/hooks/useSituation';
import { useTenpai } from '@/hooks/useTenpai';
import { useYaku } from '@/hooks/useYaku';
import { useMeld } from '@/hooks/useMeld';
import { useToast } from '@/components/Toast';

export default function Home() {
  const { showToast } = useToast();
  const [helpOpen, setHelpOpen] = useState(false);

  const {
    melds,
    addMeld,
    removeMeld,
    clearMelds,
    totalMeldTileCount,
    isOpen,
    kanCount,
  } = useMeld();

  const { hand, addTile, removeTile, clearHand, getTileCount, canAddTile } = useHand(totalMeldTileCount, kanCount);
  const {
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
  } = useSituation();

  const {
    canCheck,
    disabledReason,
    tenpaiResult,
    checkTenpaiAction,
    clearResult,
  } = useTenpai(hand, totalMeldTileCount, melds.length);

  // 待ち牌が確定したら役判定を実行
  const waits = tenpaiResult?.status === 'tenpai' ? tenpaiResult.waits : [];
  const { waitYakuList } = useYaku(hand, waits, situation, melds);

  const handleTileClick = useCallback(
    (tileId: string, suit: string, number: number) => {
      const result = addTile(tileId, suit, number);
      if (!result.success && result.reason) {
        showToast(result.reason, 'error');
      }
      // 手牌が変わったら判定結果をリセット
      clearResult();
    },
    [addTile, clearResult, showToast]
  );

  const handleTileRemove = useCallback(
    (handIndex: number) => {
      removeTile(handIndex);
      clearResult();
    },
    [removeTile, clearResult]
  );

  const handleClearHand = useCallback(() => {
    clearHand();
    clearResult();
  }, [clearHand, clearResult]);

  const handleMeldAdd = useCallback(
    (type: Parameters<typeof addMeld>[0], tiles: string[]) => {
      const result = addMeld(type, tiles);
      if (result.success) {
        clearResult();
      } else if (result.reason) {
        showToast(result.reason, 'error');
      }
      return result;
    },
    [addMeld, clearResult, showToast],
  );

  const handleMeldRemove = useCallback(
    (id: string) => {
      removeMeld(id);
      clearResult();
    },
    [removeMeld, clearResult],
  );

  const handleReset = useCallback(() => {
    clearHand();
    clearMelds();
    resetSituation();
    clearResult();
    showToast('全てリセットしました', 'success', 2000);
  }, [clearHand, clearMelds, resetSituation, clearResult, showToast]);

  // 副露追加可否: カン数に応じた上限チェック（カン1回につき+1）
  const canAddMeld = melds.length < 4;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onReset={handleReset} onHelp={() => setHelpOpen(true)} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 py-4 space-y-4">
        {/* 状況設定パネル */}
        <SituationPanel
          situation={situation}
          onGameModeChange={setGameMode}
          onPlayerPositionChange={setPlayerPosition}
          onRoundWindChange={setRoundWind}
          onSeatWindChange={setSeatWind}
          onAddDoraIndicator={addDoraIndicator}
          onRemoveDoraIndicator={removeDoraIndicator}
          onRiichiChange={setRiichi}
          onDoubleRiichiChange={setDoubleRiichi}
          onIppatsuChange={setIppatsu}
          onHaiteiChange={setHaitei}
          onHouteiChange={setHoutei}
          onAddUraDoraIndicator={addUraDoraIndicator}
          onRemoveUraDoraIndicator={removeUraDoraIndicator}
          onHonbaChange={setHonba}
          onReset={resetSituation}
          isOpen={isOpen}
        />

        {/* 手牌エリア */}
        <HandArea
          hand={hand}
          onTileRemove={handleTileRemove}
          onClear={handleClearHand}
          melds={melds}
          meldTileCount={totalMeldTileCount}
        />

        {/* 副露入力パネル */}
        <MeldPanel
          melds={melds}
          onAddMeld={handleMeldAdd}
          onRemoveMeld={handleMeldRemove}
          canAddMeld={canAddMeld}
          is3P={situation.gameMode === '3p'}
          nukidoriCount={situation.nukidoriCount}
          onNukidoriCountChange={setNukidoriCount}
        />

        {/* 牌パレット */}
        <TilePalette
          onTileClick={handleTileClick}
          getTileCount={getTileCount}
          canAddTile={canAddTile}
          is3P={situation.gameMode === '3p'}
        />

        {/* 聴牌判定パネル */}
        <TenpaiPanel
          canCheck={canCheck}
          disabledReason={disabledReason}
          tenpaiResult={tenpaiResult}
          onCheck={checkTenpaiAction}
          onClear={clearResult}
        />

        {/* 役判定結果パネル（聴牌時のみ表示） */}
        {waitYakuList.length > 0 && (
          <YakuResultPanel waitYakuList={waitYakuList} />
        )}
      </main>

      <footer className="text-center text-xs text-gray-400 py-3">
        Tenpai Scorer — Sprint 9 (最終版)
      </footer>

      {/* ヘルプモーダル */}
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
