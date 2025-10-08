import { h, useMemo, useState, useEffect } from './utils/react.js';
import { render } from './utils/react-dom.js';
import { useGameEngine } from './core/gameEngine.js';
import { GamePhase, Player, PLAYER_NAMES, SKILL_UNLOCK_MOVE } from './core/constants.js';
import {
  Board,
  HandPanel,
  GameLog,
  PendingCardPanel,
  SetupScreen,
  GameOverPanel,
  MulliganPanel
} from './ui/components.js';
import {
  aiShouldPlayCard,
  aiSelectCounterCard,
  findBestMove,
  chooseRemovalTarget,
  chooseRetrievalPlacement
} from './ai/gomokuAi.js';
import { SkillEffect } from './skills/effects.js';

const data = window.TABLES_DATA;

function GameApp() {
  const {
    gameState,
    startGame,
    completeMulligan,
    placeStone,
    playCard,
    selectTarget,
    resolveCard
  } = useGameEngine(data);
  const {
    phase,
    board,
    currentPlayer,
    hands,
    logs,
    pendingCard,
    winner,
    characters,
    turnCount,
    aiEnabled,
    targetRequest,
    counterWindow,
    mulligan
  } = gameState;

  useAiController(gameState, { placeStone, playCard, resolveCard, completeMulligan, selectTarget });

  const [selectedCounter, setSelectedCounter] = useState(null);

  useEffect(() => {
    setSelectedCounter(null);
  }, [pendingCard ? pendingCard.id || (pendingCard.card && pendingCard.card._tid) : null]);

  const graveyards = gameState.graveyards || [[], []];
  const shichahaiByPlayer = useMemo(() => {
    const sea = gameState.shichahai || [];
    return {
      [Player.BLACK]: sea.filter(entry => entry.owner === Player.BLACK),
      [Player.WHITE]: sea.filter(entry => entry.owner === Player.WHITE)
    };
  }, [gameState.shichahai]);

  const stonesByPlayer = useMemo(() => countStones(board), [board]);

  const responder = counterWindow ? counterWindow.responder : null;

  const availableCounters = useMemo(() => {
    if (!pendingCard || responder === null) return [];
    const counterIds = ((pendingCard.card.counteredBy || '') + '')
      .split('|')
      .map(item => item.trim())
      .filter(Boolean);
    if (counterIds.length === 0) return [];
    return (hands[responder] || []).filter(card => {
      const tid = card._tid || card.tid;
      return counterIds.includes(String(tid));
    });
  }, [pendingCard, hands, responder]);

  const canPlayCard =
    phase === GamePhase.PLAYING &&
    turnCount + 1 >= SKILL_UNLOCK_MOVE &&
    !pendingCard &&
    !(targetRequest && targetRequest.type === 'cell');

  const renderMulligan = () => {
    const player = mulligan.current;
    const card = player !== null ? (hands[player] && hands[player][0]) : null;
    return h(
      'div',
      { className: 'max-w-4xl mx-auto space-y-6' },
      h('div', { className: 'text-center text-lg text-amber-800 font-semibold' }, '调度阶段'),
      h(MulliganPanel, {
        player: player ?? Player.BLACK,
        card,
        onKeep: () => completeMulligan({ replace: false }),
        onReplace: () => completeMulligan({ replace: true })
      })
    );
  };

  const snapshotOverlay =
    targetRequest && targetRequest.type === 'snapshot'
      ? h(SnapshotSelector, {
          request: targetRequest,
          onSelect: option => selectTarget({ id: option.id })
        })
      : null;

  return h(
    'div',
    { className: 'min-h-screen p-6' },
    h(
      'header',
      { className: 'mb-8 text-center space-y-2' },
      h('h1', { className: 'font-display text-6xl text-amber-200 drop-shadow-2xl' }, '技能五子棋'),
      h('p', { className: 'text-amber-200/80 text-lg' }, '@khgame/tables 演示 - 小品梗元素卡牌化')
    ),
    phase === GamePhase.SETUP
      ? h(SetupScreen, { onStart: startGame })
      : phase === GamePhase.MULLIGAN
        ? renderMulligan()
        : h(
            'div',
            { className: 'max-w-7xl mx-auto space-y-6' },
            h(AvatarBadge, {
              player: Player.WHITE,
              handCount: (hands[Player.WHITE] || []).length,
              moveCount: gameState.moveCount[Player.WHITE] || 0,
              stonesCount: stonesByPlayer[Player.WHITE],
              characters,
              statuses: gameState.statuses,
              isCurrent: currentPlayer === Player.WHITE
            }),
            h(
              'div',
              { className: 'grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)_260px] items-start' },
              h(ZonePanel, {
                title: '敌方情报',
                graveyard: graveyards[Player.WHITE] || [],
                shichahai: shichahaiByPlayer[Player.WHITE] || []
              }),
              h(
                'div',
                { className: 'space-y-4' },
                h(
                  'div',
                  {
                    className:
                      'bg-gradient-to-r from-amber-500/80 via-amber-400/80 to-amber-500/80 text-amber-950 rounded-2xl px-4 py-2 flex justify-between items-center shadow-lg'
                  },
                  h('div', { className: 'font-semibold' }, `第 ${turnCount} 回合`),
                  h('div', { className: 'text-sm' }, `${PLAYER_NAMES[currentPlayer]} 行动中`),
                  h(
                    'div',
                    { className: 'text-xs' },
                    turnCount + 1 < SKILL_UNLOCK_MOVE ? `技能将于第 ${SKILL_UNLOCK_MOVE} 步解锁` : '技能已可使用'
                  )
                ),
                h(Board, {
                  board,
                  onCellClick: placeStone,
                  disabled: phase !== GamePhase.PLAYING || Boolean(pendingCard) || (targetRequest && targetRequest.type === 'snapshot'),
                  targetRequest: targetRequest && targetRequest.type === 'cell' ? targetRequest : null,
                  onTargetSelect: selectTarget
                }),
                h(PendingCardPanel, {
                  pendingCard,
                  responder,
                  availableCounters,
                  selectedCounter,
                  setSelectedCounter,
                  onResolve: (countered, card) => {
                    resolveCard(countered, card || null);
                    setSelectedCounter(null);
                  },
                  aiEnabled
                })
              ),
              h(
                'div',
                { className: 'space-y-4' },
                phase === GamePhase.GAME_OVER
                  ? h(GameOverPanel, { winner, onRestart: () => startGame(aiEnabled) })
                  : null,
                h(GameLog, { logs })
              )
            ),
            h(
              'div',
              { className: 'grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start' },
              h(
                'div',
                { className: 'space-y-4' },
                h(AvatarBadge, {
                  player: Player.BLACK,
                  handCount: (hands[Player.BLACK] || []).length,
                  moveCount: gameState.moveCount[Player.BLACK] || 0,
                  stonesCount: stonesByPlayer[Player.BLACK],
                  characters,
                  statuses: gameState.statuses,
                  isCurrent: currentPlayer === Player.BLACK
                }),
                h(HandPanel, {
                  cards: hands[Player.BLACK] || [],
                  onCardClick: playCard,
                  disabled: !canPlayCard,
                  player: Player.BLACK
                })
              ),
              h(ZonePanel, {
                title: '我方情报',
                graveyard: graveyards[Player.BLACK] || [],
                shichahai: shichahaiByPlayer[Player.BLACK] || [],
                align: 'right'
              })
            )
          ),
    snapshotOverlay
  );
}

function useAiController(gameState, actions) {
  const { placeStone, playCard, resolveCard, completeMulligan, selectTarget } = actions;

  useEffect(() => {
    if (!gameState.aiEnabled) return;
    if (gameState.phase === GamePhase.MULLIGAN) {
      if (gameState.mulligan.current === Player.WHITE) {
        const timer = setTimeout(() => completeMulligan({ replace: Math.random() < 0.3 }), 600);
        return () => clearTimeout(timer);
      }
      return;
    }
    if (
      gameState.phase === GamePhase.CARD_TARGETING &&
      (gameState.pendingAction?.player === Player.WHITE || gameState.pendingCounter?.player === Player.WHITE)
    ) {
      if (gameState.targetRequest?.type === 'cell' && Array.isArray(gameState.targetRequest.cells)) {
        const cells = gameState.targetRequest.cells;
        if (cells.length > 0) {
          let target = null;
          if (gameState.pendingAction?.player === Player.WHITE) {
            const effectId = gameState.pendingAction.card?.effectId;
            if (effectId === SkillEffect.RemoveToShichahai) {
              target = chooseRemovalTarget(gameState.board, Player.WHITE);
            }
          }
          if (!target && gameState.pendingCounter?.player === Player.WHITE) {
            const effectId = gameState.pendingCounter.card?.effectId;
            if (effectId === SkillEffect.CounterRetrieve) {
              target = chooseRetrievalPlacement(gameState.board, Player.WHITE);
            }
          }
          if (!target || !cells.some(cell => cell.row === target.row && cell.col === target.col)) {
            target = cells[Math.floor(Math.random() * cells.length)];
          }
          const timer = setTimeout(() => selectTarget({ row: target.row, col: target.col }), 500);
          return () => clearTimeout(timer);
        }
      }
      if (gameState.targetRequest?.type === 'snapshot') {
        const options = gameState.targetRequest.options || [];
        if (options.length > 0) {
          const option = options[0];
          const timer = setTimeout(() => selectTarget({ id: option.id }), 600);
          return () => clearTimeout(timer);
        }
      }
      return;
    }
    if (gameState.phase !== GamePhase.PLAYING) return;
    if (gameState.currentPlayer !== Player.WHITE) return;

    const timer = setTimeout(() => {
      const cardPlay = aiShouldPlayCard(gameState);
      if (cardPlay && typeof cardPlay.index === 'number') {
        playCard(cardPlay.index);
        return;
      }
      const move = findBestMove(gameState.board, Player.WHITE);
      if (move) {
        placeStone(move.row, move.col);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [
    gameState.aiEnabled,
    gameState.phase,
    gameState.currentPlayer,
    gameState.turnCount,
    gameState.board,
    gameState.targetRequest,
    gameState.pendingAction,
    gameState.pendingCounter,
    playCard,
    placeStone,
    completeMulligan,
    selectTarget
  ]);

  useEffect(() => {
    if (!gameState.aiEnabled) return;
    if (gameState.phase !== GamePhase.COUNTER_WINDOW) return;
    if (!gameState.pendingCard) return;
    if (gameState.counterWindow?.responder !== Player.WHITE) return;

    const timer = setTimeout(() => {
      const counterCard = aiSelectCounterCard(gameState, gameState.pendingCard);
      if (counterCard) {
        resolveCard(true, counterCard);
      } else {
        resolveCard(false, null);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    gameState.aiEnabled,
    gameState.phase,
    gameState.pendingCard,
    gameState.counterWindow,
    resolveCard
  ]);
}

function SnapshotSelector({ request, onSelect }) {
  return h(
    'div',
    { className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4' },
    h(
      'div',
      { className: 'bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4' },
      h('h3', { className: 'text-xl font-bold text-amber-700' }, request.title || '选择时间节点'),
      h('p', { className: 'text-sm text-gray-600' }, request.description || ''),
      h(
        'div',
        { className: 'space-y-2 max-h-72 overflow-y-auto' },
        (request.options || []).map(option =>
          h(
            'button',
            {
              key: option.id,
              type: 'button',
              onClick: () => onSelect(option),
              className:
                'w-full text-left px-4 py-3 rounded-xl border border-amber-300 hover:bg-amber-50 transition-all'
            },
            `第 ${option.turn} 回合`,
            option.player !== null
              ? ` · ${PLAYER_NAMES[option.player]} 落子 (${option.move?.row ?? '-'}, ${option.move?.col ?? '-'})`
              : ''
          )
        )
      )
    )
  );
}

function countStones(board) {
  const counts = [0, 0];
  board.forEachCell((row, col, value) => {
    if (value === Player.BLACK) counts[Player.BLACK]++;
    if (value === Player.WHITE) counts[Player.WHITE]++;
  });
  return counts;
}

const container = document.getElementById('app');
render(h(GameApp, null), container);
