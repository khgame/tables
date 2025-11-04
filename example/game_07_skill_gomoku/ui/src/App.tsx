import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  RulesIntroPanel,
  CardFlyingAnimation,
  MusicToggle
} from './components';
import type { FlyingCardData } from './components';
import { useGameEngine } from './core/gameEngine';
import type { GameData } from './app/utils/data';
import { fetchGameData } from './app/utils/data';
import { PLAYER_NAMES, PlayerEnum, SKILL_UNLOCK_MOVE, getOpponent, GamePhaseEnum } from './core/constants';
import { parseTags, parseEffectParams } from './core/utils';
import type { AiSettings, AiScenario } from './ai/openAiClient';
import { hasValidSettings } from './ai/openAiClient';
import { useAIActions } from './ai/useAIActions';
import type { GameStatus, Player, RawCard } from './types';
import './styles/tailwind.css';
import { AiSettingsTrigger } from './app/components/AiSettingsTrigger';
import { useBackgroundMusic } from './app/hooks/useBackgroundMusic';
import { useSoundEffects } from './app/hooks/useSoundEffects';
import { useVisualEffects } from './app/hooks/useVisualEffects';
import { useAutoResolvePending } from './app/hooks/useAutoResolvePending';
import { useWinPresentation } from './app/hooks/useWinPresentation';
import { useInactivityPrompt } from './app/hooks/useInactivityPrompt';

// Utility for conditional classnames
const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

// 导入智能路由和监控测试 (仅在开发环境)
if (import.meta.env.DEV) {
  import('./ai/tests');
  import('./ai/debug');
}

// 数据加载已抽离到 app/utils/data.ts，并做了基本的类型守卫

const App: React.FC = () => {
  const [data, setData] = useState<GameData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCounter, setSelectedCounter] = useState<RawCard | null>(null);
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const [boardBlockedFeedback, setBoardBlockedFeedback] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ scenario: AiScenario['kind'] | null; message: string; reason?: string }>({
    scenario: null,
    message: ''
  });
  const [hoveredPosition, setHoveredPosition] = useState<{ row: number; col: number } | null>(null);
  const [skillTargetPosition, setSkillTargetPosition] = useState<{ row: number; col: number } | null>(null); // 技能目标位置高亮
  const winAnimTimersRef = useRef<number[]>([]);
  // 背景音乐（默认开启，浏览器如拦截则在用户交互后恢复）
  const bgm = useBackgroundMusic();
  const sfx = useSoundEffects();
  const playedSfxRef = useRef<Set<string>>(new Set());
  // 落子音效：检测棋谱长度变化（在 engine 初始化之后挂载）
  const lastHistoryLenRef = useRef(0);
  // AI 互动：头像气泡 & 玩家久未行动跟踪
  const [aiBubble, setAiBubble] = useState<{ id: string; text: string; tone?: 'prompt' | 'praise' | 'taunt' | 'info' | 'frustrated' } | null>(null);
  const [playerBubble, setPlayerBubble] = useState<{ id: string; text: string } | null>(null);
  const [playerInactivityLevel, setPlayerInactivityLevel] = useState<0 | 1 | 2>(0);
  const lastPlayerActionRef = useRef<number>(Date.now());
  const inactivityTimersRef = useRef<number[]>([]);
  const aiVictoryShownRef = useRef(false);
  // 飞行卡牌动画状态
  const [flyingCards, setFlyingCards] = useState<FlyingCardData[]>([]);
  const opponentHandRef = useRef<HTMLDivElement>(null);
  const playerHandRef = useRef<HTMLDivElement>(null);
  const draftPanelRef = useRef<HTMLDivElement>(null);
  // 占位，稍后在拿到 gameState 后再调用相关 hooks
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
  const { gameState, startGame, placeStone, playCard, selectTarget, resolveCard, cancelPending, selectDraftOption, advanceTurnIfBlocked } = engine;
  const isPlayerTurn = gameState.currentPlayer === PlayerEnum.BLACK;
  // 基于 gameState 的副作用 hooks（必须在 engine 初始化之后调用）
  const activeVisuals = useVisualEffects(gameState);
  const visualsActive = activeVisuals.length > 0;
  // 落子音效：检测棋谱长度变化
  useEffect(() => {
    const len = gameState.board.history.length;
    if (len > lastHistoryLenRef.current) {
      try { sfx.playPlace(); } catch {}
    }
    lastHistoryLenRef.current = len;
  }, [gameState.board.history.length]);
  // 在视觉事件发生时播放简单效果音（可在设置里关闭/调节）
  useEffect(() => {
    activeVisuals.forEach(ev => {
      if (!playedSfxRef.current.has(ev.id)) {
        sfx.playForEvent(ev);
        playedSfxRef.current.add(ev.id);
        if (playedSfxRef.current.size > 64) {
          const first = playedSfxRef.current.values().next().value as string | undefined;
          if (first) playedSfxRef.current.delete(first);
        }
      }
    });
  }, [activeVisuals, sfx]);
  const { showFinalPanel, winLineLit } = useWinPresentation(gameState);
  useAutoResolvePending(gameState, resolveCard);
  // 玩家久未行动提示（气泡 + 棋盘轻晃）
  useInactivityPrompt({
    gameState,
    isPlayerTurn,
    lastPlayerActionRef,
    setAiBubble,
    setBoardBlockedFeedback,
    setPlayerInactivityLevel
  });

  useEffect(() => {
    setSelectedCounter(null);
  }, [gameState.pendingAction?.id]);

  // 监听pendingAction的变化，提取并高亮技能目标位置
  useEffect(() => {
    if (gameState.pendingAction?.selection) {
      const sel = gameState.pendingAction.selection;
      if ('row' in sel && 'col' in sel && typeof sel.row === 'number' && typeof sel.col === 'number') {
        setSkillTargetPosition({ row: sel.row, col: sel.col });
      } else {
        setSkillTargetPosition(null);
      }
    } else {
      setSkillTargetPosition(null);
    }
  }, [gameState.pendingAction]);


  useAIActions(gameState, { playCard, placeStone, resolveCard, selectTarget, advanceTurnIfBlocked }, aiSettings, updateAiStatus, visualsActive);

  // 进入 PLAYING 阶段即尝试播放 BGM（兼容非 AI 开局）
  useEffect(() => {
    if (gameState.phase === GamePhaseEnum.PLAYING && !bgm.isPlaying) {
      try { bgm.play(); } catch {}
    }
  }, [gameState.phase]);

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

  // 胜负展示由 useWinPresentation 管理


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
            onStartAi={() => {
              // 允许无大模型配置直接开始（本地策略运行）
              if (!hasValidSettings(aiSettings)) {
                // 给出一个轻提示：使用本地 AI
                const id = `ai-bubble-${Date.now()}`;
                setAiBubble({ id, text: '未配置云端 AI，将使用本地策略' });
                window.setTimeout(() => setAiBubble(prev => (prev && prev.id === id ? null : prev)), 1600);
              }
              try { bgm.play(); } catch {}
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
          height: '100vh',
          maxHeight: '100vh',
          padding: 'clamp(0.6rem, 1vw, 1rem)'
        }}>
          <div className="h-full grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(320px,380px)', gap: 'clamp(1rem,1.5vw,2rem)', padding: 'clamp(0.6rem, 1vw, 1.2rem)' }}>
            {/* 左列：改为覆盖式布局，棋盘独立垂直居中，HUD 不影响棋盘位置 */}
            <div className="relative h-full min-w-0">
              {/* 棋盘舞台：上下预留 HUD 空间，并略微向上偏移中心 */}
              <div className={cx('absolute inset-0 flex items-center justify-center', boardBlockedFeedback && 'animate-board-shudder')} style={{
                paddingTop: '6rem', paddingBottom: '9rem'
              }}>
                {/* Ambient glow behind board */}
                <div className="absolute inset-[8%] rounded-full opacity-60" style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.08), transparent 70%)',
                  filter: 'blur(40px)'
                }} />

                {/* Board container */}
                <div className="relative w-full flex items-center justify-center max-w-[min(72vh,70vw)] aspect-square">
                  <Board
                    board={board}
                    onCellClick={(r,c) => { if (!visualsActive) placeStone(r,c); }}
                    disabled={
                      phase !== GamePhaseEnum.PLAYING ||
                      !isPlayerTurn ||
                      visualsActive ||
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
                    removedCells={activeVisuals
                      .filter(ev => ev.effectId === 'remove-to-shichahai' && ev.cell && typeof ev.cell.row === 'number' && typeof ev.cell.col === 'number')
                      .map(ev => ({ row: ev.cell!.row, col: ev.cell!.col, owner: (ev.owner ?? PlayerEnum.BLACK) as Player }))}
                  />
                  <SkillEffectLayer events={activeVisuals} />
                </div>
                {renderDraft()}
                {targetRequest && targetRequest.type === 'snapshot' && (
                  <SnapshotSelector request={targetRequest} onSelect={(sel) => selectTarget(sel)} />
                )}
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
                        isInstant={Boolean(pendingAction.metadata?.uiInstant)}
                        confirmMs={7000}
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

              {/* 顶部覆盖：对手 HUD，不影响棋盘几何位置 */}
              <div className="absolute left-0 right-0 top-0 pointer-events-none">
                <div className="pointer-events-auto">
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
              </div>

              {/* 底部覆盖：我方 HUD，不影响棋盘几何位置 */}
              <div className="absolute left-0 right-0 bottom-0 pointer-events-none">
                <div className="pointer-events-auto -mb-2 md:-mb-4">
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
                    align="end"
                    className="pr-4 md:pr-8"
                  />
                </div>
              </div>
            </div>

            {/* 右列：对手面板 / 日志 / 玩家面板 */}
            <div className="grid h-full w-[360px] max-w-[380px] min-w-[320px]" style={{ gridTemplateRows: 'auto minmax(0,1fr) auto', rowGap: 'clamp(0.6rem,1vw,1.2rem)' }}>
              <div>
                <ZonePanel
                  title="墓地 / 什刹海"
                  graveyard={enemyGraveyard}
                  shichahai={shichahaiByPlayer[PlayerEnum.WHITE]}
                  variant="opponent"
                />
              </div>
              <div className="min-h-0">
                <GameLog
                  logs={logs}
                  onPositionHover={setHoveredPosition}
                  turnCount={gameState.turnCount}
                  currentPlayer={gameState.currentPlayer}
                  playerNames={PLAYER_NAMES}
                />
              </div>
              <div>
                <ZonePanel
                  title="墓地 / 什刹海"
                  graveyard={playerGraveyard}
                  shichahai={shichahaiByPlayer[PlayerEnum.BLACK]}
                  variant="player"
                />
              </div>
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
      fastModel: DEFAULT_MODEL,
      customPrompt: ''
    };
  }
  try {
    const raw = window.localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return {
        endpoint: DEFAULT_AI_ENDPOINT,
        apiKey: '',
        reasoningModel: DEFAULT_MODEL,
        fastModel: DEFAULT_MODEL,
        customPrompt: ''
      };
    }
    const parsed = JSON.parse(raw);
    return {
      endpoint: parsed.endpoint ?? DEFAULT_AI_ENDPOINT,
      apiKey: parsed.apiKey ?? '',
      reasoningModel: parsed.reasoningModel ?? parsed.model ?? DEFAULT_MODEL,
      fastModel: parsed.fastModel ?? DEFAULT_MODEL,
      customPrompt: parsed.customPrompt ?? ''
    };
  } catch (err) {
    console.warn('[game07] failed to load AI settings', err);
    return {
      endpoint: DEFAULT_AI_ENDPOINT,
      apiKey: '',
      reasoningModel: DEFAULT_MODEL,
      fastModel: DEFAULT_MODEL,
      customPrompt: ''
    };
  }
};

const countStones = (board: GameStatus['board']): [number, number] => {
  const counts: [number, number] = [0, 0];
  board.forEachCell((_row, _col, value) => {
    if (value === PlayerEnum.BLACK) counts[PlayerEnum.BLACK]++;
    if (value === PlayerEnum.WHITE) counts[PlayerEnum.WHITE]++;
  });
  return counts;
};

const asPlayerRecord = <T,>(black: T, white: T): Record<Player, T> => (
  { [PlayerEnum.BLACK]: black, [PlayerEnum.WHITE]: white } as unknown as Record<Player, T>
);

const partitionShichahai = (entries: GameStatus['shichahai']): Record<Player, typeof entries> =>
  asPlayerRecord(
    entries.filter(entry => entry.owner === PlayerEnum.BLACK),
    entries.filter(entry => entry.owner === PlayerEnum.WHITE)
  );




export default App;
