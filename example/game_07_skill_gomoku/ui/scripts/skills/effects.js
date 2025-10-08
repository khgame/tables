import { PLAYER_NAMES, Player, getOpponent, GamePhase } from '../core/constants.js';

export const SkillEffect = {
  RemoveToShichahai: 'remove-to-shichahai',
  FreezeOpponent: 'freeze-opponent',
  InstantWin: 'instant-win',
  CleanSweep: 'clean-sweep',
  TimeRewind: 'time-rewind',
  SkipNextTurn: 'skip-next-turn',
  CounterRetrieve: 'counter-retrieve',
  CounterPreventRemoval: 'counter-prevent-removal',
  CounterThaw: 'counter-thaw',
  CounterReverseWin: 'counter-reverse-win',
  CounterRestoreBoard: 'counter-restore-board',
  CounterCancelFusion: 'counter-cancel-fusion',
  CounterPunish: 'counter-punish',
  SummonCharacter: 'summon-character',
  ForceExit: 'force-exit'
};

export function prepareCardEffect(state, action, context) {
  const handler = cardEffectHandlers[action.effectId];
  if (!handler || !handler.prepare) return {};
  return handler.prepare(state, action, context) || {};
}

export function resolveCardEffect(state, action, context, helpers) {
  const handler = cardEffectHandlers[action.effectId];
  if (!handler || !handler.resolve) return;
  handler.resolve(state, action, context, helpers);
}

export function prepareCounterEffect(state, counter, context) {
  const handler = counterEffectHandlers[counter.effectId];
  if (!handler || !handler.prepare) return {};
  return handler.prepare(state, counter, context) || {};
}

export function resolveCounterEffect(state, counter, context, helpers) {
  const handler = counterEffectHandlers[counter.effectId];
  if (!handler || !handler.resolve) return;
  handler.resolve(state, counter, context, helpers);
}

const cardEffectHandlers = {
  [SkillEffect.RemoveToShichahai]: {
    prepare: (state, action) => {
      const opponent = getOpponent(action.player);
      const targets = collectCells(state.board, value => value === opponent);
      if (targets.length === 0) {
        return {
          logs: [effectLog('没有可移除的棋子，技能失效', 'error')],
          metadata: { cancelled: true }
        };
      }
      return {
        request: createCellRequest({
          title: action.card.nameZh,
          description: '选择要移入什刹海的敌方棋子',
          player: action.player,
          cells: targets
        }),
        metadata: {
          targetPlayer: opponent
        }
      };
    },
    resolve: (state, action, _context, helpers) => {
      if (!action.selection) {
        helpers.log('未选择目标，技能未生效', 'error');
        return;
      }
      const { row, col } = action.selection;
      const snapshot = {
        turn: state.turnCount,
        board: state.board.toSnapshot()
      };
      const occupant = state.board.get(row, col);
      if (occupant === null) {
        helpers.log('目标格为空，技能作废', 'error');
        return;
      }
      state.board.remove(row, col);
      helpers.addShichahai(occupant, action.card, row, col, snapshot);
      helpers.log(
        `${PLAYER_NAMES[action.player]} 将 ${PLAYER_NAMES[occupant]} 的棋子移入什刹海`,
        'effect'
      );
    }
  },
  [SkillEffect.FreezeOpponent]: {
    resolve: (state, action, _context, helpers) => {
      const opponent = getOpponent(action.player);
      const turns = action.params.turns ? Number(action.params.turns) : 2;
      helpers.updateStatuses(statuses => {
        const freeze = statuses.freeze.slice();
        freeze[opponent] += turns;
        return {
          freeze,
          skip: statuses.skip.slice(),
          fusionLock: statuses.fusionLock.slice()
        };
      });
      helpers.log(`${PLAYER_NAMES[opponent]} 被冻结 ${turns} 回合`, 'effect');
    }
  },
  [SkillEffect.InstantWin]: {
    resolve: (state, action, _context, helpers) => {
      helpers.setWinner(action.player);
      helpers.log(`${PLAYER_NAMES[action.player]} 宣布胜利！`, 'win');
      state.pendingAction.metadata = {
        ...(state.pendingAction.metadata || {}),
        preWinSnapshot: {
          board: state.board.toSnapshot(),
          shichahai: state.shichahai.map(entry => ({ ...entry })),
          timeline: state.timeline.slice(),
          moveCount: state.moveCount.slice(),
          turnCount: state.turnCount,
          currentPlayer: state.currentPlayer
        }
      };
    }
  },
  [SkillEffect.CleanSweep]: {
    resolve: (state, action, _context, helpers) => {
      const snapshot = {
        turn: state.turnCount,
        board: state.board.toSnapshot()
      };
      const players = [action.player, getOpponent(action.player)];
      players.forEach(targetPlayer => {
        const stones = collectCells(state.board, value => value === targetPlayer);
        if (stones.length === 0) return;
        const picked = stones[Math.floor(Math.random() * stones.length)];
        state.board.remove(picked.row, picked.col);
        helpers.addShichahai(targetPlayer, action.card, picked.row, picked.col, snapshot);
      });
      helpers.log('保洁上门，敌我双方的棋子都被随机清理', 'effect');
    }
  },
  [SkillEffect.TimeRewind]: {
    prepare: (state, action) => {
      const maxSteps = action.params.maxSteps ? Number(action.params.maxSteps) : 6;
      const options = state.timeline
        .filter(entry => entry.turn > 0)
        .slice(-maxSteps)
        .reverse();
      if (options.length === 0) {
        return {
          logs: [effectLog('没有可回溯的局面', 'error')]
        };
      }
      return {
        request: {
          id: '',
          type: 'snapshot',
          title: action.card.nameZh,
          description: '选择要回溯的回合',
          player: action.player,
          options: options.map(entry => ({
            id: entry.id,
            turn: entry.turn,
            player: entry.player,
            move: entry.move
          }))
        }
      };
    },
    resolve: (state, action, _context, helpers) => {
      if (!action.selection) {
        helpers.log('未选择回溯目标，技能未生效', 'error');
        return;
      }
      const entry = findTimelineEntry(state, action.selection.id);
      if (!entry) {
        helpers.log('未找到指定的时间节点', 'error');
        return;
      }

      state.board.restore(entry.board);
      state.shichahai = entry.shichahai.map(item => ({ ...item }));
      state.timeline = state.timeline.filter(item => item.turn <= entry.turn);
      state.turnCount = entry.turn;
      state.moveCount = recomputeMoveCount(state.timeline);
      state.currentPlayer = entry.player !== null ? getOpponent(entry.player) : Player.BLACK;

      helpers.log(`时光倒流至第 ${entry.turn} 回合`, 'effect');
    }
  },
  [SkillEffect.SkipNextTurn]: {
    resolve: (state, action, _context, helpers) => {
      const opponent = getOpponent(action.player);
      const turns = action.params.turns ? Number(action.params.turns) : 1;
      helpers.updateStatuses(statuses => {
        const skip = statuses.skip.slice();
        skip[opponent] += turns;
        return {
          freeze: statuses.freeze.slice(),
          skip,
          fusionLock: statuses.fusionLock.slice()
        };
      });
      helpers.log(`${PLAYER_NAMES[opponent]} 将跳过 ${turns} 个回合`, 'effect');
    }
  },
  [SkillEffect.SummonCharacter]: {
    resolve: (state, action, context, helpers) => {
      const characterTid = action.params.character ? String(action.params.character) : null;
      if (!characterTid) {
        helpers.log('未定义召唤角色，技能失效', 'error');
        return;
      }
      const character = context.charactersByTid.get(characterTid);
      if (!character) {
        helpers.log('角色数据缺失，技能失效', 'error');
        return;
      }
      const characters = { ...state.characters };
      characters[action.player] = character;
      helpers.setCharacters(characters);
      helpers.updateStatuses(statuses => {
        const fusionLock = statuses.fusionLock.slice();
        fusionLock[action.player] = state.turnCount + 1;
        return {
          freeze: statuses.freeze.slice(),
          skip: statuses.skip.slice(),
          fusionLock
        };
      });
      helpers.log(`${PLAYER_NAMES[action.player]} 召唤了 ${character.name}`, 'summon');
    }
  },
  [SkillEffect.ForceExit]: {
    resolve: (state, action, _context, helpers) => {
      const targetTid = action.params.target ? String(action.params.target) : null;
      const opponent = getOpponent(action.player);
      const current = state.characters[opponent];
      if (!current || (targetTid && String(current._tid || current.tid) !== targetTid)) {
        helpers.log('对手没有可驱逐的角色', 'error');
        return;
      }
      const characters = { ...state.characters };
      characters[opponent] = null;
      helpers.setCharacters(characters);
      helpers.log(`${PLAYER_NAMES[opponent]} 的 ${current.name} 被强制退场`, 'effect');
    }
  }
};

const counterEffectHandlers = {
  [SkillEffect.CounterRetrieve]: {
    prepare: (state, counter) => {
      const target = counter.targetAction && counter.targetAction.selection;
      if (!target) {
        return {
          logs: [effectLog('没有目标棋子可拾回', 'error')]
        };
      }
      const emptyCells = collectCells(state.board, value => value === null);
      if (emptyCells.length === 0) {
        return {
          logs: [effectLog('棋盘已满，无法重新放置棋子', 'error')]
        };
      }
      const request = createCellRequest({
          title: counter.card.nameZh,
          description: '选择拾回棋子的落点',
          player: counter.player,
          cells: emptyCells
        });
      request.origin = target;
      return {
        request,
        metadata: {
          original: target
        }
      };
    },
    resolve: (state, counter, _context, helpers) => {
      const original = counter.metadata && counter.metadata.original;
      if (!original) {
        helpers.log('拾回失败：缺少原始位置', 'error');
        return;
      }
      const { row, col } = original;
      const owner = state.board.get(row, col);
      if (owner === null) {
        helpers.log('原位置没有棋子需要拾回', 'effect');
        return;
      }
      const dest = counter.selection;
      if (!dest) {
        helpers.log('未选择新的落点，拾回失效', 'error');
        return;
      }
      if (state.board.get(dest.row, dest.col) !== null) {
        helpers.log('目标位置已被占用', 'error');
        return;
      }
      state.board.remove(row, col);
      state.board.place(dest.row, dest.col, owner);
      helpers.log(`${PLAYER_NAMES[counter.player]} 将棋子安置在 (${dest.row}, ${dest.col})`, 'counter');
      state.pendingAction = null;
    }
  },
  [SkillEffect.CounterPreventRemoval]: {
    resolve: (state, counter, _context, helpers) => {
      const action = counter.targetAction;
      if (!action || action.effectId !== SkillEffect.RemoveToShichahai) {
        helpers.log('擒拿只对飞沙走石有效', 'error');
        return;
      }
      if (action.params && action.params.ignoreSeize) {
        helpers.log('棒球免疫擒拿，反击失败', 'error');
        return;
      }
      helpers.log('擒拿成功，棋子保留在原位', 'counter');
      state.pendingAction = null;
    }
  },
  [SkillEffect.CounterThaw]: {
    resolve: (state, counter, _context, helpers) => {
      const freeze = state.statuses.freeze.slice();
      freeze[counter.player] = 0;
      helpers.updateStatuses(statuses => ({
        freeze,
        skip: statuses.skip.slice(),
        fusionLock: statuses.fusionLock.slice()
      }));
      helpers.log(`${PLAYER_NAMES[counter.player]} 解除了冻结`, 'counter');
    }
  },
  [SkillEffect.CounterReverseWin]: {
    resolve: (state, counter, _context, helpers) => {
      helpers.setWinner(counter.player);
      helpers.log(`${PLAYER_NAMES[counter.player]} 两极反转，夺取胜利！`, 'win');
    }
  },
  [SkillEffect.CounterRestoreBoard]: {
    resolve: (state, counter, _context, helpers) => {
      const action = counter.targetAction;
      const snapshot = action && action.metadata && action.metadata.preWinSnapshot;
      if (!snapshot) {
        helpers.log('暂无可恢复的棋盘快照', 'error');
        return;
      }
      const boardSnapshot = snapshot.board;
      state.board.restore(boardSnapshot);
      state.shichahai = snapshot.shichahai.map(entry => ({ ...entry }));
      state.timeline = snapshot.timeline.slice();
      state.moveCount = snapshot.moveCount.slice();
      state.turnCount = snapshot.turnCount;
      state.currentPlayer = snapshot.currentPlayer;
      state.phase = GamePhase.PLAYING;
      state.winner = null;
      helpers.log('东山再起，棋局恢复如初', 'counter');
    }
  },
  [SkillEffect.CounterCancelFusion]: {
    resolve: (state, counter, _context, helpers) => {
      helpers.log('合体技被喝止，效果被取消', 'counter');
      state.pendingAction = null;
    }
  },
  [SkillEffect.CounterPunish]: {
    resolve: (state, counter, _context, helpers) => {
      const punished = getOpponent(counter.player);
      helpers.updateStatuses(statuses => {
        const skip = statuses.skip.slice();
        skip[punished] += 1;
        return {
          freeze: statuses.freeze.slice(),
          skip,
          fusionLock: statuses.fusionLock.slice()
        };
      });
      helpers.log(`${PLAYER_NAMES[punished]} 遭受道德制裁，下回合无法行动`, 'counter');
    }
  }
};

function collectCells(board, predicate) {
  const cells = [];
  board.forEachCell((row, col, value) => {
    if (predicate(value, row, col)) {
      cells.push({ row, col, value });
    }
  });
  return cells;
}

function createCellRequest({ title, description, player, cells }) {
  return {
    id: '',
    type: 'cell',
    title,
    description,
    player,
    cells
  };
}

function effectLog(message, type = 'effect') {
  return { message, type, time: Date.now() };
}

function findTimelineEntry(state, id) {
  return state.timeline.find(entry => entry.id === id);
}

function recomputeMoveCount(timeline) {
  const counts = [0, 0];
  timeline.forEach(entry => {
    if (entry.player === Player.BLACK) counts[Player.BLACK]++;
    if (entry.player === Player.WHITE) counts[Player.WHITE]++;
  });
  return counts;
}
