import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  OpponentDeckFan,
  SkillEffectLayer,
  buildAIMulliganDecision,
  buildAITargetSelection
} from './components';
import { useGameEngine } from './core/gameEngine';
import { PLAYER_NAMES, PlayerEnum, SKILL_UNLOCK_MOVE, getOpponent, GamePhaseEnum } from './core/constants';
import { aiSelectCounterCard, aiShouldPlayCard, findBestMove } from './ai/gomokuAi';
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
  const [activeVisuals, setActiveVisuals] = useState<VisualEffectEvent[]>([]);
  const visualTracker = useRef<Set<string>>(new Set());

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

  useAIActions(gameState, { playCard, placeStone, resolveCard, completeMulligan, selectTarget });

  const responder = gameState.counterWindow?.responder ?? null;
  const availableCounters = useMemo(() => {
    if (!gameState.pendingAction || responder === null) return [];
    const ids = (gameState.pendingAction.card.counteredBy ?? '')
      .split('|')
      .map(item => item.trim())
      .filter(Boolean);
    if (ids.length === 0) return [];
    return (gameState.hands[responder] ?? []).filter(card => ids.includes(String(card._tid ?? card.tid)));
  }, [gameState.pendingAction, gameState.hands, responder]);

  const stonesByPlayer = useMemo(() => countStones(gameState.board), [gameState.board]);
  const shichahaiByPlayer = useMemo(() => partitionShichahai(gameState.shichahai), [gameState.shichahai]);

  const renderMulligan = () => {
    const player = gameState.mulligan.current;
    const card = player !== null ? gameState.hands[player]?.[0] ?? null : null;
    const hidden = player === PlayerEnum.WHITE;
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center text-lg text-amber-200 font-semibold">调度阶段</div>
        <MulliganPanel
          player={player ?? PlayerEnum.BLACK}
          card={hidden ? null : card}
          onKeep={() => completeMulligan({ replace: false })}
          onReplace={() => completeMulligan({ replace: true })}
          hidden={hidden}
        />
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-amber-100 text-xl">加载配置中…</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-200 text-lg">{error}</div>;
  }

  const { phase, board, currentPlayer, hands, logs, pendingAction, targetRequest, aiEnabled, moveCount, statuses } = gameState;

  if (phase === GamePhaseEnum.SETUP) {
    return (
      <div className="h-screen overflow-auto p-6 flex flex-col items-center justify-center space-y-6">
        <header className="text-center space-y-2">
          <h1 className="font-display text-6xl text-amber-200 drop-shadow-2xl">技能五子棋</h1>
          <p className="text-amber-200/80 text-lg">@khgame/tables 演示 - 小品梗元素卡牌化</p>
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
              onClick={() => startGame(false)}
              className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              双人对战
            </button>
            <button
              type="button"
              onClick={() => startGame(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              AI 对战
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === GamePhaseEnum.MULLIGAN) {
    return (
      <div className="h-screen overflow-auto p-6 space-y-6">
        <header className="text-center space-y-2">
          <h1 className="font-display text-6xl text-amber-200 drop-shadow-2xl">技能五子棋</h1>
          <p className="text-amber-200/80 text-lg">@khgame/tables 演示 - 小品梗元素卡牌化</p>
        </header>
        {renderMulligan()}
      </div>
    );
  }

  const enemyHandCount = (hands[PlayerEnum.WHITE] ?? []).length;
  const playerHandCards = hands[PlayerEnum.BLACK] ?? [];
  const enemyGraveyard = gameState.graveyards[PlayerEnum.WHITE] ?? [];
  const playerGraveyard = gameState.graveyards[PlayerEnum.BLACK] ?? [];
  const canPlayCard =
    phase === GamePhaseEnum.PLAYING &&
    gameState.turnCount + 1 >= SKILL_UNLOCK_MOVE &&
    !pendingAction &&
    !(targetRequest && targetRequest.type === 'cell');
  const canConfirm =
    phase === GamePhaseEnum.COUNTER_WINDOW &&
    (responder === null || responder === PlayerEnum.BLACK);

  return (
    <div className="game-stage">
      <div className="game-stage__backdrop" />
      <div className="game-stage__halo game-stage__halo--left" />
      <div className="game-stage__halo game-stage__halo--right" />
      <div className="game-stage__overlay" />
      <div className="game-frame">
        <div className="game-frame__inner">
          <OpponentHUD
            handCount={enemyHandCount}
            graveyardCount={enemyGraveyard.length}
            shichahaiCount={shichahaiByPlayer[PlayerEnum.WHITE].length}
            moveCount={moveCount[PlayerEnum.WHITE] ?? 0}
            stonesCount={stonesByPlayer[PlayerEnum.WHITE]}
            characters={gameState.characters}
            statuses={statuses}
            isCurrent={currentPlayer === PlayerEnum.WHITE}
          />
          <div className="game-arena">
            <aside className="game-side game-side--left">
              <ZonePanel
                title="墓地 / 什刹海"
                graveyard={enemyGraveyard}
                shichahai={shichahaiByPlayer[PlayerEnum.WHITE]}
                variant="opponent"
              />
            </aside>
            <section className="board-stage">
              <div className="board-stage__ambient" />
              <OpponentDeckFan count={enemyHandCount} />
              <div className="board-stage__inner">
                <Board
                  board={board}
                  onCellClick={placeStone}
                  disabled={phase !== GamePhaseEnum.PLAYING || Boolean(pendingAction) || (targetRequest && targetRequest.type === 'snapshot')}
                  targetRequest={targetRequest && targetRequest.type === 'cell' ? targetRequest : null}
                  onTargetSelect={selectTarget}
                  className="board-stage__board"
                  style={{ aspectRatio: '1 / 1' }}
                />
              </div>
              <SkillEffectLayer events={activeVisuals} />
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
            </section>
            <aside className="game-side game-side--right">
              <GameLog logs={logs} />
              <ZonePanel
                title="墓地 / 什刹海"
                graveyard={playerGraveyard}
                shichahai={shichahaiByPlayer[PlayerEnum.BLACK]}
                variant="player"
              />
            </aside>
          </div>
          <PlayerHUD
            handCards={playerHandCards}
            onPlayCard={playCard}
            disabled={!canPlayCard}
            statuses={statuses}
            moveCount={moveCount[PlayerEnum.BLACK] ?? 0}
            stonesCount={stonesByPlayer[PlayerEnum.BLACK]}
            characters={gameState.characters}
            confirmDisabled={!canConfirm}
            onConfirm={() => resolveCard(false, null)}
          />
        </div>
      </div>
    </div>
  );

};

const useAIActions = (
  gameState: GameStatus,
  actions: {
    playCard: (index: number) => void;
    placeStone: (row: number, col: number) => void;
    resolveCard: (countered: boolean, counterCard?: RawCard | null) => void;
    completeMulligan: (decision: { replace: boolean }) => void;
    selectTarget: (selection: any) => void;
  }
) => {
  const { playCard, placeStone, resolveCard, completeMulligan, selectTarget } = actions;

  useEffect(() => {
    if (!gameState.aiEnabled) return;

    if (gameState.phase === GamePhaseEnum.MULLIGAN && gameState.mulligan.current === PlayerEnum.WHITE) {
      const timer = setTimeout(() => {
        const decision = buildAIMulliganDecision(gameState);
        completeMulligan({ replace: decision.replace });
      }, 600);
      return () => clearTimeout(timer);
    }

    if (
      gameState.phase === GamePhaseEnum.CARD_TARGETING &&
      (gameState.pendingAction?.player === PlayerEnum.WHITE || gameState.pendingCounter?.player === PlayerEnum.WHITE)
    ) {
      const choice = buildAITargetSelection(gameState);
      if (choice) {
        const timer = setTimeout(() => {
          selectTarget(choice);
        }, 500);
        return () => clearTimeout(timer);
      }
    }

    if (gameState.phase !== GamePhaseEnum.PLAYING) return;
    if (gameState.currentPlayer !== PlayerEnum.WHITE) return;

    const timer = setTimeout(() => {
      const cardPlay = aiShouldPlayCard(gameState);
      if (cardPlay && typeof cardPlay.index === 'number') {
        playCard(cardPlay.index);
        return;
      }
      const move = findBestMove(gameState.board, PlayerEnum.WHITE);
      if (move) {
        placeStone(move.row, move.col);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [gameState, playCard, placeStone, completeMulligan, selectTarget, resolveCard]);

  useEffect(() => {
    if (!gameState.aiEnabled) return;
    if (gameState.phase !== GamePhaseEnum.COUNTER_WINDOW) return;
    if (!gameState.pendingAction) return;
    if (gameState.counterWindow?.responder !== PlayerEnum.WHITE) return;

    const timer = setTimeout(() => {
      const counterCard = aiSelectCounterCard(gameState, gameState.pendingAction);
      if (counterCard) {
        resolveCard(true, counterCard);
      } else {
        resolveCard(false, null);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [gameState, resolveCard]);
};

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



const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
