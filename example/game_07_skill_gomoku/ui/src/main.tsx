import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  AvatarBadge,
  Board,
  GameLog,
  HandPanel,
  MulliganPanel,
  PendingCardPanel,
  SnapshotSelector,
  ZonePanel,
  buildAIMulliganDecision,
  buildAITargetSelection
} from './components';
import { useGameEngine } from './core/gameEngine';
import { PLAYER_NAMES, PlayerEnum, SKILL_UNLOCK_MOVE, getOpponent, GamePhaseEnum } from './core/constants';
import { aiSelectCounterCard, aiShouldPlayCard, findBestMove } from './ai/gomokuAi';
import type { GameStatus, Player, RawCard } from './types';

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

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="font-display text-6xl text-amber-200 drop-shadow-2xl">技能五子棋</h1>
        <p className="text-amber-200/80 text-lg">@khgame/tables 演示 - 小品梗元素卡牌化</p>
      </header>
      {phase === GamePhaseEnum.SETUP ? (
        <div className="max-w-2xl mx-auto text-center bg-white/90 p-8 rounded-3xl shadow-2xl space-y-6 text-stone-900">
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
      ) : phase === GamePhaseEnum.MULLIGAN ? (
        renderMulligan()
      ) : (
        <div className="max-w-7xl mx-auto space-y-6">
          <AvatarBadge
            player={PlayerEnum.WHITE}
            handCount={(hands[PlayerEnum.WHITE] ?? []).length}
            moveCount={moveCount[PlayerEnum.WHITE] ?? 0}
            stonesCount={stonesByPlayer[PlayerEnum.WHITE]}
            characters={gameState.characters}
            statuses={statuses}
            isCurrent={currentPlayer === PlayerEnum.WHITE}
          />
          <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)_280px] items-start">
            <ZonePanel title="敌方情报" graveyard={gameState.graveyards[PlayerEnum.WHITE] ?? []} shichahai={shichahaiByPlayer[PlayerEnum.WHITE]} />
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-500/80 via-amber-400/80 to-amber-500/80 text-amber-950 rounded-2xl px-4 py-2 flex justify-between items-center shadow-lg">
                <div className="font-semibold">第 {gameState.turnCount} 回合</div>
                <div className="text-sm">{PLAYER_NAMES[currentPlayer]} 行动中</div>
                <div className="text-xs">
                  {gameState.turnCount + 1 < SKILL_UNLOCK_MOVE ? `技能将于第 ${SKILL_UNLOCK_MOVE} 步解锁` : '技能已可使用'}
                </div>
              </div>
              <Board
                board={board}
                onCellClick={placeStone}
                disabled={phase !== GamePhaseEnum.PLAYING || Boolean(pendingAction) || (targetRequest && targetRequest.type === 'snapshot')}
                targetRequest={targetRequest && targetRequest.type === 'cell' ? targetRequest : null}
                onTargetSelect={selectTarget}
              />
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
            <div className="space-y-4">
              {phase === GamePhaseEnum.GAME_OVER && (
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-3xl shadow-2xl text-center space-y-3 text-white">
                  <h2 className="text-3xl font-bold">{PLAYER_NAMES[gameState.winner ?? PlayerEnum.BLACK]} 获胜！</h2>
                  <button
                    type="button"
                    onClick={() => startGame(aiEnabled)}
                    className="bg-white text-orange-600 px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all"
                  >
                    再来一局
                  </button>
                </div>
              )}
              <GameLog logs={logs} />
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
            <div className="space-y-4">
              <AvatarBadge
                player={PlayerEnum.BLACK}
                handCount={(hands[PlayerEnum.BLACK] ?? []).length}
                moveCount={moveCount[PlayerEnum.BLACK] ?? 0}
                stonesCount={stonesByPlayer[PlayerEnum.BLACK]}
                characters={gameState.characters}
                statuses={statuses}
                isCurrent={currentPlayer === PlayerEnum.BLACK}
              />
              <HandPanel
                cards={hands[PlayerEnum.BLACK] ?? []}
                onCardClick={playCard}
                disabled={
                  !(phase === GamePhaseEnum.PLAYING &&
                    gameState.turnCount + 1 >= SKILL_UNLOCK_MOVE &&
                    !pendingAction &&
                    !(targetRequest && targetRequest.type === 'cell'))
                }
                player={PlayerEnum.BLACK}
              />
            </div>
            <ZonePanel title="我方情报" graveyard={gameState.graveyards[PlayerEnum.BLACK] ?? []} shichahai={shichahaiByPlayer[PlayerEnum.BLACK]} />
          </div>
        </div>
      )}
      {targetRequest && targetRequest.type === 'snapshot' && <SnapshotSelector request={targetRequest} onSelect={selectTarget} />}
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
