'use client';

import React, { useState } from 'react';
import { TILE_SVG } from '@/data/tiles';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type HelpTab = 'howto' | 'tiles' | 'yaku';

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<HelpTab>('howto');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="ヘルプ"
    >
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* モーダル本体 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-indigo-700 text-white rounded-t-2xl">
          <h2 className="text-base font-bold">ヘルプ / 使い方ガイド</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-indigo-600 transition-colors text-white text-lg"
            aria-label="閉じる"
            type="button"
          >
            ×
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {([
            { id: 'howto', label: '使い方' },
            { id: 'tiles', label: '牌の読み方' },
            { id: 'yaku', label: '役一覧' },
          ] as { id: HelpTab; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === id
                  ? 'text-indigo-700 border-b-2 border-indigo-700 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activeTab === 'howto' && <HowToTab />}
          {activeTab === 'tiles' && <TilesTab />}
          {activeTab === 'yaku' && <YakuTab />}
        </div>

        {/* フッター */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full py-2 bg-indigo-700 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-colors"
            type="button"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 使い方タブ
// ============================================================

const HowToTab: React.FC = () => (
  <div className="space-y-4">
    <Step number={1} title="状況を設定する">
      <p>画面上部の「状況設定」パネルで以下を設定します：</p>
      <ul className="mt-1 space-y-1 text-gray-600">
        <li>• <strong>親/子</strong>: あなたが親（ディーラー）か子かを選択</li>
        <li>• <strong>場風/自風</strong>: 現在の場と自分の席を選択（役牌判定に影響）</li>
        <li>• <strong>ドラ表示牌</strong>: 卓上のドラ表示牌を追加（実ドラが自動表示）</li>
        <li>• <strong>リーチ/一発/海底/河底</strong>: 状況役のトグル</li>
      </ul>
    </Step>

    <Step number={2} title="手牌を入力する">
      <p>牌パレットの牌をタップして手牌に追加します（最大14枚）。</p>
      <ul className="mt-1 space-y-1 text-gray-600">
        <li>• 手牌エリアの牌をタップすると削除できます</li>
        <li>• 同一牌は最大4枚まで追加できます</li>
        <li>• 副露（ポン・チー・カン）がある場合は「副露追加」から追加</li>
        <li>• 赤ドラは牌パレット下部の「赤ドラ」セクションから追加</li>
      </ul>
    </Step>

    <Step number={3} title="聴牌判定する">
      <p>13枚の手牌が揃ったら「聴牌判定する」ボタンを押します。</p>
      <ul className="mt-1 space-y-1 text-gray-600">
        <li>• 聴牌形の場合、待ち牌が一覧で表示されます</li>
        <li>• ノーテンの場合はその旨が表示されます</li>
        <li>• 複数の待ち牌がある場合は全て列挙されます</li>
      </ul>
    </Step>

    <Step number={4} title="点数を確認する">
      <p>待ち牌ごとに「ロン」「ツモ」「嶺上開花」の3列で点数が表示されます。</p>
      <ul className="mt-1 space-y-1 text-gray-600">
        <li>• 待ち牌をタップすると詳細（役・翻数・符の内訳）が展開されます</li>
        <li>• 「符の内訳」をタップすると計算過程が確認できます</li>
        <li>• 役満の場合は金色のバナーで表示されます</li>
      </ul>
    </Step>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <p className="text-sm font-semibold text-blue-700 mb-1">入力状態の自動保存</p>
      <p className="text-xs text-blue-600">
        手牌・状況設定はブラウザに自動保存されます。
        ページをリロードしても直前の状態が復元されます。
        「全リセット」ボタンで全ての設定をクリアできます。
      </p>
    </div>
  </div>
);

const Step: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({
  number, title, children,
}) => (
  <div className="flex gap-3">
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-700 text-white text-sm font-bold flex items-center justify-center">
      {number}
    </div>
    <div className="flex-1">
      <h3 className="text-sm font-bold text-gray-800 mb-1">{title}</h3>
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  </div>
);

// ============================================================
// 牌の読み方タブ
// ============================================================

const TilesTab: React.FC = () => (
  <div className="space-y-4">
    <SvgTileGroup
      title="萬子（マンズ）"
      color="text-red-700"
      description="漢数字1〜9が書かれた赤系の牌。「1萬」「9萬」が幺九牌（ヤオチュー牌）。"
      tileIds={['man1','man2','man3','man4','man5','man6','man7','man8','man9']}
      labels={['1萬','2萬','3萬','4萬','5萬','6萬','7萬','8萬','9萬']}
    />
    <SvgTileGroup
      title="筒子（ピンズ）"
      color="text-blue-700"
      description="円（筒）の模様が描かれた青系の牌。「1筒」「9筒」が幺九牌。"
      tileIds={['pin1','pin2','pin3','pin4','pin5','pin6','pin7','pin8','pin9']}
      labels={['1筒','2筒','3筒','4筒','5筒','6筒','7筒','8筒','9筒']}
    />
    <SvgTileGroup
      title="索子（ソーズ）"
      color="text-green-700"
      description="竹の模様が描かれた緑系の牌。「1索」「9索」が幺九牌。"
      tileIds={['sou1','sou2','sou3','sou4','sou5','sou6','sou7','sou8','sou9']}
      labels={['1索','2索','3索','4索','5索','6索','7索','8索','9索']}
    />

    <div>
      <h3 className="text-sm font-bold text-purple-700 mb-1">風牌（カゼパイ）</h3>
      <p className="text-xs text-gray-600 mb-2">東・南・西・北の4種。字牌で幺九牌。場風・自風と一致すると役牌になる。</p>
      <div className="flex gap-2">
        {[
          { id: 'wind1', label: '東' },
          { id: 'wind2', label: '南' },
          { id: 'wind3', label: '西' },
          { id: 'wind4', label: '北' },
        ].map(({ id, label }) => (
          <div key={id} className="flex flex-col items-center gap-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={TILE_SVG[id]} alt={label} className="w-9 h-12 object-contain border border-gray-200 rounded shadow-sm" />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>

    <div>
      <h3 className="text-sm font-bold text-yellow-700 mb-1">三元牌（サンゲンパイ）</h3>
      <p className="text-xs text-gray-600 mb-2">白・發・中の3種。字牌で幺九牌。刻子（3枚同じ）にすると役牌になる。</p>
      <div className="flex gap-2">
        {[
          { id: 'dragon1', label: '白' },
          { id: 'dragon2', label: '發' },
          { id: 'dragon3', label: '中' },
        ].map(({ id, label }) => (
          <div key={id} className="flex flex-col items-center gap-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={TILE_SVG[id]} alt={label} className="w-9 h-12 object-contain border border-gray-200 rounded shadow-sm" />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
      <p className="text-sm font-semibold text-orange-700 mb-1">赤ドラについて</p>
      <div className="flex items-center gap-3 mb-2">
        {['man5r','pin5r','sou5r'].map((id) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={id} src={TILE_SVG[id]} alt={id} className="w-8 h-11 object-contain border border-orange-300 rounded shadow-sm" />
        ))}
      </div>
      <p className="text-xs text-orange-600">
        5萬・5筒・5索の一部が赤く染められた「赤ドラ」として使用されます。
        赤ドラは手牌に含まれるだけで自動的にドラ1として加算されます。
        各種1枚ずつのみ使用可能です。
      </p>
    </div>
  </div>
);

const SvgTileGroup: React.FC<{
  title: string;
  color: string;
  description: string;
  tileIds: string[];
  labels: string[];
}> = ({ title, color, description, tileIds, labels }) => (
  <div>
    <h3 className={`text-sm font-bold ${color} mb-1`}>{title}</h3>
    <p className="text-xs text-gray-600 mb-2">{description}</p>
    <div className="flex flex-wrap gap-1">
      {tileIds.map((id, i) => (
        <div key={id} className="flex flex-col items-center gap-0.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={TILE_SVG[id]} alt={labels[i]} className="w-8 h-11 object-contain border border-gray-200 rounded shadow-sm" />
          <span className="text-xs text-gray-400">{labels[i]}</span>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// 役一覧タブ
// ============================================================

interface YakuEntry {
  name: string;
  han: string;
  desc: string;
  example?: string;
}

const YAKU_LIST: YakuEntry[] = [
  { name: '立直（リーチ）', han: '1翻', desc: '門前聴牌時に宣言できる。1翻追加。一発（1翻）も付随できる。' },
  { name: '門前清自摸和（メンゼンツモ）', han: '1翻', desc: '門前（副露なし）でツモアガリ。' },
  { name: '平和（ピンフ）', han: '1翻', desc: '4面子が全て順子、雀頭が役牌でなく、両面待ち。', example: '123m 456m 789m 234p + 55s' },
  { name: 'タンヤオ（断么九）', han: '1翻', desc: '手牌に幺九牌（1・9・字牌）が1枚もない。' },
  { name: '一盃口（イーペーコー）', han: '1翻', desc: '門前。同じ順子が2組。', example: '112233m' },
  { name: '役牌（ヤクハイ）', han: '1翻×', desc: '白・發・中、場風、自風の刻子・槓子。各1翻。' },
  { name: '海底撈月（ハイテイ）', han: '1翻', desc: '最後の牌でツモアガリ。' },
  { name: '河底撈魚（ホウテイ）', han: '1翻', desc: '最後の打牌でロンアガリ。' },
  { name: '嶺上開花（リンシャン）', han: '1翻', desc: 'カン後の嶺上牌でツモアガリ。' },
  { name: '三色同順（サンショク）', han: '2翻(1翻)', desc: '萬子・筒子・索子で同じ数字の順子。副露で喰い下がり1翻。' },
  { name: '一気通貫（イッキツウカン）', han: '2翻(1翻)', desc: '同じ種類で123・456・789の3面子。副露で喰い下がり1翻。' },
  { name: '三色同刻（サンショク・ドウコー）', han: '2翻', desc: '萬子・筒子・索子で同じ数字の刻子。喰い下がりなし。' },
  { name: '対々和（トイトイ）', han: '2翻', desc: '4面子全て刻子・槓子。' },
  { name: '三暗刻（サンアンコー）', han: '2翻', desc: '暗刻（暗槓含む）を3つ持つ。' },
  { name: '七対子（チートイツ）', han: '2翻', desc: '7種類の対子。25符固定。' },
  { name: '混全帯么九（チャンタ）', han: '2翻(1翻)', desc: '全面子・雀頭に幺九牌を含む。副露で1翻。' },
  { name: '小三元（ショウサンゲン）', han: '2翻+役牌2', desc: '白・發・中のうち2つを刻子、1つを雀頭にする。' },
  { name: '二盃口（リャンペーコー）', han: '3翻', desc: '門前。一盃口の組み合わせが2つ。' },
  { name: '純全帯么九（ジュンチャン）', han: '3翻(2翻)', desc: '全面子・雀頭に1か9（数牌のみ）を含む。副露で2翻。' },
  { name: '混一色（ホンイツ）', han: '3翻(2翻)', desc: '1種類の数牌と字牌だけで構成。副露で2翻。' },
  { name: '清一色（チンイツ）', han: '6翻(5翻)', desc: '1種類の数牌のみで構成。副露で5翻。' },
  { name: '混老頭（ホンロウトウ）', han: '2翻+対々/七対', desc: '手牌全てが幺九牌（字牌含む）。' },
  { name: '国士無双（コクシムソウ）', han: '役満', desc: '13種の幺九牌各1枚+そのうち1枚のペア。', example: '1m9m1p9p1s9s東南西北白發中' },
  { name: '四暗刻（スーアンコー）', han: '役満', desc: '4つの暗刻（または暗槓）。単騎待ちはダブル役満。' },
  { name: '大三元（ダイサンゲン）', han: '役満', desc: '白・發・中の全てを刻子・槓子にする。' },
  { name: '小四喜（ショウスーシー）', han: '役満', desc: '東南西北のうち3つを刻子、1つを雀頭にする。' },
  { name: '大四喜（ダイスーシー）', han: '役満', desc: '東南西北の全てを刻子・槓子にする。ダブル役満。' },
  { name: '字一色（ツーイーソー）', han: '役満', desc: '全ての牌が字牌（風牌・三元牌）。' },
  { name: '緑一色（リューイーソー）', han: '役満', desc: '2索・3索・4索・6索・8索・發のみ。' },
  { name: '清老頭（チンロウトウ）', han: '役満', desc: '全ての牌が数牌の1と9のみ。' },
  { name: '九蓮宝燈（チューレンポウトウ）', han: '役満', desc: '同一数牌の1×3・2・3・4・5・6・7・8・9×3の形。9面待ちはダブル役満。' },
  { name: '四槓子（スーカンツ）', han: '役満', desc: '4つのカン（槓子）を成立させる。' },
];

const YakuTab: React.FC = () => (
  <div className="space-y-2">
    <p className="text-xs text-gray-500">（翻数）の括弧内は副露時の喰い下がり翻数を示します。</p>
    <div className="space-y-1">
      {YAKU_LIST.map((yaku) => (
        <div
          key={yaku.name}
          className={`px-3 py-2 rounded-lg border text-xs ${
            yaku.han === '役満'
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className={`font-bold ${yaku.han === '役満' ? 'text-yellow-700' : 'text-gray-800'}`}>
              {yaku.name}
            </span>
            <span className={`flex-shrink-0 font-bold px-1.5 py-0.5 rounded text-xs ${
              yaku.han === '役満'
                ? 'bg-yellow-400 text-yellow-900'
                : 'bg-indigo-100 text-indigo-700'
            }`}>
              {yaku.han}
            </span>
          </div>
          <p className="text-gray-600 mt-0.5">{yaku.desc}</p>
          {yaku.example && (
            <p className="text-gray-400 mt-0.5">例: {yaku.example}</p>
          )}
        </div>
      ))}
    </div>
  </div>
);
