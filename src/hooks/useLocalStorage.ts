'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Sprint 9: LocalStorage に値を永続化するカスタムフック
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // localStorage が使えない環境（プライベートモードなど）では無視
    }
  }, [key, storedValue]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const newValue = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
        return newValue;
      });
    },
    [],
  );

  return [storedValue, setValue];
}
