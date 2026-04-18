'use client';

import React from 'react';

interface HeaderProps {
  onReset: () => void;
  onHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onHelp }) => {
  return (
    <header className="bg-indigo-700 text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold leading-none">Tenpai Scorer</h1>
          <p className="text-xs text-indigo-200 mt-0.5">麻雀点数計算ヘルパー</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sprint 9: ヘルプボタン */}
          <button
            onClick={onHelp}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400
              border border-indigo-400 transition-colors font-medium flex items-center gap-1"
            type="button"
            aria-label="ヘルプを開く"
          >
            <span aria-hidden="true">?</span>
            <span className="hidden sm:inline">ヘルプ</span>
          </button>
          <button
            onClick={onReset}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500
              border border-indigo-500 transition-colors font-medium"
            type="button"
          >
            全リセット
          </button>
        </div>
      </div>
    </header>
  );
};
