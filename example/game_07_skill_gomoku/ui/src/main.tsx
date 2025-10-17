import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Board,
  GameLog,
  MulliganPanel,
  PendingCardPanel,
  SnapshotSelector,
  ZonePanel,
  OpponentHUD,
  PlayerHUD,
  CardPreviewOverlay,
  SkillEffectLayer,
  AiSettingsPanel
} from './components';
import { useGameEngine } from './core/gameEngine';
import { PLAYER_NAMES, PlayerEnum, SKILL_UNLOCK_MOVE, getOpponent, GamePhaseEnum } from './core/constants';
import type { AiSettings, AiScenario, AiDecision } from './ai/openAiClient';
import { hasValidSettings, requestAiDecision } from './ai/openAiClient';
import type { GameStatus, Player, RawCard, VisualEffectEvent } from './types';
import './styles.css';

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
  const [previewCard, setPreviewCard] = useState<RawCard | null>(null);
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const [boardBlockedFeedback, setBoardBlockedFeedback] = useState(false);
  const [activeVisuals, setActiveVisuals] = useState<VisualEffectEvent[]>([]);
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ scenario: AiScenario['kind'] | null; message: string; reason?: string }>({
    scenario: null,
    message: ''
  });
  const visualTracker = useRef<Set<string>>(new Set());
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
  const { gameState, startGame, completeMulligan, placeStone, playCard, selectTarget, resolveCard } = engine;

  useEffect(() => {
    setSelectedCounter(null);
  }, [gameState.pendingAction?.id]);

  useEffect(() => {
    gameState.visuals.forEach(event => {
      if (!visualTracker.current.has(event.id)) {
        visualTracker.current.add(event.id);
        setActiveVisuals(prev => [...prev, event]);
        window.setTimeout(() => {
          visualTracker.current.delete(event.id);
          setActiveVisuals(prev => prev.filter(item => item.id !== event.id));
        }, 1600);
      }
    });
  }, [gameState.visuals]);

  useAIActions(
    gameState,
    { playCard, placeStone, resolveCard, completeMulligan, selectTarget },
    aiSettings,
    updateAiStatus
  );

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

  useEffect(() => {
    if (gameState.phase !== GamePhaseEnum.COUNTER_WINDOW) return;
    if (!gameState.pendingAction) return;
    if (responder === PlayerEnum.BLACK) return;
    const timer = window.setTimeout(() => {
      resolveCard(false, null);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [gameState.phase, gameState.pendingAction, responder, resolveCard]);

  const renderMulligan = () => {
    const player = gameState.mulligan.current;
    const card = player !== null ? gameState.hands[player]?.[0] ?? null : null;
    const hidden = player === PlayerEnum.WHITE;
    return (
      <div className="mulligan-overlay" role="dialog" aria-label="调度阶段">
        <div className="mulligan-overlay__panel">
          <div className="mulligan-overlay__title">调度阶段</div>
          <MulliganPanel
            player={player ?? PlayerEnum.BLACK}
            card={hidden ? null : card}
            onKeep={() => completeMulligan({ replace: false })}
            onReplace={() => completeMulligan({ replace: true })}
            hidden={hidden}
          />
        </div>
      </div>
    );
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

  const { phase, board, currentPlayer, hands, logs, pendingAction, targetRequest, aiEnabled, moveCount, statuses } = gameState;
  const isPlayerTurn = currentPlayer === PlayerEnum.BLACK;

  if (phase === GamePhaseEnum.SETUP) {
    return (
      <>
        <div className="h-screen overflow-auto p-6 flex flex-col items-center justify-center space-y-6">
          <header className="text-center space-y-2 relative">
            <AiSettingsTrigger onOpen={setIsSettingsOpen} hasConfig={hasValidSettings(aiSettings)} />
            <h1 className="font-display text-6xl text-amber-200 drop-shadow-2xl">技能五子棋</h1>
          </header>
          <div className="max-w-2xl text-center bg-white/90 p-8 rounded-3xl shadow-2xl space-y-6 text-stone-900">
            <h2 className="text-3xl font-bold">游戏规则</h2>
            <div className="text-left space-y-2 text-gray-700">
              <p>• 15×15 棋盘连成五子获胜</p>
              <p>• 开局调度：可换掉唯一手牌（进入墓地）再抽新牌</p>
              <p>• 每累计 3 次落子为下一位玩家抽牌</p>
              <p>• 第 {SKILL_UNLOCK_MOVE} 步起解锁技能卡（冻结/跳过会影响回合）</p>
              <p>• 合体技需张兴朝在场，本回合召唤后需等待一回合</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={() => {
                  if (!hasValidSettings(aiSettings)) {
                    setIsSettingsOpen(true);
                    return;
                  }
                  startGame(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                开始 AI 对战
              </button>
            </div>
          </div>
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

  const enemyHandCount = (hands[PlayerEnum.WHITE] ?? []).length;
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
    playCard(sourceIndex);
    setDraggedCardIndex(null);
    setPreviewCard(null);
  };

  const handlePlayerCardHover = (card: RawCard | null) => {
    if (card) {
      setPreviewCard(card);
    } else if (draggedCardIndex === null) {
      setPreviewCard(null);
    }
  };

  return (
    <>
      <div className="game-stage">
        <AiSettingsTrigger onOpen={setIsSettingsOpen} hasConfig={hasValidSettings(aiSettings)} />
        <div className="game-stage__backdrop" />
        <div className="game-stage__halo game-stage__halo--left" />
        <div className="game-stage__halo game-stage__halo--right" />
        <div className="game-stage__overlay" />
        <div className="game-frame">
          <div className="game-grid">
          <aside className="game-grid__left">
            <ZonePanel
              title="墓地 / 什刹海"
              graveyard={enemyGraveyard}
              shichahai={shichahaiByPlayer[PlayerEnum.WHITE]}
              variant="opponent"
            />
          </aside>
          <div className="game-grid__opponent">
            <OpponentHUD
              handCount={enemyHandCount}
              graveyardCount={enemyGraveyard.length}
              shichahaiCount={shichahaiByPlayer[PlayerEnum.WHITE].length}
              moveCount={moveCount[PlayerEnum.WHITE] ?? 0}
          stonesCount={stonesByPlayer[PlayerEnum.WHITE]}
          characters={gameState.characters}
          statuses={statuses}
          isCurrent={currentPlayer === PlayerEnum.WHITE}
          aiStatus={aiStatus}
            />
          </div>
          <section className={`game-grid__board ${draggedCardIndex !== null ? 'game-grid__board--dragging' : ''}`}>
      <div className={`board-stage ${boardBlockedFeedback ? 'board-stage--blocked-feedback' : ''}`}>
        <div className="board-stage__ambient" />
        <div className="board-stage__inner">
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
            onTargetSelect={selectTarget}
            className="board-stage__board"
            style={{ aspectRatio: '1 / 1' }}
            onCardDrop={handleCardDropOnBoard}
            onBlockedInteract={() => {
              if (phase === GamePhaseEnum.PLAYING && !isPlayerTurn) {
                setBoardBlockedFeedback(true);
              }
            }}
          />
          {previewCard && <CardPreviewOverlay card={previewCard} />}
          <SkillEffectLayer events={activeVisuals} />
        </div>
        {phase === GamePhaseEnum.MULLIGAN && renderMulligan()}
        {pendingAction && (
          <div className="board-stage__pending">
            <PendingCardPanel
              pendingCard={pendingAction}
                    responder={responder}
                    availableCounters={availableCounters}
                    selectedCounter={selectedCounter}
                    setSelectedCounter={setSelectedCounter}
                    onResolve={(countered, card) => {
                      resolveCard(countered, card);
                      if (countered) setSelectedCounter(null);
                    }}
                    aiEnabled={aiEnabled}
                  />
                </div>
              )}
            </div>
          </section>
          <aside className="game-grid__right">
            <GameLog logs={logs} />
            <ZonePanel
              title="墓地 / 什刹海"
              graveyard={playerGraveyard}
              shichahai={shichahaiByPlayer[PlayerEnum.BLACK]}
              variant="player"
            />
          </aside>
          <div className="game-grid__player">
            <PlayerHUD
              handCards={playerHandCards}
              disabled={!canPlayCard}
              statuses={statuses}
              moveCount={moveCount[PlayerEnum.BLACK] ?? 0}
              stonesCount={stonesByPlayer[PlayerEnum.BLACK]}
          characters={gameState.characters}
          graveyardCount={playerGraveyard.length}
          shichahaiCount={shichahaiByPlayer[PlayerEnum.BLACK].length}
          confirmDisabled={!canConfirm}
          onConfirm={() => resolveCard(false, null)}
          onCardHover={handlePlayerCardHover}
          onCardDragStart={index => {
            if (!canPlayCard) return;
            setDraggedCardIndex(index);
            const card = playerHandCards[index];
            if (card) setPreviewCard(card);
          }}
          onCardDragEnd={() => {
            setDraggedCardIndex(null);
            setPreviewCard(null);
          }}
          isCurrent={currentPlayer === PlayerEnum.BLACK}
        />
      </div>
          </div>
        </div>
      </div>
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
  if (typeof window === 'undefined') {
    return {
      endpoint: '',
      apiKey: '',
      model: ''
    };
  }
  try {
    const raw = window.localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return {
        endpoint: '',
        apiKey: '',
        model: ''
      };
    }
    const parsed = JSON.parse(raw);
    return {
      endpoint: parsed.endpoint ?? '',
      apiKey: parsed.apiKey ?? '',
      model: parsed.model ?? ''
    };
  } catch (err) {
    console.warn('[game07] failed to load AI settings', err);
    return {
      endpoint: '',
      apiKey: '',
      model: ''
    };
  }
};

const AiSettingsTrigger: React.FC<{ onOpen: (open: boolean) => void; hasConfig: boolean }> = ({ onOpen, hasConfig }) => (
  <button type="button" className={`ai-settings__trigger ${hasConfig ? 'ai-settings__trigger--ready' : ''}`} onClick={() => onOpen(true)}>
    AI 设置
  </button>
);

const getScenarioMeta = (kind: AiScenario['kind']) => {
  switch (kind) {
    case 'mulligan':
      return {
        message: '白方 AI 调整手牌…',
        startLog: '白方 AI 正在评估是否更换起手牌',
        successLog: (detail?: string) => detail ?? '白方 AI 完成调度判定',
        fallbackLog: '白方 AI 调度判定使用默认策略'
      };
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
    case 'playing':
    default:
      return {
        message: '白方 AI 正在思考落子…',
        startLog: '白方 AI 正在规划回合行动',
        successLog: (detail?: string) => detail ?? '白方 AI 完成回合行动',
        fallbackLog: '白方 AI 回合行动使用默认策略'
      };
  }
};

const useAIActions = (
  gameState: GameStatus,
  actions: {
    playCard: (index: number) => void;
    placeStone: (row: number, col: number) => void;
    resolveCard: (countered: boolean, counterCard?: RawCard | null) => void;
    completeMulligan: (decision: { replace: boolean }) => void;
    selectTarget: (selection: any) => void;
  },
  aiSettings: AiSettings,
  updateAiStatus: (status: { scenario: AiScenario['kind'] | null; message: string; reason?: string }) => void
) => {
  const { playCard, placeStone, resolveCard, completeMulligan, selectTarget } = actions;
  const processedRef = useRef<Set<string>>(new Set());
  const activeKeyRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState.turnCount === 0 && gameState.board.history.length === 0) {
      processedRef.current.clear();
      activeKeyRef.current = null;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [gameState.turnCount, gameState.board.history.length]);

  useEffect(() => {
    const clearRunningTask = (resetStatus = true, extra?: { reason?: string }) => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      activeKeyRef.current = null;
      if (resetStatus) updateAiStatus({ scenario: null, message: '', reason: extra?.reason });
    };

    const startScenario = (scenario: AiScenario) => {
      const key = buildScenarioKey(scenario, gameState);
      if (processedRef.current.has(key)) return;

      const descriptor = getScenarioMeta(scenario.kind);
      let attempts = 0;

      const schedule = (reason?: string) => {
        if (attempts >= 3) {
          console.warn('[game07][ai] 多次尝试后仍未得到有效行动，使用保底策略');
          fallbackDecision(scenario, gameState, actions);
          processedRef.current.add(key);
          clearRunningTask();
          return;
        }

        attempts += 1;
        const baseDelay = scenario.kind === 'counter_window' ? 600 : scenario.kind === 'mulligan' ? 500 : 750;
        const delay = reason ? 600 : baseDelay;
        updateAiStatus({ scenario: scenario.kind, message: descriptor.message, reason });
        console.info(`[game07][ai][${scenario.kind}][attempt=${attempts}] ${descriptor.startLog}${reason ? `（原因：${reason}）` : ''}`);

        activeKeyRef.current = key;
        timerRef.current = window.setTimeout(async () => {
          if (activeKeyRef.current !== key) return;

          const feedbackMessage = reason;

          console.info('[game07][ai][request_prepared]', {
            scenario: scenario.kind,
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
        console.warn(`[game07][ai][${scenario.kind}] ${descriptor.fallbackLog}`);
        fallbackDecision(scenario, gameState, actions);
        finalize();
      };

          if (!hasValidSettings(aiSettings)) {
            console.warn('[game07][ai] AI 设置未配置，使用保底逻辑');
            runFallback();
            return;
          }

          try {
            const decision = await requestAiDecision(aiSettings, scenario, { feedback: feedbackMessage });
            console.info('[game07][ai][response_json]', decision);
            const outcome = decision ? applyDecision(decision, scenario, gameState, actions) : { success: false, reason: '未提供有效决策' };
            if (!outcome.success) {
              const reasonText = outcome.reason ?? '技能执行失败，需要重新决策';
              console.warn(`[game07][ai] ${reasonText}`);
              rerun(reasonText);
              return;
            }
            console.info(`[game07][ai] ${descriptor.successLog(outcome.detail)}`);
            finalize();
          } catch (err) {
            console.error('[game07][ai] 决策调用失败', err);
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

    const scenario = deriveScenario(gameState);
    if (!scenario) {
      clearRunningTask();
      return;
    }

    const key = buildScenarioKey(scenario, gameState);
    if (processedRef.current.has(key) || activeKeyRef.current === key) return;

    if (activeKeyRef.current !== null || timerRef.current !== null) {
      clearRunningTask();
    }

    startScenario(scenario);

    return () => {
      clearRunningTask(false);
    };
  }, [gameState, aiSettings, playCard, placeStone, resolveCard, completeMulligan, selectTarget, updateAiStatus]);

  useEffect(() => () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);
};

type AiActionHandlers = {
  playCard: (index: number) => void;
  placeStone: (row: number, col: number) => void;
  resolveCard: (countered: boolean, counterCard?: RawCard | null) => void;
  completeMulligan: (decision: { replace: boolean }) => void;
  selectTarget: (selection: any) => void;
};

const deriveScenario = (state: GameStatus): AiScenario | null => {
  if (!state.aiEnabled) return null;

  if (state.phase === GamePhaseEnum.MULLIGAN && state.mulligan.current === PlayerEnum.WHITE) {
    const card = state.hands[PlayerEnum.WHITE]?.[0] ?? null;
    return {
      kind: 'mulligan',
      player: PlayerEnum.WHITE,
      card
    };
  }

  if (state.phase === GamePhaseEnum.CARD_TARGETING) {
    const request = state.targetRequest;
    if (request && request.actingPlayer === PlayerEnum.WHITE) {
      return {
        kind: 'card_targeting',
        player: PlayerEnum.WHITE,
        request,
        game: state
      };
    }
  }

  if (state.phase === GamePhaseEnum.COUNTER_WINDOW) {
    if (!state.pendingAction) return null;
    const window = state.counterWindow;
    if (window?.responder !== PlayerEnum.WHITE) return null;
    return {
      kind: 'counter_window',
      player: PlayerEnum.WHITE,
      game: state,
      pendingCard: state.pendingAction,
      availableCounters: collectCounterOptions(state, PlayerEnum.WHITE)
    };
  }

  if (state.phase === GamePhaseEnum.PLAYING) {
    if (state.currentPlayer !== PlayerEnum.WHITE) return null;
    if (state.pendingAction || state.pendingCounter || state.targetRequest) return null;
    return {
      kind: 'playing',
      player: PlayerEnum.WHITE,
      game: state
    };
  }

  return null;
};

const buildScenarioKey = (scenario: AiScenario, state: GameStatus): string => {
  switch (scenario.kind) {
    case 'mulligan':
      return `mulligan:${state.mulligan.stage}:${state.mulligan.current}:${state.mulligan.resolved.join('-')}:${state.mulligan.replaced.join('-')}`;
    case 'card_targeting':
      return `target:${state.targetRequest?.id ?? 'none'}`;
    case 'counter_window':
      return `counter:${state.pendingAction?.id ?? 'none'}:${state.counterWindow?.id ?? 'none'}:${scenario.availableCounters.map(item => item.handIndex).join(',')}`;
    case 'playing':
      return `playing:${state.turnCount}:${state.board.history.length}:${state.hands[PlayerEnum.WHITE]?.length ?? 0}`;
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
    case 'mulligan':
      if (decision.kind === 'mulligan') {
        actions.completeMulligan({ replace: Boolean(decision.replace) });
        return { success: true };
      }
      return { success: false, reason: '未提供有效的调度决定' };
    case 'playing':
      if (decision.kind === 'play_card') {
        const hand = state.hands[PlayerEnum.WHITE] ?? [];
        const index = resolveHandIndexForDecision(decision, hand);
        if (index !== null) {
          const card = hand[index];
          actions.playCard(index);
          const cardLabel = card ? formatCardIdentifier(card) : `手牌索引 ${index}`;
          return { success: true, detail: `白方 AI 使用了 ${cardLabel}` };
        }
        return { success: false, reason: '无法匹配到指定的手牌' };
      }
      if (decision.kind === 'place_stone') {
        const move = deriveMoveFromBoardMatrix(decision.board, state.board, PlayerEnum.WHITE);
        if (move) {
          actions.placeStone(move.row, move.col);
          return { success: true, detail: `白方 AI 在 (${move.row}, ${move.col}) 落子` };
        }
        return { success: false, reason: '无法从返回的盘面解析出合法落子' };
      }
      if (decision.kind === 'pass') {
        console.info('[game07][ai] AI 选择暂不行动');
        return { success: false, reason: 'AI 选择暂不行动' };
      }
      return { success: false, reason: '未识别的行动类型' };
    case 'card_targeting':
      if (scenario.request.type === 'cell') {
        if (decision.kind === 'target_cell' && isCellAllowed(scenario.request.cells ?? [], decision.row, decision.col)) {
          actions.selectTarget({ row: decision.row, col: decision.col });
          return { success: true, detail: `白方 AI 选择目标格 (${decision.row}, ${decision.col})` };
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

const fallbackDecision = (scenario: AiScenario, state: GameStatus, actions: AiActionHandlers) => {
  switch (scenario.kind) {
    case 'mulligan':
      console.info('[game07][ai] 默认保留初始手牌');
      actions.completeMulligan({ replace: false });
      break;
    case 'playing':
      fallbackPlaceStone(state, actions);
      break;
    case 'card_targeting':
      if (scenario.request.type === 'cell') {
        const target = scenario.request.cells?.[0];
        if (target) {
          console.info(`[game07][ai] 默认选择目标格 (${target.row}, ${target.col})`);
          actions.selectTarget({ row: target.row, col: target.col });
        }
      } else if (scenario.request.type === 'snapshot') {
        const option = scenario.request.options?.[0];
        if (option) {
          console.info(`[game07][ai] 默认选择时间节点 ${option.id}`);
          actions.selectTarget({ id: option.id });
        }
      }
      break;
    case 'counter_window':
      console.info('[game07][ai] 默认放弃反击');
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

const fallbackPlaceStone = (state: GameStatus, actions: AiActionHandlers) => {
  const size = state.board.size;
  const center = Math.floor(size / 2);
  if (state.board.get(center, center) === null) {
    console.info(`[game07][ai] 默认落子在中心 (${center}, ${center})`);
    actions.placeStone(center, center);
    return;
  }
  let placed = false;
  state.board.forEachCell((row, col, value) => {
    if (!placed && value === null) {
      placed = true;
      console.info(`[game07][ai] 默认落子在 (${row}, ${col})`);
      actions.placeStone(row, col);
    }
  });
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
