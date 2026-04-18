import { describe, it, expect } from 'vitest';
import { getDoraFromIndicator, buildDoraInfoList } from './dora';

describe('getDoraFromIndicator', () => {
  it('数牌: 表示牌の次の番号が実ドラになる', () => {
    expect(getDoraFromIndicator('man5')).toBe('man6');
    expect(getDoraFromIndicator('pin1')).toBe('pin2');
    expect(getDoraFromIndicator('sou8')).toBe('sou9');
  });

  it('数牌: 9の次は1に折り返す', () => {
    expect(getDoraFromIndicator('man9')).toBe('man1');
    expect(getDoraFromIndicator('pin9')).toBe('pin1');
    expect(getDoraFromIndicator('sou9')).toBe('sou1');
  });

  it('風牌: 東→南→西→北→東の順に折り返す', () => {
    expect(getDoraFromIndicator('wind1')).toBe('wind2'); // 東→南
    expect(getDoraFromIndicator('wind2')).toBe('wind3'); // 南→西
    expect(getDoraFromIndicator('wind3')).toBe('wind4'); // 西→北
    expect(getDoraFromIndicator('wind4')).toBe('wind1'); // 北→東
  });

  it('三元牌: 白→發→中→白の順に折り返す', () => {
    expect(getDoraFromIndicator('dragon1')).toBe('dragon2'); // 白→發
    expect(getDoraFromIndicator('dragon2')).toBe('dragon3'); // 發→中
    expect(getDoraFromIndicator('dragon3')).toBe('dragon1'); // 中→白
  });
});

describe('buildDoraInfoList', () => {
  it('空のリストを返す', () => {
    expect(buildDoraInfoList([])).toEqual([]);
  });

  it('複数のドラ表示牌から DoraInfo リストを生成する', () => {
    const result = buildDoraInfoList(['man5', 'wind4']);
    expect(result).toHaveLength(2);
    expect(result[0].indicator).toBe('man5');
    expect(result[0].dora).toBe('man6');
    expect(result[0].indicatorLabel).toBe('5萬');
    expect(result[0].doraLabel).toBe('6萬');

    expect(result[1].indicator).toBe('wind4');
    expect(result[1].dora).toBe('wind1');
    expect(result[1].indicatorLabel).toBe('北');
    expect(result[1].doraLabel).toBe('東');
  });
});
