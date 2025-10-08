import { h, Fragment, useEffect, useMemo, useRef, useState } from '../utils/react.js';
import { GamePhase, Player, PLAYER_NAMES } from '../core/constants.js';

export function BoardCell({ row, col, value, onClick, isLastMove, highlight }) {
  const isEmpty = value === null;
  const interactive = isEmpty && typeof onClick === 'function';
  const classes = [
    'relative w-full aspect-square border border-amber-800/30 transition-all',
    interactive ? 'hover:bg-amber-200/50 cursor-pointer' : 'cursor-default',
    isLastMove ? 'ring-2 ring-amber-500' : '',
    highlight === 'target' ? 'ring-2 ring-sky-400 animate-pulse' : '',
    highlight === 'origin' ? 'ring-2 ring-rose-500' : ''
  ].join(' ');

  return h(
    'button',
    {
      type: 'button',
      className: classes,
      disabled: !interactive && highlight !== 'target',
      onClick: interactive || highlight === 'target' ? () => onClick(row, col) : undefined
    },
    value === Player.BLACK
      ? h('div', { className: 'absolute inset-1.5 rounded-full bg-gradient-to-br from-slate-900 to-black shadow-lg' })
      : null,
    value === Player.WHITE
      ? h('div', { className: 'absolute inset-1.5 rounded-full bg-gradient-to-br from-slate-100 to-white shadow-lg' })
      : null
  );
}

export function Board({ board, onCellClick, disabled, targetRequest, onTargetSelect }) {
  const lastMove = board.history[board.history.length - 1];
  const gridStyle = { gridTemplateColumns: `repeat(${board.size}, minmax(0, 1fr))` };
  const inTargetMode = Boolean(targetRequest && targetRequest.type === 'cell');
  const targetCells = new Set();
  let originKey = null;
  if (inTargetMode && Array.isArray(targetRequest.cells)) {
    targetRequest.cells.forEach(cell => {
      targetCells.add(`${cell.row}-${cell.col}`);
    });
    if (targetRequest.origin) {
      originKey = `${targetRequest.origin.row}-${targetRequest.origin.col}`;
    }
  }

  const handleClick = (row, col) => {
    if (inTargetMode) {
      const key = `${row}-${col}`;
      if (!targetCells.has(key)) return;
      if (typeof onTargetSelect === 'function') {
        onTargetSelect({ row, col });
      }
      return;
    }
    if (!disabled && typeof onCellClick === 'function') {
      onCellClick(row, col);
    }
  };

  return h(
    'div',
    {
      className: 'bg-board p-4 rounded-2xl shadow-2xl',
      style: {
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(139, 69, 19, 0.1) 35px, rgba(139, 69, 19, 0.1) 36px),
                          repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(139, 69, 19, 0.1) 35px, rgba(139, 69, 19, 0.1) 36px)`
      }
    },
    h(
      'div',
      { className: 'grid gap-0', style: gridStyle },
      Array.from({ length: board.size }).map((_, rowIdx) =>
        Array.from({ length: board.size }).map((_, colIdx) => {
          const key = `${rowIdx}-${colIdx}`;
          let highlight = null;
          if (inTargetMode) {
            if (targetCells.has(key)) highlight = 'target';
            else if (originKey === key) highlight = 'origin';
          }
          return h(BoardCell, {
            key,
            row: rowIdx,
            col: colIdx,
            value: board.get(rowIdx, colIdx),
            onClick: handleClick,
            isLastMove: lastMove && lastMove.row === rowIdx && lastMove.col === colIdx,
            highlight
          });
        })
      )
    )
  );
}

export function CardView({ card, onClick, disabled }) {
  const typeColors = {
    Attack: 'from-orange-500 to-orange-700',
    Control: 'from-purple-500 to-purple-700',
    Counter: 'from-blue-500 to-blue-700',
    Support: 'from-yellow-500 to-amber-600'
  };
  const rarityBorder = {
    Common: 'border-gray-300',
    Rare: 'border-blue-400',
    Legendary: 'border-yellow-400'
  };

  const classes = [
    'relative p-3 rounded-xl border-2 text-left text-white shadow-lg transition-all min-w-[140px]',
    rarityBorder[card.rarity] || 'border-gray-400',
    `bg-gradient-to-br ${typeColors[card.type] || 'from-slate-500 to-slate-700'}`,
    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-xl cursor-pointer'
  ].join(' ');

  return h(
    'button',
    {
      type: 'button',
      className: classes,
      disabled,
      onClick: disabled ? undefined : onClick
    },
    h('div', { className: 'text-xs opacity-80 mb-1' }, card.type),
    h('div', { className: 'font-semibold text-sm mb-2 truncate' }, card.nameZh),
    h('div', { className: 'text-xs opacity-90 mb-2 line-clamp-3' }, card.effect),
    card.quote
      ? h(
          'div',
          { className: 'text-xs italic opacity-70 border-t border-white/20 pt-2 mt-2' },
          `“${card.quote}”`
        )
      : null
  );
}

export function HandPanel({ cards, onCardClick, disabled, player }) {
  return h(
    'div',
    { className: 'bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-5 rounded-3xl shadow-2xl border border-amber-500/40 text-amber-100' },
    h('h3', { className: 'font-semibold mb-3 text-lg tracking-wide text-amber-200' }, `${PLAYER_NAMES[player]} 手牌`),
    cards.length === 0
      ? h('div', { className: 'text-amber-200/70 text-sm italic' }, '无手牌')
      : h(
          'div',
          { className: 'flex gap-3 flex-wrap' },
          cards.map((card, index) =>
            h(CardView, {
              key: card._tid || `${card.nameZh}-${index}`,
              card,
              onClick: () => onCardClick(index),
              disabled
            })
          )
        )
  );
}

export function GameLog({ logs }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const typeColors = {
    start: 'text-emerald-300 font-bold',
    move: 'text-sky-300',
    card: 'text-violet-300 font-semibold',
    effect: 'text-amber-300',
    counter: 'text-rose-300',
    draw: 'text-teal-300',
    summon: 'text-pink-300 font-semibold',
    win: 'text-emerald-200 font-bold text-lg',
    error: 'text-red-300'
  };

  return h(
    'div',
    {
      className:
        'bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-4 rounded-3xl shadow-2xl h-64 overflow-y-auto border border-amber-500/40 text-amber-100',
      ref: containerRef
    },
    h('h3', { className: 'font-semibold mb-3 text-lg sticky top-0 bg-stone-900/90 py-1 text-amber-200' }, '对局记录'),
    h(
      'div',
      { className: 'space-y-1 text-sm' },
      logs.map((log, idx) =>
        h(
          'div',
          { key: idx, className: typeColors[log.type] || 'text-gray-700' },
          log.message
        )
      )
    )
  );
}

export function PendingCardPanel({
  pendingCard,
  responder,
  availableCounters,
  selectedCounter,
  setSelectedCounter,
  onResolve,
  aiEnabled
}) {
  if (!pendingCard) return null;
  const actingPlayer = pendingCard.player;
  const canCounter = responder !== null && availableCounters.length > 0 && !aiEnabled;

  return h(
    'div',
    {
      className:
        'bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-500/70 p-4 rounded-3xl shadow-xl space-y-3'
    },
    h(
      'div',
      { className: 'font-semibold text-base' },
      `${PLAYER_NAMES[actingPlayer]} 使用: ${pendingCard.card.nameZh}`
    ),
    h('div', { className: 'text-sm text-gray-700' }, pendingCard.card.effect),
    canCounter
      ? h(
          Fragment,
          null,
          h('div', { className: 'text-sm font-semibold' }, `${PLAYER_NAMES[responder]} 可用反击卡:`),
          h(
            'div',
            { className: 'flex gap-2 flex-wrap' },
            availableCounters.map(card =>
              h(
                'button',
                {
                  key: card._tid || card.tid,
                  type: 'button',
                  onClick: () => setSelectedCounter(card),
                  className: [
                    'px-3 py-2 rounded-lg text-sm transition-all',
                    selectedCounter && selectedCounter._tid === card._tid
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  ].join(' ')
                },
                card.nameZh
              )
            )
          ),
          h(
            'div',
            { className: 'flex gap-2 mt-2' },
            h(
              'button',
              {
                type: 'button',
                disabled: !selectedCounter,
                onClick: () => selectedCounter && onResolve(true, selectedCounter),
                className:
                  'bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-all'
              },
              '使用反击卡'
            ),
            h(
              'button',
              {
                type: 'button',
                onClick: () => {
                  onResolve(false, null);
                  setSelectedCounter(null);
                },
                className: 'bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all'
              },
              '放弃反击'
            )
          )
        )
      : h(
          'button',
          {
            type: 'button',
            onClick: () => onResolve(false, null),
            className: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all'
          },
          '确认生效'
        )
  );
}

export function AvatarBadge({
  player,
  handCount,
  moveCount,
  stonesCount,
  characters,
  statuses,
  isCurrent
}) {
  const gradient = player === Player.BLACK ? 'from-slate-900 via-slate-800 to-slate-700' : 'from-amber-200 via-amber-300 to-amber-100';
  const textColor = player === Player.BLACK ? 'text-amber-100' : 'text-amber-800';
  const badge = player === Player.BLACK ? '黑' : '白';
  const character = characters[player];
  const freeze = statuses.freeze[player] || 0;
  const skip = statuses.skip[player] || 0;

  return h(
    'div',
    {
      className: `flex items-center gap-4 px-4 py-3 rounded-3xl shadow-xl border border-amber-500/40 bg-gradient-to-br ${gradient} ${textColor} ${
        isCurrent ? 'ring-2 ring-amber-400' : 'opacity-90'
      }`
    },
    h(
      'div',
      {
        className:
          'w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 via-amber-400 to-amber-300 flex items-center justify-center text-2xl font-bold text-stone-900 shadow-inner'
      },
      badge
    ),
    h(
      'div',
      { className: 'flex-1 space-y-1' },
      h('div', { className: 'text-xl font-semibold tracking-wide flex items-center gap-2' }, `${PLAYER_NAMES[player]}`,
        isCurrent ? h('span', { className: 'text-sm bg-amber-500/40 px-2 py-0.5 rounded-full' }, '当前行动') : null
      ),
      character
        ? h('div', { className: 'text-sm opacity-90' }, `角色: ${character.name}`)
        : h('div', { className: 'text-sm opacity-70 italic' }, '尚未召唤角色'),
      h(
        'div',
        { className: 'text-xs flex gap-3 opacity-80' },
        h('span', null, `手牌: ${handCount}`),
        h('span', null, `落子: ${moveCount}`),
        h('span', null, `场上棋子: ${stonesCount}`)
      )
    ),
    (freeze > 0 || skip > 0)
      ? h(
          'div',
          { className: 'text-xs text-amber-100 flex flex-col items-end gap-1' },
          freeze > 0 ? h('span', null, `冻结: ${freeze}`) : null,
          skip > 0 ? h('span', null, `跳过: ${skip}`) : null
        )
      : null
  );
}

export function ZonePanel({ title, graveyard, shichahai, align = 'left' }) {
  return h(
    'div',
    {
      className:
        'bg-gradient-to-br from-stone-800 via-stone-700 to-stone-900 text-amber-100 rounded-3xl shadow-2xl border border-amber-500/30 p-4 space-y-4 max-h-[26rem] overflow-hidden'
    },
    h('h3', { className: 'text-lg font-semibold tracking-wide uppercase text-amber-200' }, title),
    h(
      'div',
      { className: 'space-y-3 text-sm' },
      h('div', { className: 'space-y-2' },
        h('div', { className: 'font-semibold text-amber-300' }, '墓地'),
        graveyard.length === 0
          ? h('div', { className: 'text-xs text-amber-200/70 italic' }, '暂无卡牌')
          : h(
              'ul',
              { className: 'max-h-24 overflow-y-auto pr-1 space-y-1' },
              graveyard.map(item =>
                h(
                  'li',
                  {
                    key: item.id,
                    className: 'flex justify-between gap-3 bg-stone-900/60 rounded-xl px-3 py-1.5'
                  },
                  h('span', { className: 'font-medium' }, item.cardName),
                  h('span', { className: 'text-xs text-amber-200/70' }, `T${item.turn}`)
                )
              )
            )
      ),
      h('div', { className: 'space-y-2' },
        h('div', { className: 'font-semibold text-amber-300' }, '什刹海'),
        shichahai.length === 0
          ? h('div', { className: 'text-xs text-amber-200/70 italic' }, '尚无被驱逐的棋子')
          : h(
              'ul',
              { className: 'max-h-24 overflow-y-auto pr-1 space-y-1' },
              shichahai.map(entry =>
                h(
                  'li',
                  {
                    key: entry.id,
                    className: 'bg-stone-900/60 rounded-xl px-3 py-1.5 text-xs leading-snug'
                  },
                  h('div', { className: 'font-semibold' }, `T${entry.turn} (${entry.row}, ${entry.col})`),
                  h('div', { className: 'opacity-80' }, entry.cardName ? `来源: ${entry.cardName}` : '技能触发')
                )
              )
            )
      )
    )
  );
}

export function MulliganPanel({ player, card, onKeep, onReplace }) {
  return h(
    'div',
    {
      className:
        'max-w-xl mx-auto bg-white/95 rounded-3xl shadow-2xl p-6 space-y-4 border-4 border-amber-400'
    },
    h('h2', { className: 'text-2xl font-bold text-amber-700 text-center' }, `${PLAYER_NAMES[player]} 的调度阶段`),
    h('p', { className: 'text-sm text-gray-600 text-center' }, '你可以保留当前手牌或将其置入墓地并抽取新牌。'),
    card
      ? h(
          'div',
          { className: 'flex justify-center' },
          h(CardView, { card, onClick: () => {}, disabled: true })
        )
      : h('div', { className: 'text-center text-gray-500 italic' }, '当前无可用手牌'),
    h(
      'div',
      { className: 'flex gap-4 justify-center' },
      h(
        'button',
        {
          type: 'button',
          onClick: onKeep,
          className:
            'px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all'
        },
        '保留手牌'
      ),
      h(
        'button',
        {
          type: 'button',
          onClick: onReplace,
          className:
            'px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all'
        },
        '换一张'
      )
    )
  );
}

export function SetupScreen({ onStart }) {
  return h(
    'div',
    { className: 'max-w-2xl mx-auto text-center bg-white/90 p-8 rounded-3xl shadow-2xl space-y-6' },
    h('h2', { className: 'text-3xl font-bold' }, '游戏规则'),
    h(
      'div',
      { className: 'text-left space-y-2 text-gray-700' },
      [
        '• 15×15 五子棋棋盘，连成五子获胜',
        '• 初始各抽 2 张手牌，每落子 3 次抽 1 张',
        '• 第 6 步起可使用技能卡牌',
        '• 进攻卡在落子前使用，反击卡在对方使用技能时响应',
        '• 合体技需要“张兴朝”在场'
      ].map((text, idx) => h('p', { key: idx }, text))
    ),
    h(
      'div',
      { className: 'flex gap-4 justify-center' },
      h(
        'button',
        {
          type: 'button',
          onClick: () => onStart(false),
          className:
            'bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all'
        },
        '双人对战'
      ),
      h(
        'button',
        {
          type: 'button',
          onClick: () => onStart(true),
          className:
            'bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all'
        },
        'AI对战'
      )
    )
  );
}

export function GameOverPanel({ winner, onRestart }) {
  return h(
    'div',
    {
      className:
        'bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-3xl shadow-2xl text-center space-y-4 text-white'
    },
    h('h2', { className: 'text-3xl font-bold' }, `${PLAYER_NAMES[winner]} 获胜！`),
    h(
      'button',
      {
        type: 'button',
        onClick: onRestart,
        className: 'bg-white text-orange-600 px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all'
      },
      '再来一局'
    )
  );
}
