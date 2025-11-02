import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Board,
  GameLog,
  PendingCardPanel,
  SnapshotSelector,
  ZonePanel,
  OpponentHUD,
  PlayerHUD,
  SkillEffectLayer,
  AiSettingsPanel,
  AiStatusBanner,
  CardDraftPanel,
  GameOverPanel,
  RulesIntroPanel
} from './components';
import { useGameEngine } from './core/gameEngine';
import { PLAYER_NAMES, PlayerEnum, SKILL_UNLOCK_MOVE, getOpponent, GamePhaseEnum } from './core/constants';
import { parseTags, parseEffectParams } from './core/utils';
import type { AiSettings, AiScenario, AiDecision, AiPlayingDecision } from './ai/openAiClient';
import { hasValidSettings, requestAiDecision } from './ai/openAiClient';
import type { LocalMoveSuggestion } from './ai';
import { formatLocalSuggestion, shouldAutoplaySuggestion, suggestLocalMove } from './ai';
import { aiLog } from './ai/logger';
import type { GameStatus, Player, RawCard, VisualEffectEvent } from './types';
import './styles/tailwind.css';
import { SkillEffect } from './skills/effects';

// Utility for conditional classnames
const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

// 导入智能路由和监控测试 (仅在开发环境)
if (import.meta.env.DEV) {
  import('./ai/tests');
  import('./ai/debug');
}

interface GameData {
  cards?: { result: Record<string, RawCard> };
  characters?: { result: Record<string, any> };
}

const fetchGameData = async (): Promise<GameData> => {
  const [cardsRes, charactersRes] = await Promise.all([
    fetch('./cards.json'),
    fetch('./characters.json')
  ]);
  const cards = await cardsRes.json();
  const characters = await charactersRes.json();
  return { cards, characters };
};

const App: React.FC = () => {
  const [data, setData] = useState<GameData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCounter, setSelectedCounter] = useState<RawCard | null>(null);
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const [boardBlockedFeedback, setBoardBlockedFeedback] = useState(false);
  const [activeVisuals, setActiveVisuals] = useState<VisualEffectEvent[]>([]);
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ scenario: AiScenario['kind'] | null; message: string; reason?: string }>({
    scenario: null,
    message: ''
  });
  const [showFinalPanel, setShowFinalPanel] = useState(false);
  const [winLineLit, setWinLineLit] = useState<Set<string>>(new Set());
  const [hoveredPosition, setHoveredPosition] = useState<{ row: number; col: number } | null>(null);
  const [skillTargetPosition, setSkillTargetPosition] = useState<{ row: number; col: number } | null>(null); // 技能目标位置高亮
  const winAnimTimersRef = useRef<number[]>([]);
  // AI 互动：头像气泡 & 玩家久未行动跟踪
  const [aiBubble, setAiBubble] = useState<{ id: string; text: string; tone?: 'prompt' | 'praise' | 'taunt' | 'info' | 'frustrated' } | null>(null);
  const [playerBubble, setPlayerBubble] = useState<{ id: string; text: string } | null>(null);
  const [playerInactivityLevel, setPlayerInactivityLevel] = useState<0 | 1 | 2>(0);
  const lastPlayerActionRef = useRef<number>(Date.now());
  const inactivityTimersRef = useRef<number[]>([]);
  const aiVictoryShownRef = useRef(false);
  const visualTracker = useRef<Set<string>>(new Set());
  // 记录最近一次已处理的可视化事件时间戳，用于严格过滤“真正新增”的视觉事件
  const lastVisualTsRef = useRef<number>(0);
  const updateAiStatus = useCallback(
    (next: { scenario: AiScenario['kind'] | null; message: string; reason?: string }) => {
      setAiStatus(prev => {
        if (
          prev.scenario === next.scenario &&
          prev.message === next.message &&
          (prev.reason ?? null) === (next.reason ?? null)
        ) {
          return prev;
        }
        return next;
      });
    },
    [setAiStatus]
  );

  useEffect(() => {
    fetchGameData()
      .then(payload => {
        setData(payload);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('[game07] load data failed', err);
        setError('无法加载数据，请先运行导出脚本生成 cards.json/characters.json');
        setIsLoading(false);
      });
  }, []);

  const engine = useGameEngine(data ?? {});
  const { gameState, startGame, placeStone, playCard, selectTarget, resolveCard, cancelPending, selectDraftOption } = engine;
  const isPlayerTurn = gameState.currentPlayer === PlayerEnum.BLACK;
  // 记录每回合开始（必须在所有早期 return 之前，保持 hooks 顺序一致）
  useEffect(() => {
    lastPlayerActionRef.current = Date.now();
    // 重置“久未行动”层级
    try { setPlayerInactivityLevel(0); } catch {}
  }, [isPlayerTurn, gameState.turnCount]);

  // 玩家久未行动：AI 气泡 + 轻微晃动棋盘
  useEffect(() => {
    // 清理历史定时器
    inactivityTimersRef.current.forEach(id => window.clearTimeout(id));
    inactivityTimersRef.current = [];

    // 只有在玩家回合、对局进行中且没有其他窗口时才提示
    const idleEligible =
      gameState.aiEnabled &&
      gameState.phase === GamePhaseEnum.PLAYING &&
      isPlayerTurn &&
      !gameState.pendingAction && !gameState.targetRequest && !gameState.draft && !gameState.pendingCounter;
    if (!idleEligible) {
      return;
    }

    const now = Date.now();
    const elapsed = now - lastPlayerActionRef.current;
    const thresholds = [7000, 14000]; // 7s、14s
    const messages = ['你掉线了?', '我等的黄花菜都凉了'];

    thresholds.forEach((ms, idx) => {
      const delay = Math.max(0, ms - elapsed);
      const timer = window.setTimeout(() => {
        // 再次校验状态有效
        const ok =
          gameState.aiEnabled &&
          gameState.phase === GamePhaseEnum.PLAYING &&
          gameState.currentPlayer === PlayerEnum.BLACK &&
          !gameState.pendingAction && !gameState.targetRequest && !gameState.draft && !gameState.pendingCounter;
        if (!ok) return;
        const id = `ai-bubble-${Date.now()}-${idx}`;
        setAiBubble({ id, text: messages[idx], tone: 'frustrated' });
        // 轻微晃动棋盘
        setBoardBlockedFeedback(true);
        // 自动清除气泡
        window.setTimeout(() => {
          setAiBubble(prev => (prev && prev.id === id ? null : prev));
        }, 1600);
        // 记录阶段，避免重复
        try { setPlayerInactivityLevel(prev => Math.min(2, (prev + 1) as 0 | 1 | 2)); } catch {}
      }, delay);
      inactivityTimersRef.current.push(timer);
    });

    return () => {
      inactivityTimersRef.current.forEach(id => window.clearTimeout(id));
      inactivityTimersRef.current = [];
    };
  }, [gameState.aiEnabled, gameState.phase, isPlayerTurn, gameState.pendingAction, gameState.targetRequest, gameState.draft, gameState.pendingCounter, gameState.currentPlayer]);

  useEffect(() => {
    setSelectedCounter(null);
  }, [gameState.pendingAction?.id]);

  // 监听pendingAction的变化，提取并高亮技能目标位置
  useEffect(() => {
    if (gameState.pendingAction?.selection) {
      const sel = gameState.pendingAction.selection;
      if (typeof sel.row === 'number' && typeof sel.col === 'number') {
        setSkillTargetPosition({ row: sel.row, col: sel.col });
      } else {
        setSkillTargetPosition(null);
      }
    } else {
      setSkillTargetPosition(null);
    }
  }, [gameState.pendingAction]);


  // 视觉事件处理：
  // - 仅处理 createdAt 晚于 lastVisualTsRef 的"新增"事件，避免旧事件在状态变化时重复播放
  // - 使用 visualTracker 记忆已处理过的事件 id，不在动画结束时从 tracker 中删除
  useEffect(() => {
    const visuals = gameState.visuals ?? [];
    const cutoff = lastVisualTsRef.current;
    const nextEvents = visuals.filter(e => e.createdAt > cutoff && !visualTracker.current.has(e.id));
    if (nextEvents.length === 0) return;

    nextEvents.forEach(event => {
      visualTracker.current.add(event.id);
      setActiveVisuals(prev => [...prev, event]);

      // 计算清理时间：
      // - 普通技能：2800ms（动画总时长）+ 200ms（缓冲）= 3000ms
      // - 反击技能：1200ms（延迟）+ 2800ms（动画）+ 200ms（缓冲）= 4200ms
      const isCounterSkill = event.effectId?.startsWith('Counter');
      const cleanupDelay = isCounterSkill ? 4200 : 3000;

      window.setTimeout(() => {
        // 仅移除展示队列，不移除 tracker 标记，避免重复播放
        setActiveVisuals(prev => prev.filter(item => item.id !== event.id));
      }, cleanupDelay);
    });

    // 推进已处理的最高时间戳
    const maxTs = Math.max(cutoff, ...nextEvents.map(e => e.createdAt));
    lastVisualTsRef.current = maxTs;
  }, [gameState.visuals]);

  // 新局或完全回溯时，清理本地可视化去重状态
  useEffect(() => {
    if (gameState.turnCount === 0 && gameState.board.history.length === 0) {
      visualTracker.current.clear();
      lastVisualTsRef.current = 0;
      setActiveVisuals([]);
    }
  }, [gameState.turnCount, gameState.board.history.length]);

  useAIActions(gameState, { playCard, placeStone, resolveCard, selectTarget }, aiSettings, updateAiStatus);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(aiSettings));
    } catch (err) {
      console.warn('[game07] failed to persist AI settings', err);
    }
  }, [aiSettings]);

  useEffect(() => {
    if (!boardBlockedFeedback) return;
    const timer = window.setTimeout(() => setBoardBlockedFeedback(false), 320);
    return () => window.clearTimeout(timer);
  }, [boardBlockedFeedback]);

  // 胜负面板时机与动画：
  // - 普通五连胜：依次点亮连线后立即显示面板
  // - 技能胜（力拔山兮/两极反转）：播放动画约 3.2s 后显示面板
  useEffect(() => {
    // 清理任何在途的胜利动画定时器
    winAnimTimersRef.current.forEach(id => window.clearTimeout(id));
    winAnimTimersRef.current = [];
    setWinLineLit(new Set());

    if (gameState.phase !== GamePhaseEnum.GAME_OVER || gameState.winner == null) {
      setShowFinalPanel(false);
      return;
    }

    // 判定是否技能胜：查看最近的可视化效果
    const recentVisual = (gameState.visuals ?? []).slice(-3).find(v =>
      v.effectId === SkillEffect.InstantWin || v.effectId === SkillEffect.CounterReverseWin
    );

    if (recentVisual) {
      setShowFinalPanel(false);
      const t = window.setTimeout(() => setShowFinalPanel(true), 3200);
      winAnimTimersRef.current.push(t);
      return;
    }

    // 非技能胜：尝试寻找连成五子的路径并依次点亮
    const winner = gameState.winner;
    const line = findWinningLine(gameState.board, winner);
    if (!line || line.length < 5) {
      // fallback：若没有检测到明确连线，直接显示
      setShowFinalPanel(true);
      return;
    }

    setShowFinalPanel(false);
    const keys = line.map(cell => `${cell.row}-${cell.col}`);
    keys.forEach((k, idx) => {
      const t = window.setTimeout(() => {
        setWinLineLit(prev => {
          const next = new Set(prev);
          next.add(k);
          return next;
        });
        if (idx === keys.length - 1) {
          // 最后一个点亮后立即显示面板
          const nextT = window.setTimeout(() => setShowFinalPanel(true), 150);
          winAnimTimersRef.current.push(nextT);
        }
      }, 180 * idx);
      winAnimTimersRef.current.push(t);
    });

    return () => {
      winAnimTimersRef.current.forEach(id => window.clearTimeout(id));
      winAnimTimersRef.current = [];
    };
  }, [gameState.phase, gameState.winner, gameState.board, gameState.visuals]);

  const findWinningLine = (board: GameStatus['board'], player: Player) => {
    const size = board.size;
    const dirs: Array<[number, number]> = [ [0,1], [1,0], [1,1], [1,-1] ];
    const inBounds = (r: number, c: number) => r >= 0 && r < size && c >= 0 && c < size;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board.get(r, c) !== player) continue;
        for (const [dr, dc] of dirs) {
          const cells: Array<{row:number,col:number}> = [];
          // forward
          let rr = r, cc = c;
          while (inBounds(rr, cc) && board.get(rr, cc) === player) {
            cells.push({ row: rr, col: cc });
            rr += dr; cc += dc;
          }
          // backward
          rr = r - dr; cc = c - dc;
          while (inBounds(rr, cc) && board.get(rr, cc) === player) {
            cells.unshift({ row: rr, col: cc });
            rr -= dr; cc -= dc;
          }
          if (cells.length >= 5) {
            // 仅返回连续的前 5 个（或更多也行，这里取前 5 个保证节奏）
            return cells.slice(0, 5);
          }
        }
      }
    }
    return null;
  };

  const responder = gameState.counterWindow?.responder ?? null;
  const availableCounters = useMemo(() => {
    if (!gameState.pendingAction || responder === null) return [];
    const raw = gameState.pendingAction.card.counteredBy;
    const ids = (() => {
      if (Array.isArray(raw)) return raw.map(item => String(item).trim()).filter(Boolean);
      if (typeof raw === 'string') return raw.split('|').map(item => item.trim()).filter(Boolean);
      if (raw == null) return [] as string[];
      return [String(raw).trim()].filter(Boolean);
    })();
    if (ids.length === 0) return [];
    return (gameState.hands[responder] ?? []).filter(card => ids.includes(String(card._tid ?? card.tid)));
  }, [gameState.pendingAction, gameState.hands, responder]);

  const stonesByPlayer = useMemo(() => countStones(gameState.board), [gameState.board]);
  const shichahaiByPlayer = useMemo(() => partitionShichahai(gameState.shichahai), [gameState.shichahai]);

  // Note: 不再为白方 AI 自动放弃反击；反击逻辑交由 AI 场景（counter_window）决策处理

  const renderDraft = () => {
    const draft = gameState.draft;
    if (!draft) return null;
    const isHumanDraft = !gameState.aiEnabled || draft.player !== PlayerEnum.WHITE;
    if (!isHumanDraft) return null;
    return <CardDraftPanel options={draft.options} source={draft.source} onSelect={selectDraftOption} />;
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen text-amber-100 text-xl">加载配置中…</div>
        <AiSettingsPanel
          open={isSettingsOpen}
          settings={aiSettings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={setAiSettings}
        />
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen text-red-200 text-lg">{error}</div>
        <AiSettingsPanel
          open={isSettingsOpen}
          settings={aiSettings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={setAiSettings}
        />
      </>
    );
  }

  const { phase, board, currentPlayer, hands, logs, pendingAction, targetRequest, aiEnabled, moveCount, statuses, winner } = gameState;


  if (phase === GamePhaseEnum.SETUP) {
    return (
      <>
        <div className="h-screen overflow-auto p-6 flex flex-col items-center justify-center space-y-6">
          <AiSettingsTrigger onOpen={setIsSettingsOpen} hasConfig={hasValidSettings(aiSettings)} />
          <RulesIntroPanel
            hasConfig={hasValidSettings(aiSettings)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onStartAi={() => {
              if (!hasValidSettings(aiSettings)) {
                setIsSettingsOpen(true);
                return;
              }
              startGame(true);
            }}
          />
        </div>
        <AiSettingsPanel
          open={isSettingsOpen}
          settings={aiSettings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={setAiSettings}
        />
      </>
    );
  }

  const enemyHandCards = hands[PlayerEnum.WHITE] ?? [];
  const playerHandCards = hands[PlayerEnum.BLACK] ?? [];
  const enemyGraveyard = gameState.graveyards[PlayerEnum.WHITE] ?? [];
  const playerGraveyard = gameState.graveyards[PlayerEnum.BLACK] ?? [];
  const canPlayCard =
    phase === GamePhaseEnum.PLAYING &&
    isPlayerTurn &&
    gameState.turnCount + 1 >= SKILL_UNLOCK_MOVE &&
    !pendingAction &&
    !(targetRequest && targetRequest.type === 'cell');
  const canConfirm =
    phase === GamePhaseEnum.COUNTER_WINDOW &&
    (responder === null || responder === PlayerEnum.BLACK);

  const handleCardDropOnBoard = (index: number | null) => {
    if (!canPlayCard) return;
    const sourceIndex = index ?? draggedCardIndex;
    if (sourceIndex === null) return;
    // 记录玩家动作并出牌
    try { lastPlayerActionRef.current = Date.now(); setPlayerInactivityLevel(0); } catch {}
    playCard(sourceIndex);
    setDraggedCardIndex(null);
  };

  const handlePlayerCardHover = (card: RawCard | null) => {
    // 悬浮预览已移除，保留回调便于后续扩展
    if (!card && draggedCardIndex === null) return;
  };

  return (
    <>
      <AiStatusBanner status={aiStatus} />
      <div className="flex items-center justify-center min-h-screen max-h-screen h-screen relative bg-[#05070d] overflow-hidden" style={{
        padding: 'clamp(0.8rem, 1.5vw, 1.6rem)',
        backgroundImage: "url('/gom_page_bg.png')",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: '100% auto'
      }}>
        <AiSettingsTrigger onOpen={setIsSettingsOpen} hasConfig={hasValidSettings(aiSettings)} />

        {/* Backdrop decorative layers */}
        <div className="absolute inset-0" style={{
          background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23654321' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat, radial-gradient(circle at 25% 25%, rgba(218, 165, 32, 0.08), transparent 45%), radial-gradient(circle at 75% 75%, rgba(160, 82, 45, 0.06), transparent 50%)`
        }} />

        {/* Halo effects */}
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
          filter: 'blur(120px)',
          background: 'radial-gradient(circle at 20% 50%, rgba(218, 165, 32, 0.3), transparent 60%)'
        }} />
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
          filter: 'blur(120px)',
          background: 'radial-gradient(circle at 80% 60%, rgba(160, 82, 45, 0.25), transparent 60%)'
        }} />

        {/* Overlay pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
          background: `linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.1) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.1) 75%)`,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }} />

        <div className="relative z-[1] rounded-3xl bg-transparent overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)]" style={{
          width: 'min(1600px, 98vw)',
          height: 'calc(100vh - clamp(1.6rem, 3vw, 3.2rem))',
          maxHeight: '100vh',
          padding: 'clamp(0.6rem, 1vw, 1rem)'
        }}>
          <div className="grid h-full" style={{
            gridTemplateAreas: `
              'opponent-info . opponent-zone'
              'board board log'
              'player-info . player-zone'
            `,
            gridTemplateColumns: 'minmax(240px, 280px) minmax(0, 1fr) minmax(320px, 380px)',
            gridTemplateRows: 'auto minmax(0, 1fr) auto',
            gap: 'clamp(1rem, 1.5vw, 2rem)',
            padding: 'clamp(0.6rem, 1vw, 1.2rem)'
          }}>
          <aside style={{ gridArea: 'opponent-zone' }}>
            <ZonePanel
              title="墓地 / 什刹海"
              graveyard={enemyGraveyard}
              shichahai={shichahaiByPlayer[PlayerEnum.WHITE]}
              variant="opponent"
            />
          </aside>
          <div style={{ gridArea: 'opponent-info' }}>
            <OpponentHUD
              handCards={enemyHandCards}
              graveyardCount={enemyGraveyard.length}
              shichahaiCount={shichahaiByPlayer[PlayerEnum.WHITE].length}
              moveCount={moveCount[PlayerEnum.WHITE] ?? 0}
              stonesCount={stonesByPlayer[PlayerEnum.WHITE]}
              characters={gameState.characters}
              statuses={statuses}
              isCurrent={currentPlayer === PlayerEnum.WHITE}
              animateThinking={aiEnabled && Boolean(aiStatus.scenario)}
              bubble={aiBubble}
            />
          </div>
          <section className="relative" style={{ gridArea: 'board' }}>
            <div className={cx(
              'h-full flex items-center justify-center relative',
              boardBlockedFeedback && 'animate-board-shudder'
            )}>
              {/* Ambient glow behind board */}
              <div className="absolute rounded-full opacity-60" style={{
                inset: '8%',
                background: 'radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.08), transparent 70%)',
                filter: 'blur(40px)'
              }} />

              {/* Board container */}
              <div className="relative w-full flex items-center justify-center" style={{
                maxWidth: 'min(68vh, 70vw)',
                aspectRatio: '1'
              }}>
                <Board
                  board={board}
                  onCellClick={placeStone}
                  disabled={
                    phase !== GamePhaseEnum.PLAYING ||
                    !isPlayerTurn ||
                    Boolean(pendingAction) ||
                    (targetRequest && targetRequest.type === 'snapshot')
                  }
                  targetRequest={targetRequest && targetRequest.type === 'cell' ? targetRequest : null}
                  onTargetSelect={(sel) => { try { lastPlayerActionRef.current = Date.now(); setPlayerInactivityLevel(0); } catch {}; selectTarget(sel); }}
                  className="w-full h-full"
                  style={{ aspectRatio: '1 / 1' }}
                  onCardDrop={handleCardDropOnBoard}
                  onBlockedInteract={() => {
                    if (phase === GamePhaseEnum.PLAYING && !isPlayerTurn) {
                      setBoardBlockedFeedback(true);
                    }
                  }}
                  winLineLit={winLineLit}
                  hoveredPosition={hoveredPosition}
                  skillTargetPosition={skillTargetPosition}
                  sealedCells={gameState.statuses.sealedCells}
                  currentTurn={gameState.turnCount}
                />
                <SkillEffectLayer events={activeVisuals} />
              </div>
              {renderDraft()}
              {pendingAction && (
                <>
                  {/* subtle dim + blur overlay behind confirm panel (non-blocking) */}
                  <div className="fixed inset-0 z-[120] pointer-events-none">
                    <div className="absolute inset-0 bg-slate-900/30" />
                  </div>
                  <div className="pointer-events-auto fixed right-6 bottom-28 z-[130]">
                    <PendingCardPanel
                      pendingCard={pendingAction}
                      responder={responder}
                      availableCounters={availableCounters}
                      selectedCounter={selectedCounter}
                      setSelectedCounter={setSelectedCounter}
                      onResolve={(countered, card) => {
                        try { lastPlayerActionRef.current = Date.now(); setPlayerInactivityLevel(0); } catch {}
                        resolveCard(countered, card);
                        if (countered) setSelectedCounter(null);
                      }}
                      aiEnabled={aiEnabled}
                      onReact={(text) => {
                        const id = `pb-${Date.now()}`;
                        setPlayerBubble({ id, text });
                        window.setTimeout(() => {
                          setPlayerBubble(prev => (prev && prev.id === id ? null : prev));
                        }, 1600);
                      }}
                      onCancel={() => {
                        try { lastPlayerActionRef.current = Date.now(); setPlayerInactivityLevel(0); } catch {}
                        cancelPending();
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </section>
          <aside style={{ gridArea: 'log' }}>
            <GameLog
              logs={logs}
              onPositionHover={setHoveredPosition}
              turnCount={gameState.turnCount}
              currentPlayer={gameState.currentPlayer}
              playerNames={PLAYER_NAMES}
            />
            <ZonePanel
              title="墓地 / 什刹海"
              graveyard={playerGraveyard}
              shichahai={shichahaiByPlayer[PlayerEnum.BLACK]}
              variant="player"
            />
          </aside>
          <div style={{ gridArea: 'player-info' }}>
            <PlayerHUD
              handCards={playerHandCards}
              disabled={!canPlayCard}
              statuses={statuses}
              moveCount={moveCount[PlayerEnum.BLACK] ?? 0}
              stonesCount={stonesByPlayer[PlayerEnum.BLACK]}
          characters={gameState.characters}
          graveyardCount={playerGraveyard.length}
          shichahaiCount={shichahaiByPlayer[PlayerEnum.BLACK].length}
          onCardHover={handlePlayerCardHover}
          onCardDragStart={index => {
            if (!canPlayCard) return;
            setDraggedCardIndex(index);
          }}
          onCardDragEnd={() => {
            setDraggedCardIndex(null);
          }}
          isCurrent={currentPlayer === PlayerEnum.BLACK}
          bubble={playerBubble}
        />
      </div>
          </div>
        </div>
      </div>
      {/* 胜负面板：根据上面的逻辑时机显示 */}
      {phase === GamePhaseEnum.GAME_OVER && showFinalPanel && (
        <GameOverPanel
          winner={winner}
          onRestart={() => window.location.reload()}
        />
      )}
      <AiSettingsPanel
        open={isSettingsOpen}
        settings={aiSettings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={setAiSettings}
      />
    </>
  );

};

const AI_SETTINGS_STORAGE_KEY = 'game07.ai-settings';

const loadAiSettings = (): AiSettings => {
  const DEFAULT_AI_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
  const DEFAULT_MODEL = 'doubao-seed-1-6-251015';
  if (typeof window === 'undefined') {
    return {
      endpoint: DEFAULT_AI_ENDPOINT,
      apiKey: '',
      reasoningModel: DEFAULT_MODEL,
      fastModel: DEFAULT_MODEL
    };
  }
  try {
    const raw = window.localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return {
        endpoint: DEFAULT_AI_ENDPOINT,
        apiKey: '',
        reasoningModel: DEFAULT_MODEL,
        fastModel: DEFAULT_MODEL
      };
    }
    const parsed = JSON.parse(raw);
    return {
      endpoint: parsed.endpoint ?? DEFAULT_AI_ENDPOINT,
      apiKey: parsed.apiKey ?? '',
      reasoningModel: parsed.reasoningModel ?? parsed.model ?? DEFAULT_MODEL,
      fastModel: parsed.fastModel ?? DEFAULT_MODEL
    };
  } catch (err) {
    console.warn('[game07] failed to load AI settings', err);
    return {
      endpoint: DEFAULT_AI_ENDPOINT,
      apiKey: '',
      reasoningModel: DEFAULT_MODEL,
      fastModel: DEFAULT_MODEL
    };
  }
};

const AiSettingsTrigger: React.FC<{ onOpen: (open: boolean) => void; hasConfig: boolean }> = ({ onOpen, hasConfig }) => (
  <button type="button" className={`ai-settings__trigger ${hasConfig ? 'ai-settings__trigger--ready' : ''}`} onClick={() => onOpen(true)}>
    AI 设置
  </button>
);

const DEFAULT_PROGRESS_MESSAGES = ['持续分析局势', '推演后续回合', '评估风险收益'];

const PROGRESS_MESSAGES: Record<AiScenario['kind'], string[]> = {
  stone: ['扫描棋型威胁', '推演双方落子', '验证占位收益'],
  skill: ['梳理技能组合', '模拟效果连锁', '评估反制风险'],
  card_targeting: ['对比目标优先级', '校验可选范围', '预估技能结果'],
  counter_window: ['检测可用反击牌', '判断对手威胁', '计算反击收益'],
  mulligan: ['评估初始手牌', '权衡重抽价值', '预测开局走势']
};

const PROGRESS_UPDATE_INTERVAL = 10000;

const getScenarioMeta = (kind: AiScenario['kind']) => {
  switch (kind) {
    case 'card_targeting':
      return {
        message: '白方 AI 正在选择技能目标…',
        startLog: '白方 AI 正在计算技能目标',
        successLog: (detail?: string) => detail ?? '白方 AI 完成目标选择',
        fallbackLog: '白方 AI 目标选择使用默认选项'
      };
    case 'counter_window':
      return {
        message: '白方 AI 判定是否反击…',
        startLog: '白方 AI 正在评估反击窗口',
        successLog: (detail?: string) => detail ?? '白方 AI 完成反击判定',
        fallbackLog: '白方 AI 反击窗口使用保底策略'
      };
    case 'skill':
      return {
        message: '白方 AI 评估技能动作…',
        startLog: '白方 AI 正在筛选可发动技能',
        successLog: (detail?: string) => detail ?? '白方 AI 完成技能判定',
        fallbackLog: '白方 AI 使用默认技能策略'
      };
    case 'stone':
    default:
      return {
        message: '白方 AI 规划落子…',
        startLog: '白方 AI 正在计算落子位置',
        successLog: (detail?: string) => detail ?? '白方 AI 完成落子决策',
        fallbackLog: '白方 AI 落子使用默认策略'
      };
  }
};

const useAIActions = (
  gameState: GameStatus,
  actions: {
    playCard: (index: number) => void;
    placeStone: (row: number, col: number) => void;
    resolveCard: (countered: boolean, counterCard?: RawCard | null) => void;
    selectTarget: (selection: any) => void;
  },
  aiSettings: AiSettings,
  updateAiStatus: (status: { scenario: AiScenario['kind'] | null; message: string; reason?: string }) => void
) => {
  const { playCard, placeStone, resolveCard, selectTarget } = actions;
  const processedRef = useRef<Set<string>>(new Set());
  const activeKeyRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const prevSnapshotRef = useRef<{ len: number; turn: number }>({ len: gameState.board.history.length, turn: gameState.turnCount });

  useEffect(() => {
    // Fast-path: if white is frozen/skip this turn, auto advance without thinking
    if (
      gameState.aiEnabled &&
      gameState.phase === GamePhaseEnum.PLAYING &&
      gameState.currentPlayer === PlayerEnum.WHITE &&
      !gameState.pendingAction && !gameState.pendingCounter && !gameState.targetRequest && !gameState.draft
    ) {
      const frozen = (gameState.statuses.freeze[PlayerEnum.WHITE] ?? 0) > 0;
      const skip = (gameState.statuses.skip[PlayerEnum.WHITE] ?? 0) > 0;
      if (frozen || skip) {
        const key = `auto-skip:${gameState.turnCount}`;
        if (!processedRef.current.has(key)) {
          processedRef.current.add(key);
          // Use a dummy placement to trigger engine's skip/freeze handling
          try { placeStone(-1 as any, -1 as any); } catch {}
          return;
        }
      }
    }

    if (gameState.turnCount === 0 && gameState.board.history.length === 0) {
      processedRef.current.clear();
      activeKeyRef.current = null;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    // If history/turn count went backwards (e.g., Time Rewind), clear processed keys to allow re-scheduling
    const prev = prevSnapshotRef.current;
    if (gameState.board.history.length < prev.len || gameState.turnCount < prev.turn) {
      processedRef.current.clear();
      activeKeyRef.current = null;
    }
    prevSnapshotRef.current = { len: gameState.board.history.length, turn: gameState.turnCount };
  }, [gameState.turnCount, gameState.board.history.length]);

  useEffect(() => {
    const stopProgressUpdates = () => {
      if (progressTimerRef.current !== null) {
        window.clearTimeout(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };

    const cycleProgressMessage = (
      scenario: AiScenario,
      baseMessage: string,
      reason?: string
    ) => {
      stopProgressUpdates();
      const source = PROGRESS_MESSAGES[scenario.kind] ?? DEFAULT_PROGRESS_MESSAGES;
      const phrases = source.length > 0 ? source : DEFAULT_PROGRESS_MESSAGES;
      let index = 0;
      const tick = () => {
        const suffix = phrases[index % phrases.length];
        index += 1;
        const message = suffix ? `${baseMessage} · ${suffix}` : baseMessage;
        updateAiStatus({ scenario: scenario.kind, message, reason });
        progressTimerRef.current = window.setTimeout(tick, PROGRESS_UPDATE_INTERVAL);
      };
      tick();
    };

    const clearRunningTask = (resetStatus = true, extra?: { reason?: string }) => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      stopProgressUpdates();
      activeKeyRef.current = null;
      if (resetStatus) updateAiStatus({ scenario: null, message: '', reason: extra?.reason });
    };

    const startScenario = (scenario: AiScenario, key: string) => {
      if (processedRef.current.has(key)) return;

      let scenarioPayload: AiScenario = scenario;
      let cachedLocalSuggestion: LocalMoveSuggestion | null = null;

      // Counter window: fast local policies for critical counters (no LLM)
      if (scenario.kind === 'counter_window') {
        const targetEffect = scenario.pendingCard?.effectId ?? '';
        const targetParams = (scenario.pendingCard?.params ?? {}) as Record<string, any>;
        const targetTags = parseTags(scenario.pendingCard?.card?.tags);
        const counters = scenario.availableCounters ?? [];

        const autoResolve = (picked: { handIndex: number; card: RawCard }, reason: string) => {
          aiLog.info('[counter:auto]', { against: targetEffect, pick: formatCardIdentifier(picked.card), reason });
          processedRef.current.add(key);
          // 短暂展示反击窗口的 UI 再结算，保持与交互一致性
          const AUTO_COUNTER_DELAY = 650;
          timerRef.current = window.setTimeout(() => {
            clearRunningTask();
            actions.resolveCard(true, picked.card);
          }, AUTO_COUNTER_DELAY);
        };

        // 1) 对方力拔山兮 => 使用东山再起（恢复棋盘 + 惩罚对手）
        if (targetEffect === SkillEffect.InstantWin) {
          const pick = counters.find(opt => opt.card.effectId === SkillEffect.CounterRestoreBoard);
          if (pick) { autoResolve(pick, 'instant-win -> counter-restore-board'); return; }
        }
        // 2) 飞沙走石/棒球：若非棒球（ignoreSeize=true），优先擒拿（保持原位）
        if (targetEffect === SkillEffect.RemoveToShichahai) {
          const isBaseballImmune = String(targetParams.ignoreSeize ?? '').toLowerCase() === 'true';
          if (!isBaseballImmune) {
            const pick = counters.find(opt => opt.card.effectId === SkillEffect.CounterPreventRemoval);
            if (pick) { autoResolve(pick, 'remove-to-shichahai -> counter-prevent-removal'); return; }
          }
        }
        // 3) 静如止水：若有解冻，立即解冻
        if (targetEffect === SkillEffect.FreezeOpponent) {
          const pick = counters.find(opt => opt.card.effectId === SkillEffect.CounterThaw);
          if (pick) { autoResolve(pick, 'freeze-opponent -> counter-thaw'); return; }
        }
        // 4) 敌方合体技：若可喝止（滚！），直接喝止
        if (targetTags.has('Fusion')) {
          const pick = counters.find(opt => opt.card.effectId === SkillEffect.CounterCancelFusion);
          if (pick) { autoResolve(pick, 'fusion -> counter-cancel-fusion'); return; }
        }
      }

      // Stone 场景：
      // - 若当前无可用技能，则用本地算法（至少等待 1s）
      // - 若存在可用技能，则仍向远端请求以获得更强策略（保留本地建议供日志/回退）
      if (scenario.kind === 'stone') {
        const hasSkills = collectPlayableSkills(gameState, PlayerEnum.WHITE).length > 0;
        cachedLocalSuggestion = scenario.localSuggestion ?? suggestLocalMove(gameState);
        if (!hasSkills) {
          const fallbackCenter = () => {
            const size = gameState.board.size;
            const center = Math.floor(size / 2);
            return { row: center, col: center };
          };
          const move = cachedLocalSuggestion
            ? { row: cachedLocalSuggestion.row, col: cachedLocalSuggestion.col }
            : fallbackCenter();

          aiLog.info('[local_ai:stone]', {
            move,
            summary: cachedLocalSuggestion ? formatLocalSuggestion(cachedLocalSuggestion) : '使用中心/启发式回退'
          });

          const descriptor = getScenarioMeta('stone');
          cycleProgressMessage({ kind: 'stone' } as AiScenario, descriptor.message);
          activeKeyRef.current = key;
          processedRef.current.add(key);
          timerRef.current = window.setTimeout(() => {
            if (activeKeyRef.current !== key) return;
            clearRunningTask();
            actions.placeStone(move.row, move.col);
          }, 1000);
          return;
        }
        // 存在可用技能时：保留远端落子评估路径，但继续保留本地建议供日志/对比
        if (cachedLocalSuggestion) {
          aiLog.info('[local_ai:suggest]', {
            move: { row: cachedLocalSuggestion.row, col: cachedLocalSuggestion.col },
            confidence: cachedLocalSuggestion.confidence,
            category: cachedLocalSuggestion.category,
            summary: formatLocalSuggestion(cachedLocalSuggestion)
          });
          if (shouldAutoplaySuggestion(cachedLocalSuggestion)) {
            aiLog.info('[local_ai:autoplay]', {
              move: { row: cachedLocalSuggestion.row, col: cachedLocalSuggestion.col },
              reason: cachedLocalSuggestion.reason
            });
            processedRef.current.add(key);
            clearRunningTask();
            actions.placeStone(cachedLocalSuggestion.row, cachedLocalSuggestion.col);
            return;
          }
          scenarioPayload = { ...scenario } as AiScenario;
        }
      }

      const descriptor = getScenarioMeta(scenarioPayload.kind);
      let attempts = 0;

      const schedule = (reason?: string) => {
        if (attempts >= 3) {
          aiLog.warn('多次尝试后仍未得到有效行动，使用保底策略');
          fallbackDecision(scenarioPayload, gameState, actions, cachedLocalSuggestion);
          processedRef.current.add(key);
          clearRunningTask();
          return;
        }

        attempts += 1;
        const baseDelay = (() => {
          switch (scenarioPayload.kind) {
            case 'counter_window':
              return 600;
            case 'skill':
              return 680;
            case 'stone':
              return 520;
            default:
              return 750;
          }
        })();
        const delay = reason ? 600 : baseDelay;
        cycleProgressMessage(scenarioPayload, descriptor.message, reason);
        aiLog.info(
          `[${scenarioPayload.kind}][attempt=${attempts}] ${descriptor.startLog}${reason ? `（原因：${reason}）` : ''}`
        );

        activeKeyRef.current = key;
        timerRef.current = window.setTimeout(async () => {
          if (activeKeyRef.current !== key) return;

          const feedbackMessage = reason;

          aiLog.info('[request_prepared]', {
            scenario: scenarioPayload.kind,
            attempt: attempts,
            feedback: feedbackMessage
          });

          const finalize = (extra?: { reason?: string }) => {
            processedRef.current.add(key);
            clearRunningTask(true, extra);
          };

          const rerun = (failReason: string) => {
            clearRunningTask(false);
            schedule(failReason);
          };

          const runFallback = () => {
            aiLog.warn(`[${scenarioPayload.kind}] ${descriptor.fallbackLog}`);
            fallbackDecision(scenarioPayload, gameState, actions, cachedLocalSuggestion);
            finalize();
          };

          if (!hasValidSettings(aiSettings)) {
            aiLog.warn('AI 设置未配置，使用保底逻辑');
            runFallback();
            return;
          }

          try {
            const decision = await requestAiDecision(aiSettings, scenarioPayload, { feedback: feedbackMessage });
            aiLog.info('[response_json]', decision);
            const outcome = decision
              ? applyDecision(decision, scenarioPayload, gameState, actions)
              : { success: false, reason: '未提供有效决策' };
            if (!outcome.success) {
              const reasonText = outcome.reason ?? '技能执行失败，需要重新决策';
              aiLog.warn(reasonText);
              rerun(reasonText);
              return;
            }
            aiLog.info(descriptor.successLog(outcome.detail));
            finalize();
          } catch (err) {
            aiLog.error('决策调用失败', err);
            runFallback();
          }
        }, delay);
      };

      schedule();
    };

    if (!gameState.aiEnabled) {
      clearRunningTask();
      return;
    }

    const scenarios = deriveScenarios(gameState);
    if (scenarios.length === 0) {
      clearRunningTask();
      return;
    }

    const pickNext = (): { scenario: AiScenario; key: string } | null => {
      for (const scenario of scenarios) {
        const key = buildScenarioKey(scenario, gameState);
        if (!processedRef.current.has(key) && activeKeyRef.current !== key) {
          return { scenario, key };
        }
      }
      return null;
    };

    const next = pickNext();
    if (!next) {
      clearRunningTask();
      return;
    }

    if (activeKeyRef.current && activeKeyRef.current !== next.key) {
      clearRunningTask(false);
    }

    startScenario(next.scenario, next.key);

    return () => {
      clearRunningTask(false);
    };
  }, [gameState, aiSettings, playCard, placeStone, resolveCard, selectTarget, updateAiStatus]);

  useEffect(() => () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressTimerRef.current !== null) {
      window.clearTimeout(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);
};

type AiActionHandlers = {
  playCard: (index: number) => void;
  placeStone: (row: number, col: number) => void;
  resolveCard: (countered: boolean, counterCard?: RawCard | null) => void;
  selectTarget: (selection: any) => void;
};

function collectPlayableSkills(state: GameStatus, player: Player): Array<{ handIndex: number; card: RawCard }> {
  if (state.turnCount + 1 < SKILL_UNLOCK_MOVE) return [];
  if (state.statuses.freeze[player] > 0) return [];
  const hand = state.hands[player] ?? [];
  const fusionLockTurn = state.statuses.fusionLock[player] ?? 0;
  const activeCharacter = state.characters[player];
  const activeCharacterId = activeCharacter ? String(activeCharacter._tid ?? activeCharacter.tid) : null;

  return hand.reduce<Array<{ handIndex: number; card: RawCard }>>((acc, card, index) => {
    const timing = (card.timing ?? '').toLowerCase();
    if (timing.includes('reaction') && !timing.includes('anytime')) {
      return acc;
    }

    const tags = parseTags(card.tags);
    if (tags.has('Fusion') && fusionLockTurn > state.turnCount) {
      return acc;
    }

    if (card.requiresCharacter) {
      const requiredId = String(card.requiresCharacter);
      if (!activeCharacterId || activeCharacterId !== requiredId) {
        return acc;
      }
    }

    if (isSkillCardPlayable(state, player, card)) {
      acc.push({ handIndex: index, card });
    }
    return acc;
  }, []);
}

function summariseBoardUrgency(board: GameStatus['board']): string | null {
  const whitePatterns = analyzeBoardForPlayer(board, PlayerEnum.WHITE);
  const blackPatterns = analyzeBoardForPlayer(board, PlayerEnum.BLACK);
  const notes: string[] = [];
  if (whitePatterns.winMoves.length > 0) {
    const cell = whitePatterns.winMoves[0];
    notes.push(`白方在 (${cell.row + 1}, ${cell.col + 1}) 落子即可形成五连。`);
  }
  if (blackPatterns.winMoves.length > 0) {
    const cell = blackPatterns.winMoves[0];
    notes.push(`黑方若在 (${cell.row + 1}, ${cell.col + 1}) 落子将成五，需立即阻挡。`);
  }
  if (blackPatterns.openFours.length > 0) {
    const cell = blackPatterns.openFours[0];
    notes.push(`黑方存在活四威胁，代表位置 (${cell.row + 1}, ${cell.col + 1})。`);
  }
  if (notes.length === 0 && whitePatterns.openFours.length > 0) {
    const cell = whitePatterns.openFours[0];
    notes.push(`白方可在 (${cell.row + 1}, ${cell.col + 1}) 构建活四。`);
  }
  return notes.length > 0 ? notes.join(' ') : null;
}

const deriveScenarios = (state: GameStatus): AiScenario[] => {
  if (!state.aiEnabled) return [];
  if (state.draft) return [];

  if (state.phase === GamePhaseEnum.CARD_TARGETING) {
    const request = state.targetRequest;
    if (request && request.actingPlayer === PlayerEnum.WHITE) {
      return [
        {
          kind: 'card_targeting',
          player: PlayerEnum.WHITE,
          request,
          game: state
        }
      ];
    }
    return [];
  }

  if (state.phase === GamePhaseEnum.COUNTER_WINDOW) {
    if (!state.pendingAction) return [];
    const window = state.counterWindow;
    if (window?.responder !== PlayerEnum.WHITE) return [];
    return [
      {
        kind: 'counter_window',
        player: PlayerEnum.WHITE,
        game: state,
        pendingCard: state.pendingAction,
        availableCounters: collectCounterOptions(state, PlayerEnum.WHITE)
      }
    ];
  }

  if (state.phase === GamePhaseEnum.PLAYING) {
    if (state.currentPlayer !== PlayerEnum.WHITE) return [];
    if (state.pendingAction || state.pendingCounter || state.targetRequest) return [];
    const note = summariseBoardUrgency(state.board);
    const skills = collectPlayableSkills(state, PlayerEnum.WHITE);
    const stoneAnalysis = buildStoneAnalysis(state.board);
    const localSuggestion = suggestLocalMove(state);
    const analysisParts = [stoneAnalysis, localSuggestion ? `本地分析：${formatLocalSuggestion(localSuggestion)}` : null]
      .filter(Boolean)
      .join('\n');
    const scenarios: AiScenario[] = [];
    if (skills.length > 0) {
      scenarios.push({
        kind: 'skill',
        player: PlayerEnum.WHITE,
        game: state,
        skills,
        contextNote: note ?? undefined
      });
    }
    scenarios.push({
      kind: 'stone',
      player: PlayerEnum.WHITE,
      game: state,
      contextNote: note ?? (skills.length === 0 ? '当前无可发动技能，需选择落子方案。' : undefined),
      analysis: analysisParts || undefined,
      localSuggestion: localSuggestion ?? undefined
    });
    return scenarios;
  }

  return [];
};

const buildScenarioKey = (scenario: AiScenario, state: GameStatus): string => {
  switch (scenario.kind) {
    case 'card_targeting':
      return `target:${state.targetRequest?.id ?? 'none'}`;
    case 'counter_window':
      return `counter:${state.pendingAction?.id ?? 'none'}:${state.counterWindow?.id ?? 'none'}:${scenario.availableCounters.map(item => item.handIndex).join(',')}`;
    case 'skill':
      return `skill:${state.aiTurnId}:${state.currentPlayer}:${scenario.skills.map(item => item.handIndex).join(',')}`;
    case 'stone':
      // Use aiTurnId as the authoritative token for actionable turns
      return `stone:${state.aiTurnId}:${scenario.player ?? state.currentPlayer}`;
    default:
      return `fallback:${Date.now()}`;
  }
};

interface DecisionOutcome {
  success: boolean;
  reason?: string;
  detail?: string;
}

const applyDecision = (
  decision: AiDecision,
  scenario: AiScenario,
  state: GameStatus,
  actions: AiActionHandlers
): DecisionOutcome => {
  switch (scenario.kind) {
    case 'skill':
      if (decision.kind === 'play_card') {
        const hand = state.hands[PlayerEnum.WHITE] ?? [];
        const index = resolveHandIndexForDecision(decision, hand);
        if (index !== null) {
          if (!scenario.skills.some(item => item.handIndex === index)) {
            return { success: false, reason: '所选手牌不在可发动技能列表中' };
          }
          const card = hand[index];
          actions.playCard(index);
          const cardLabel = card ? formatCardIdentifier(card) : `手牌索引 ${index}`;
          return { success: true, detail: `白方 AI 使用了 ${cardLabel}` };
        }
        return { success: false, reason: '无法匹配到指定的手牌' };
      }
      if (decision.kind === 'place_stone') {
        const move = resolveMoveFromDecision(decision, state.board, PlayerEnum.WHITE);
        if (move) {
          actions.placeStone(move.row, move.col);
          return { success: true, detail: `白方 AI 在 (${move.row + 1}, ${move.col + 1}) 落子` };
        }
        return { success: false, reason: '无法从返回的盘面解析出合法落子' };
      }
      if (decision.kind === 'pass') {
        aiLog.info('技能阶段模型选择暂不行动');
        return { success: false, reason: '技能阶段模型选择暂不行动' };
      }
      return { success: false, reason: '未识别的行动类型' };
    case 'stone':
      if (decision.kind === 'place_stone') {
        const move = resolveMoveFromDecision(decision, state.board, PlayerEnum.WHITE);
        if (move) {
          actions.placeStone(move.row, move.col);
          return { success: true, detail: `白方 AI 在 (${move.row + 1}, ${move.col + 1}) 落子` };
        }
        return { success: false, reason: '无法从返回的盘面解析出合法落子' };
      }
      return { success: false, reason: '未识别的行动类型' };
    case 'card_targeting':
      if (scenario.request.type === 'cell') {
        if (decision.kind === 'target_cell') {
          const cells = scenario.request.cells ?? [];
          const row = Number(decision.row);
          const col = Number(decision.col);
          if (isCellAllowed(cells, row, col)) {
            actions.selectTarget({ row, col });
            return { success: true, detail: `白方 AI 选择目标格 (${row + 1}, ${col + 1})` };
          }
          // 容错：若模型返回 1 基坐标，尝试转换为 0 基
          const row0 = row - 1;
          const col0 = col - 1;
          if (Number.isInteger(row0) && Number.isInteger(col0) && isCellAllowed(cells, row0, col0)) {
            aiLog.info('[target_correction] 模型使用了 1 基坐标，已自动更正', { from: { row, col }, to: { row: row0, col: col0 } });
            actions.selectTarget({ row: row0, col: col0 });
            return { success: true, detail: `白方 AI 选择目标格 (${row0 + 1}, ${col0 + 1})` };
          }
        }
        return { success: false, reason: '目标格不在可选列表中' };
      }
      if (scenario.request.type === 'snapshot') {
        if (decision.kind === 'target_snapshot' && scenario.request.options?.some(option => option.id === decision.id)) {
          actions.selectTarget({ id: decision.id });
          return { success: true, detail: `白方 AI 选择时间节点 ${decision.id}` };
        }
        return { success: false, reason: '时间节点不在可选列表中' };
      }
      return { success: false, reason: '未识别的目标类型' };
    case 'counter_window':
      if (decision.kind !== 'counter') {
        return { success: false, reason: '未返回反击指令' };
      }
      if (!decision.useCounter) {
        actions.resolveCard(false, null);
        return { success: true, detail: '白方 AI 放弃了反击' };
      }
      const counterIndex = resolveCounterIndex(decision, scenario.availableCounters);
      if (counterIndex === null) {
        return { success: false, reason: '未找到匹配的反击卡' };
      }
      const card = scenario.availableCounters[counterIndex].card;
      actions.resolveCard(true, card);
      return { success: true, detail: `白方 AI 使用 ${formatCardIdentifier(card)} 进行反击` };
    default:
      return { success: false, reason: '未知的场景类型' };
  }
};

const LINE_DIRECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1]
];

interface StonePatternSummary {
  winMoves: EmptyCell[];
  openFours: EmptyCell[];
  doubleThrees: Array<{ cell: EmptyCell; count: number }>;
  openThrees: EmptyCell[];
}

interface LineEvaluation {
  total: number;
  openEnds: number;
  isWin: boolean;
  isOpenFour: boolean;
  isOpenThree: boolean;
}

function analyzeBoardForPlayer(board: GameStatus['board'], player: Player): StonePatternSummary {
  const winMoves: EmptyCell[] = [];
  const openFours: EmptyCell[] = [];
  const doubleThrees: Array<{ cell: EmptyCell; count: number }> = [];
  const openThrees: EmptyCell[] = [];
  const empties = collectEmptyCells(board);

  empties.forEach(cell => {
    let isWin = false;
    let hasOpenFour = false;
    let openThreeCount = 0;

    LINE_DIRECTIONS.forEach(([dr, dc]) => {
      const evaluation = evaluateLine(board, cell, player, dr, dc);
      if (evaluation.isWin) isWin = true;
      if (evaluation.isOpenFour) hasOpenFour = true;
      if (evaluation.isOpenThree) openThreeCount += 1;
    });

    if (isWin) {
      winMoves.push(cell);
      return;
    }

    if (hasOpenFour) {
      openFours.push(cell);
    }

    if (openThreeCount >= 2) {
      doubleThrees.push({ cell, count: openThreeCount });
    } else if (openThreeCount === 1) {
      openThrees.push(cell);
    }
  });

  return { winMoves, openFours, doubleThrees, openThrees };
}

function evaluateLine(
  board: GameStatus['board'],
  cell: EmptyCell,
  player: Player,
  dr: number,
  dc: number
): LineEvaluation {
  let forward = 0;
  let backward = 0;
  let r = cell.row + dr;
  let c = cell.col + dc;
  while (isWithinBoard(board, r, c) && board.get(r, c) === player) {
    forward += 1;
    r += dr;
    c += dc;
  }
  const forwardOpen = isWithinBoard(board, r, c) && board.get(r, c) === null;

  r = cell.row - dr;
  c = cell.col - dc;
  while (isWithinBoard(board, r, c) && board.get(r, c) === player) {
    backward += 1;
    r -= dr;
    c -= dc;
  }
  const backwardOpen = isWithinBoard(board, r, c) && board.get(r, c) === null;

  const total = 1 + forward + backward;
  const openEnds = (forwardOpen ? 1 : 0) + (backwardOpen ? 1 : 0);

  const isWin = total >= 5;
  const isOpenFour = total === 4 && openEnds === 2;
  const isOpenThree = total === 3 && openEnds === 2;

  return { total, openEnds, isWin, isOpenFour, isOpenThree };
}

function buildStoneAnalysis(board: GameStatus['board']): string | null {
  const white = analyzeBoardForPlayer(board, PlayerEnum.WHITE);
  const black = analyzeBoardForPlayer(board, PlayerEnum.BLACK);
  const lines: string[] = [
    '现在你是白方，需要在以下目标之间选择：形成五连、阻止黑方成五、构建活四 / 活三 / 双三。'
  ];

  lines.push(formatPatternLine('白方成五机会', white.winMoves));
  lines.push(formatPatternLine('白方活四机会', white.openFours));
  lines.push(formatPatternLine('白方双三机会', white.doubleThrees.map(item => item.cell)));
  lines.push(formatPatternLine('白方活三铺垫', white.openThrees));

  lines.push(formatPatternLine('黑方成五威胁', black.winMoves));
  lines.push(formatPatternLine('黑方活四威胁', black.openFours));
  lines.push(formatPatternLine('黑方双三威胁', black.doubleThrees.map(item => item.cell)));
  lines.push(formatPatternLine('黑方活三铺垫', black.openThrees));

  const meaningful = lines.filter(Boolean);
  if (meaningful.length <= 1) return meaningful[0] ?? null;
  return meaningful.join('\n');
}

function formatPatternLine(label: string, cells: EmptyCell[]): string {
  if (cells.length === 0) return '';
  const formatted = formatCells(cells);
  return `${label}: ${formatted}`;
}

function formatCells(cells: EmptyCell[], limit = 5): string {
  const picks = cells.slice(0, limit).map(cell => `(${cell.row + 1}, ${cell.col + 1})`);
  if (cells.length > limit) {
    picks.push(`... 共 ${cells.length} 处`);
  }
  return picks.join(' / ');
}

function isSkillCardPlayable(state: GameStatus, player: Player, card: RawCard): boolean {
  const effectId = card.effectId ? String(card.effectId) : '';
  switch (effectId) {
    case SkillEffect.RemoveToShichahai:
      return hasBoardMatch(state.board, cellPlayer => cellPlayer === getOpponent(player));
    case SkillEffect.CleanSweep:
      return hasBoardMatch(state.board, cellPlayer => cellPlayer !== null);
    case SkillEffect.TimeRewind:
      return state.timeline.some(entry => entry.turn > 0);
    case SkillEffect.SummonCharacter: {
      const params = parseEffectParams(card.effectParams);
      const targetId = params.character != null ? String(params.character) : null;
      const current = state.characters[player];
      if (!targetId) return !current;
      const currentId = current ? String(current._tid ?? current.tid) : null;
      return currentId !== targetId;
    }
    case SkillEffect.ForceExit: {
      const params = parseEffectParams(card.effectParams);
      const targetId = params.target != null ? String(params.target) : null;
      const opponentChar = state.characters[getOpponent(player)];
      if (!opponentChar) return false;
      if (!targetId) return true;
      const opponentId = String(opponentChar._tid ?? opponentChar.tid);
      return opponentId === targetId;
    }
    default:
      return true;
  }
}

function hasBoardMatch(board: GameStatus['board'], predicate: (cellPlayer: Player | null) => boolean): boolean {
  let matched = false;
  board.forEachCell((_row, _col, value) => {
    if (!matched && predicate(value)) {
      matched = true;
    }
  });
  return matched;
}

interface EmptyCell {
  row: number;
  col: number;
}

function collectEmptyCells(board: GameStatus['board']): EmptyCell[] {
  const cells: EmptyCell[] = [];
  board.forEachCell((row, col, value) => {
    if (value === null) cells.push({ row, col });
  });
  return cells;
}

function scorePlacement(board: GameStatus['board'], cell: EmptyCell, player: Player): number {
  let best = 1;
  LINE_DIRECTIONS.forEach(([dr, dc]) => {
    let count = 1;
    let r = cell.row + dr;
    let c = cell.col + dc;
    while (r >= 0 && r < board.size && c >= 0 && c < board.size && board.get(r, c) === player) {
      count += 1;
      r += dr;
      c += dc;
    }
    r = cell.row - dr;
    c = cell.col - dc;
    while (r >= 0 && r < board.size && c >= 0 && c < board.size && board.get(r, c) === player) {
      count += 1;
      r -= dr;
      c -= dc;
    }
    if (count > best) best = count;
  });
  return best;
}

function pickBestCandidate(
  board: GameStatus['board'],
  empties: EmptyCell[],
  player: Player,
  focus: number
): { cell: EmptyCell | null; score: number } {
  let bestScore = 0;
  let bestCell: EmptyCell | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  empties.forEach(cell => {
    const score = scorePlacement(board, cell, player);
    if (score === 0) return;
    const distance = Math.abs(cell.row - focus) + Math.abs(cell.col - focus);
    if (score > bestScore || (score === bestScore && distance < bestDistance)) {
      bestScore = score;
      bestCell = cell;
      bestDistance = distance;
    }
  });

  return { cell: bestCell, score: bestScore };
}

const fallbackDecision = (
  scenario: AiScenario,
  state: GameStatus,
  actions: AiActionHandlers,
  localSuggestion?: LocalMoveSuggestion | null
) => {
  switch (scenario.kind) {
    case 'stone':
      fallbackPlaceStone(state, actions, localSuggestion ?? null);
      break;
    case 'skill':
      if (scenario.skills.length > 0) {
        const fallbackSkill = scenario.skills[0];
        aiLog.info(`默认使用可发动技能 ${formatCardIdentifier(fallbackSkill.card)} (手牌索引 ${fallbackSkill.handIndex})`);
        actions.playCard(fallbackSkill.handIndex);
      } else {
        fallbackPlaceStone(state, actions, null);
      }
      break;
    case 'card_targeting':
      if (scenario.request.type === 'cell') {
        const target = scenario.request.cells?.[0];
        if (target) {
          aiLog.info(`默认选择目标格 (${target.row + 1}, ${target.col + 1})`);
          actions.selectTarget({ row: target.row, col: target.col });
        }
      } else if (scenario.request.type === 'snapshot') {
        const option = scenario.request.options?.[0];
        if (option) {
          aiLog.info(`默认选择时间节点 ${option.id}`);
          actions.selectTarget({ id: option.id });
        }
      }
      break;
    case 'counter_window':
      aiLog.info('默认放弃反击');
      actions.resolveCard(false, null);
      break;
    default:
      break;
  }
};

const collectCounterOptions = (state: GameStatus, responder: Player): Array<{ handIndex: number; card: RawCard }> => {
  if (!state.pendingAction) return [];
  const raw = state.pendingAction.card.counteredBy;
  const ids: string[] = (() => {
    if (Array.isArray(raw)) return raw.map(item => String(item).trim()).filter(Boolean);
    if (typeof raw === 'string') return raw.split('|').map(item => item.trim()).filter(Boolean);
    if (raw == null) return [];
    return [String(raw).trim()].filter(Boolean);
  })();
  if (ids.length === 0) return [];
  const hand = state.hands[responder] ?? [];
  const matches: Array<{ handIndex: number; card: RawCard }> = [];
  hand.forEach((card, index) => {
    const tid = String(card._tid ?? card.tid);
    const effectId = card.effectId ? String(card.effectId) : null;
    if (ids.includes(tid) || (effectId && ids.includes(effectId))) {
      matches.push({ handIndex: index, card });
    }
  });
  return matches;
};

const fallbackPlaceStone = (
  state: GameStatus,
  actions: AiActionHandlers,
  localSuggestion: LocalMoveSuggestion | null = null
) => {
  if (localSuggestion) {
    aiLog.info('[fallback_local_ai]', {
      move: { row: localSuggestion.row, col: localSuggestion.col },
      summary: formatLocalSuggestion(localSuggestion)
    });
    actions.placeStone(localSuggestion.row, localSuggestion.col);
    return;
  }

  const size = state.board.size;
  const center = Math.floor(size / 2);
  if (state.board.history.length === 0 && state.board.get(center, center) === null) {
    aiLog.info(`默认落子在中心 (${center + 1}, ${center + 1})`);
    actions.placeStone(center, center);
    return;
  }

  const empties = collectEmptyCells(state.board);
  if (empties.length === 0) return;

  const selfBest = pickBestCandidate(state.board, empties, PlayerEnum.WHITE, center);
  const opponentBest = pickBestCandidate(state.board, empties, PlayerEnum.BLACK, center);

  let chosen: EmptyCell | null = null;
  let message: string | null = null;

  if (selfBest.cell && selfBest.score >= 5) {
    chosen = selfBest.cell;
    message = `默认策略：完成潜在五连，选择 (${chosen.row + 1}, ${chosen.col + 1})`;
  } else if (opponentBest.cell && opponentBest.score >= 4) {
    chosen = opponentBest.cell;
    message = `默认策略：阻挡黑方 ${opponentBest.score} 连线，选择 (${chosen.row + 1}, ${chosen.col + 1})`;
  } else if (selfBest.cell && selfBest.score >= Math.max(3, opponentBest.score)) {
    chosen = selfBest.cell;
    message = `默认策略：扩展白方连线 (${selfBest.score})，选择 (${chosen.row + 1}, ${chosen.col + 1})`;
  } else if (opponentBest.cell) {
    chosen = opponentBest.cell;
    message = `默认策略：干扰黑方连线 (${opponentBest.score})，选择 (${chosen.row + 1}, ${chosen.col + 1})`;
  } else {
    chosen = empties[0];
    message = `默认策略：使用可用空位 (${chosen.row + 1}, ${chosen.col + 1})`;
  }

  if (!chosen) return;

  aiLog.info(message);
  actions.placeStone(chosen.row, chosen.col);
};

const deriveMoveFromBoardMatrix = (
  matrix: number[][],
  board: GameStatus['board'],
  player: Player
): { row: number; col: number } | null => {
  if (!Array.isArray(matrix) || matrix.length !== board.size) return null;
  let candidate: { row: number; col: number } | null = null;
  for (let row = 0; row < board.size; row++) {
    const matrixRow = matrix[row];
    if (!Array.isArray(matrixRow) || matrixRow.length !== board.size) return null;
    for (let col = 0; col < board.size; col++) {
      const current = board.get(row, col);
      const encoded = current === null ? 0 : current === PlayerEnum.BLACK ? 1 : 2;
      const target = Number(matrixRow[col]);
      if (!Number.isFinite(target) || ![0, 1, 2].includes(target)) return null;
      if (encoded === target) continue;
      const expectedPlayerValue = player === PlayerEnum.WHITE ? 2 : 1;
      if (encoded === 0 && target === expectedPlayerValue) {
        if (candidate) {
          return null; // 多于一个落子
        }
        candidate = { row, col };
        continue;
      }
      return null; // 非法变动
    }
  }
  return candidate;
};

type PlaceStoneDecision = Extract<AiPlayingDecision, { kind: 'place_stone' }>;

const resolveMoveFromDecision = (
  decision: PlaceStoneDecision,
  board: GameStatus['board'],
  player: Player
): { row: number; col: number } | null => {
  if ('board' in decision && decision.board) {
    return deriveMoveFromBoardMatrix(decision.board, board, player);
  }
  if ('row' in decision && 'col' in decision) {
    const row = Number(decision.row);
    const col = Number(decision.col);
    if (
      Number.isInteger(row) &&
      Number.isInteger(col) &&
      isWithinBoard(board, row, col)
    ) {
      if (board.get(row, col) === null) {
        return { row, col };
      }
    }
  }
  return null;
};

const resolveHandIndexForDecision = (
  decision: { handIndex?: number; cardId?: string },
  hand: RawCard[]
): number | null => {
  if (typeof decision.handIndex === 'number') {
    const idx = decision.handIndex;
    if (idx >= 0 && idx < hand.length) return idx;
  }
  if (decision.cardId) {
    const targetId = decision.cardId.trim().toLowerCase();
    const index = hand.findIndex(card => matchesCardIdentifier(card, targetId));
    if (index >= 0) return index;
  }
  return null;
};

const resolveCounterIndex = (
  decision: { handIndex?: number; cardId?: string },
  options: Array<{ handIndex: number; card: RawCard }>
): number | null => {
  if (typeof decision.handIndex === 'number') {
    const idx = options.findIndex(option => option.handIndex === decision.handIndex);
    if (idx >= 0) return idx;
  }
  if (decision.cardId) {
    const targetId = decision.cardId.trim().toLowerCase();
    const idx = options.findIndex(option => matchesCardIdentifier(option.card, targetId));
    if (idx >= 0) return idx;
  }
  return null;
};

const matchesCardIdentifier = (card: RawCard, identifier: string): boolean => {
  const candidates = [card._tid, card.tid, card.effectId, card.nameZh, card.nameEn]
    .filter(Boolean)
    .map(value => String(value).trim().toLowerCase());
  return candidates.includes(identifier);
};

const formatCardIdentifier = (card: RawCard): string => {
  const id = card._tid ?? card.tid ?? card.effectId;
  if (card.nameZh) {
    return `${card.nameZh}${id ? ` (#${id})` : ''}`;
  }
  if (card.nameEn) {
    return `${card.nameEn}${id ? ` (#${id})` : ''}`;
  }
  return id ? `卡牌 ${id}` : '未知卡牌';
};

const isWithinBoard = (board: GameStatus['board'], row: number, col: number) =>
  Number.isInteger(row) && Number.isInteger(col) && row >= 0 && col >= 0 && row < board.size && col < board.size;

const isCellAllowed = (cells: Array<{ row: number; col: number }>, row: number, col: number) =>
  cells.some(cell => cell.row === row && cell.col === col);

const countStones = (board: GameStatus['board']): [number, number] => {
  const counts: [number, number] = [0, 0];
  board.forEachCell((_row, _col, value) => {
    if (value === PlayerEnum.BLACK) counts[PlayerEnum.BLACK]++;
    if (value === PlayerEnum.WHITE) counts[PlayerEnum.WHITE]++;
  });
  return counts;
};

const partitionShichahai = (entries: GameStatus['shichahai']): Record<Player, typeof entries> => ({
  [PlayerEnum.BLACK]: entries.filter(entry => entry.owner === PlayerEnum.BLACK),
  [PlayerEnum.WHITE]: entries.filter(entry => entry.owner === PlayerEnum.WHITE)
});



const rootElement = document.getElementById('root') ?? document.getElementById('app');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
} else {
  console.error('[game07] 未找到挂载节点 root/app，UI 未能初始化');
}
