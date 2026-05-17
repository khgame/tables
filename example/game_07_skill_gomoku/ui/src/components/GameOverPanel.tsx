import React, { useMemo, useState } from 'react';
import { PLAYER_NAMES, PlayerEnum } from '../core/constants';
import type { Player } from '../types';
import standKara from '../assets/stand_kara.png';
import standPanda from '../assets/stand.png';
import { encodeReplay } from '../app/utils/replay';

export interface GameOverPanelProps {
  winner: Player | null;
  onRestart: () => void;
  gameForShare?: { turnCount: number; timeline: any[]; shichahai: any[]; winner: Player | null; events?: any[] };
  playersForShare?: { me?: string; ai?: 'local' | 'cloud' };
}

export const GameOverPanel: React.FC<GameOverPanelProps> = ({ winner, onRestart, gameForShare, playersForShare }) => {
  const isPlayerWin = winner === PlayerEnum.BLACK;
  const isAIWin = winner === PlayerEnum.WHITE;
  const isDraw = winner === null;
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  // Debug-gated sharing UI: only show when localStorage.__DEBUG__ === 'true'
  const debugShareEnabled = useMemo(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const v = window.localStorage.getItem('__DEBUG__');
      return v === 'true' || v === '1';
    } catch {
      return false;
    }
  }, []);
  const shareUrl = useMemo(() => {
    if (!gameForShare) return '';
    if (!name || !name.trim()) return '';
    // 压缩时间线：仅保留棋盘 size + grid，去掉每帧的 history 以显著降低长度
    const compactTimeline = (gameForShare.timeline || []).map((t: any) => ({
      board: t && t.board ? { size: t.board.size, grid: t.board.grid } : undefined
    }));
    const payload = {
      v: 1 as const,
      winner: gameForShare.winner ?? null,
      turnCount: gameForShare.turnCount,
      timeline: compactTimeline,
      shichahai: [],
      events: Array.isArray(gameForShare.events) ? gameForShare.events : undefined,
      players: { ...(name ? { me: name } : {}), ...(playersForShare?.ai ? { ai: playersForShare.ai } : {}) },
      createdAt: Date.now()
    };
    const q = encodeReplay(payload as any);
    const base = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://example.com';
    return `${base}#replay=${q}`;
  }, [gameForShare, name]);

  const panelBorder = isPlayerWin ? 'border-emerald-300/70' : isAIWin ? 'border-indigo-300/60' : 'border-gray-300/50';
  const haloA = isPlayerWin
    ? 'from-yellow-400/30 via-orange-500/20'
    : isAIWin
    ? 'from-purple-500/30 via-blue-600/20'
    : 'from-gray-400/25 via-gray-500/15';
  const haloB = isPlayerWin
    ? 'from-green-400/25 via-emerald-500/15'
    : isAIWin
    ? 'from-red-500/25 via-pink-500/15'
    : 'from-gray-400/25 via-gray-500/15';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* 涂鸦风格背景层 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 胜利/失败的色彩爆炸效果 */}
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial ${haloA} to-transparent rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-radial ${haloB} to-transparent rounded-full blur-3xl animate-pulse delay-200`} />
      </div>

      {/* 主面板 */}
      <div className="relative max-w-2xl w-full">
        {/* 涂鸦装饰背景层 */}
        <div className="absolute inset-0 transform rotate-2">
          <div className="w-full h-full bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 rounded-3xl opacity-90 shadow-2xl"></div>
        </div>
        <div className="absolute inset-0 transform -rotate-1">
          <div className="w-full h-full bg-gradient-to-tl from-yellow-400/30 via-pink-500/20 to-transparent rounded-2xl"></div>
        </div>

        {/* 内容区 */}
        <div className={`relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border-4 ${panelBorder}`}>
          {/* 装饰元素 */}
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full transform rotate-12 shadow-lg"></div>
          <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full transform -rotate-12 shadow-lg"></div>
          <div className="absolute top-1/4 -right-2 w-6 h-6 bg-cyan-400 rounded-full transform rotate-45 opacity-80"></div>
          <div className="absolute bottom-1/3 -left-2 w-5 h-5 bg-green-400 rounded-full transform -rotate-45 opacity-70"></div>

          {/* 头像 + 标题区域 */}
          <div className="text-center space-y-4 mb-8">
            {/* 顶部头像：玩家胜利显示 stand_kara；AI 胜利显示 stand */}
            {(isPlayerWin || isAIWin) && (
              <div className="flex items-center justify-center">
                <img
                  src={isPlayerWin ? standKara : standPanda}
                  alt={isPlayerWin ? 'Player' : 'AI'}
                  className="h-24 md:h-32 w-auto rounded-xl object-cover object-top shadow-[0_12px_28px_rgba(0,0,0,0.45)] select-none pointer-events-none"
                  style={{ transform: 'scale(1.08)' }}
                />
              </div>
            )}
            {isPlayerWin && (
              <>
                <div className="relative inline-block">
                  <div className="flex items-center justify-center gap-4">
                    {/* 左侧庆祝图标 */}
                    <svg className="w-16 h-16 text-yellow-300 animate-bounce-subtle" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 4v3h5.5v12h3V7H19V4z"/>
                      <path d="M4 20h16v-1H4v1zm6-8h8v1h-8v-1zm0-4h8v1h-8V8z" opacity="0.6"/>
                      <path d="M3 2l1 2 2-1-1 2 2 1-2 1 1 2-2-1-1 2-1-2-2 1 1-2-2-1 2-1-1-2 2 1 1-2zm18 0l1 2 2-1-1 2 2 1-2 1 1 2-2-1-1 2-1-2-2 1 1-2-2-1 2-1-1-2 2 1 1-2z"/>
                    </svg>

                    <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 transform -rotate-2 drop-shadow-2xl animate-bounce-subtle">
                      胜利！
                    </h1>

                    {/* 右侧庆祝图标 */}
                    <svg className="w-16 h-16 text-orange-400 animate-bounce-subtle" style={{animationDelay: '0.1s'}} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 4v3h5.5v12h3V7H19V4z"/>
                      <path d="M4 20h16v-1H4v1zm6-8h8v1h-8v-1zm0-4h8v1h-8V8z" opacity="0.6"/>
                      <path d="M3 2l1 2 2-1-1 2 2 1-2 1 1 2-2-1-1 2-1-2-2 1 1-2-2-1 2-1-1-2 2 1 1-2zm18 0l1 2 2-1-1 2 2 1-2 1 1 2-2-1-1 2-1-2-2 1 1-2-2-1 2-1-1-2 2 1 1-2z"/>
                    </svg>
                  </div>
                  <div className="absolute inset-0 blur-xl bg-gradient-to-r from-yellow-300/50 via-orange-400/50 to-red-500/50 -z-10"></div>
                </div>
                <p className="text-2xl font-bold text-green-300 transform rotate-1">
                  恭喜 {PLAYER_NAMES[PlayerEnum.BLACK]} 获胜！
                </p>
              </>
            )}
            {isAIWin && (
              <>
                <div className="relative inline-block">
                  <div className="flex items-center justify-center gap-4">
                    {/* 失败图标 - 破碎的盾牌 */}
                    <svg className="w-14 h-14 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" opacity="0.6"/>
                      <path d="M12 2L4 5v7c0 1.5.5 3 1.2 4.3"/>
                      <path d="M20 5l-8 3"/>
                      <path d="M12 8v6"/>
                      <path d="M9 12l6-6"/>
                      <path d="M9 6l6 6"/>
                    </svg>

                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-500 to-cyan-400 transform rotate-2 drop-shadow-2xl">
                      失败
                    </h1>

                    {/* 失败图标 - 雨滴 */}
                    <svg className="w-12 h-12 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" opacity="0.7"/>
                      <path d="M12 2.69l-2.83 2.83"/>
                      <path d="M12 2.69l2.83 2.83" opacity="0.5"/>
                    </svg>
                  </div>
                  <div className="absolute inset-0 blur-xl bg-gradient-to-r from-purple-400/50 via-blue-500/50 to-cyan-400/50 -z-10"></div>
                </div>
                <p className="text-2xl font-bold text-blue-300 transform -rotate-1">
                  {PLAYER_NAMES[PlayerEnum.WHITE]} 获胜
                </p>
                <p className="text-lg text-gray-400 italic">打得不错，再接再厉，下次一定能赢！</p>
              </>
            )}
            {isDraw && (
              <>
                <div className="relative inline-block">
                  <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 drop-shadow-2xl">
                    平局
                  </h1>
                </div>
                <p className="text-xl font-bold text-gray-300">
                  势均力敌的对决！
                </p>
              </>
            )}
          </div>

          {/* 统计信息 */}
          <div className="bg-black/40 rounded-xl p-6 mb-6 border-2 border-yellow-400/30 transform -rotate-1">
            <div className="grid grid-cols-2 gap-6 text-center">
              <div className="space-y-2">
                {/* 黑色棋子 SVG */}
                <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="url(#blackGradient)" stroke="#666" strokeWidth="0.5"/>
                  <circle cx="12" cy="12" r="10" fill="url(#blackShine)"/>
                  <defs>
                    <radialGradient id="blackGradient" cx="30%" cy="30%">
                      <stop offset="0%" stopColor="#555"/>
                      <stop offset="50%" stopColor="#222"/>
                      <stop offset="100%" stopColor="#000"/>
                    </radialGradient>
                    <radialGradient id="blackShine" cx="30%" cy="30%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.4)"/>
                      <stop offset="20%" stopColor="rgba(255,255,255,0.1)"/>
                      <stop offset="100%" stopColor="transparent"/>
                    </radialGradient>
                  </defs>
                </svg>
                <div className="text-sm text-gray-400 uppercase tracking-wider">黑方</div>
                <div className={`text-2xl font-bold ${isPlayerWin ? 'text-yellow-300' : 'text-gray-300'}`}>
                  {PLAYER_NAMES[PlayerEnum.BLACK]}
                </div>
              </div>
              <div className="space-y-2">
                {/* 白色棋子 SVG */}
                <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="url(#whiteGradient)" stroke="#999" strokeWidth="0.5"/>
                  <circle cx="12" cy="12" r="10" fill="url(#whiteShine)"/>
                  <defs>
                    <radialGradient id="whiteGradient" cx="30%" cy="30%">
                      <stop offset="0%" stopColor="#fff"/>
                      <stop offset="70%" stopColor="#e8e8e8"/>
                      <stop offset="100%" stopColor="#ccc"/>
                    </radialGradient>
                    <radialGradient id="whiteShine" cx="25%" cy="25%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.9)"/>
                      <stop offset="30%" stopColor="rgba(255,255,255,0.3)"/>
                      <stop offset="100%" stopColor="transparent"/>
                    </radialGradient>
                  </defs>
                </svg>
                <div className="text-sm text-gray-400 uppercase tracking-wider">白方 AI</div>
                <div className={`text-2xl font-bold ${isAIWin ? 'text-yellow-300' : 'text-gray-300'}`}>
                  {PLAYER_NAMES[PlayerEnum.WHITE]}
                </div>
              </div>
            </div>
          </div>

          {/* 按钮区域 */}
          <div className="flex gap-4 justify-center">
            <button
              type="button"
              onClick={onRestart}
              className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white font-black text-lg rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 border-4 border-yellow-400/80 hover:rotate-2 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                {/* 循环箭头 SVG */}
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6"/>
                  <path d="M2.5 22v-6h6"/>
                  <path d="M21 2l-7.5 7.5"/>
                  <path d="M3 22l7.5-7.5"/>
                  <path d="M19 13.5A7.5 7.5 0 1 1 10.5 6"/>
                </svg>
                再来一局
              </span>
              {/* 悬浮光效 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </div>

          {gameForShare && debugShareEnabled && (
            <div className="mt-5 flex flex-col items-center">
              <div className="w-full max-w-xl rounded-xl bg-black/40 border border-white/10 p-4">
                <div className="text-sm text-amber-200 mb-2">分享你的战局</div>
                <div className="flex items-center gap-2 mb-2">
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="你的名字（必填）" className="flex-1 rounded-lg bg-slate-800/70 border border-white/10 px-2 py-1 text-sm text-white" />
                  <button
                    onClick={() => {
                      if (shareUrl) {
                        navigator.clipboard?.writeText(shareUrl).then(() => {
                          setCopied(true);
                          window.setTimeout(() => setCopied(false), 1500);
                        }).catch(() => {
                          setCopied(true);
                          window.setTimeout(() => setCopied(false), 1500);
                        });
                      }
                    }}
                    disabled={!shareUrl}
                    className={[
                      'rounded px-3 py-1 text-sm font-semibold',
                      shareUrl ? 'bg-emerald-600/90 hover:bg-emerald-600 text-white' : 'bg-slate-700/70 text-slate-400 cursor-not-allowed'
                    ].join(' ')}
                  >复制链接</button>
                </div>
                {/* 不显示 URL，仅提供复制功能 */}
                {copied && (
                  <div className="pointer-events-none fixed inset-0 z-[9999] flex items-start justify-center p-4">
                    <div className="mt-[20vh] rounded-2xl px-4 py-2 text-white text-sm font-bold shadow-[0_18px_48px_rgba(6,12,28,0.5)] bg-gradient-to-r from-sky-500 to-indigo-600">
                      复制成功
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 底部装饰文字 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 transform rotate-1">
              技能五子棋 · Skill Gomoku
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: rotate(-2deg) translateY(0); }
          50% { transform: rotate(-2deg) translateY(-10px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
        .delay-200 {
          animation-delay: 200ms;
        }
      `}</style>
    </div>
  );
};
