import { TILE_LABELS } from '@/data/tiles';
import { DoraInfo } from '@/types/situation';

/**
 * ドラ表示牌から実ドラを計算する。
 *
 * ルール:
 * - 数牌 (man/pin/sou): 表示牌の次の番号。9の次は1。
 * - 風牌: 東→南→西→北→東
 * - 三元牌: 白→發→中→白
 *
 * @param indicatorId  ドラ表示牌のID (e.g., "man5", "wind4", "dragon3")
 * @returns 実ドラのID
 */
export function getDoraFromIndicator(indicatorId: string): string {
  // 数牌
  const numeralMatch = indicatorId.match(/^(man|pin|sou)(\d)$/);
  if (numeralMatch) {
    const suit = numeralMatch[1];
    const num = parseInt(numeralMatch[2], 10);
    const nextNum = num === 9 ? 1 : num + 1;
    return `${suit}${nextNum}`;
  }

  // 風牌: wind1=東, wind2=南, wind3=西, wind4=北
  const windMatch = indicatorId.match(/^wind(\d)$/);
  if (windMatch) {
    const num = parseInt(windMatch[1], 10);
    const nextNum = num === 4 ? 1 : num + 1;
    return `wind${nextNum}`;
  }

  // 三元牌: dragon1=白, dragon2=發, dragon3=中
  const dragonMatch = indicatorId.match(/^dragon(\d)$/);
  if (dragonMatch) {
    const num = parseInt(dragonMatch[1], 10);
    const nextNum = num === 3 ? 1 : num + 1;
    return `dragon${nextNum}`;
  }

  return indicatorId; // フォールバック（不正なIDの場合はそのまま返す）
}

/**
 * ドラ表示牌のリストからDoraInfo配列を生成する。
 */
export function buildDoraInfoList(indicatorIds: string[]): DoraInfo[] {
  return indicatorIds.map((id) => {
    const doraId = getDoraFromIndicator(id);
    return {
      indicator: id,
      dora: doraId,
      indicatorLabel: TILE_LABELS[id] ?? id,
      doraLabel: TILE_LABELS[doraId] ?? doraId,
    };
  });
}
