import React from 'react';
import { PLAYER_NAMES, PlayerEnum } from '../core/constants';
import type { Player } from '../types';

export interface GameOverPanelProps {
  winner: Player | null;
  onRestart: () => void;
}

export const GameOverPanel: React.FC<GameOverPanelProps> = ({ winner, onRestart }) => {
  const isPlayerWin = winner === PlayerEnum.BLACK;
  const isAIWin = winner === PlayerEnum.WHITE;
  const isDraw = winner === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* 涂鸦风格背景层 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 胜利/失败的色彩爆炸效果 */}
        {isPlayerWin && (
          <>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-yellow-400/30 via-orange-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-radial from-green-400/25 via-emerald-500/15 to-transparent rounded-full blur-3xl animate-pulse delay-200"></div>
          </>
        )}
        {isAIWin && (
          <>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-radial from-purple-500/30 via-blue-600/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-radial from-red-500/25 via-pink-500/15 to-transparent rounded-full blur-3xl animate-pulse delay-200"></div>
          </>
        )}
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
        <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border-4 border-yellow-400/70">
          {/* 装饰元素 */}
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full transform rotate-12 shadow-lg"></div>
          <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full transform -rotate-12 shadow-lg"></div>
          <div className="absolute top-1/4 -right-2 w-6 h-6 bg-cyan-400 rounded-full transform rotate-45 opacity-80"></div>
          <div className="absolute bottom-1/3 -left-2 w-5 h-5 bg-green-400 rounded-full transform -rotate-45 opacity-70"></div>

          {/* 标题区域 */}
          <div className="text-center space-y-4 mb-8">
            {isPlayerWin && (
              <>
                <div className="relative inline-block">
                  <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 transform -rotate-2 drop-shadow-2xl animate-bounce-subtle">
                    🎉 胜利！🎉
                  </h1>
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
                  <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-500 to-cyan-400 transform rotate-2 drop-shadow-2xl">
                    😢 失败
                  </h1>
                  <div className="absolute inset-0 blur-xl bg-gradient-to-r from-purple-400/50 via-blue-500/50 to-cyan-400/50 -z-10"></div>
                </div>
                <p className="text-2xl font-bold text-blue-300 transform -rotate-1">
                  {PLAYER_NAMES[PlayerEnum.WHITE]} 获胜
                </p>
                <p className="text-lg text-gray-400 italic">再接再厉，下次一定能赢！</p>
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
                <div className="text-4xl">⚫</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">黑方</div>
                <div className={`text-2xl font-bold ${isPlayerWin ? 'text-yellow-300' : 'text-gray-300'}`}>
                  {PLAYER_NAMES[PlayerEnum.BLACK]}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl">⚪</div>
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
                🔄 再来一局
              </span>
              {/* 悬浮光效 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </div>

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
