import { PLAYER_NAMES, PlayerEnum, getOpponent } from '../core/constants';
import { generateId } from '../core/utils';
import type {
  GameLogEntry,
  GameStatus,
  PendingAction,
  RawCard,
  ShichahaiEntry,
  TargetRequest,
  CounterWindow,
  GraveyardEntry,
  Player
} from '../types';

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
} as const;

export type SkillEffectId = (typeof SkillEffect)[keyof typeof SkillEffect];

export interface EffectContext {
  cardsByTid: Map<string, RawCard>;
  charactersByTid: Map<string, any>;
  allCards: RawCard[];
}

export interface EffectPrepareResult {
  request?: Partial<TargetRequest>;
  metadata?: Record<string, unknown>;
  logs?: GameLogEntry[];
  cancelled?: boolean;
}

export interface EffectHelpers {
  log: (message: string, type?: string) => void;
  addShichahai: (player: Player, card: RawCard, row: number, col: number, snapshot: { turn: number; board: any }) => void;
  addTimelineEntry: (entry: any) => void;
  setWinner: (player: Player) => void;
  updateStatuses: (
    updater: (statuses: GameStatus['statuses']) => GameStatus['statuses']
  ) => void;
  setCharacters: (characters: Record<Player, any>) => void;
}

export interface PendingWithMeta extends PendingAction {
  metadata: Record<string, any>;
}

const effectHandlers: Record<SkillEffectId, {
  prepare?: (state: GameStatus, action: PendingAction, context: EffectContext) => EffectPrepareResult | void;
  resolve?: (state: GameStatus, action: PendingWithMeta, context: EffectContext, helpers: EffectHelpers) => void;
}> = {
  [SkillEffect.RemoveToShichahai]: {
    prepare: (state, action) => {
      const opponent = getOpponent(action.player);
      const targets = collectCells(state.board, value => value === opponent);
      if (targets.length === 0) {
        return {
          logs: [effectLog('没有可移除的棋子，技能失效', 'error')],
          cancelled: true
        };
      }
      return {
        request: {
          type: 'cell',
          title: action.card.nameZh,
          description: '选择要移入什刹海的敌方棋子',
          player: action.player,
          cells: targets
        }
      };
    },
    resolve: (state, action, _context, helpers) => {
      if (!action.selection) {
        helpers.log('未选择目标，技能未生效', 'error');
        return;
      }
      const { row, col } = action.selection as { row: number; col: number };
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
      helpers.log(`${PLAYER_NAMES[action.player]} 将 ${PLAYER_NAMES[occupant]} 的棋子移入什刹海`, 'effect');
    }
  },
  [SkillEffect.FreezeOpponent]: {
    resolve: (state, action, _context, helpers) => {
      const opponent = getOpponent(action.player);
      const turns = Number(action.params.turns ?? 2);
      helpers.updateStatuses(statuses => ({
        freeze: updateTuple(statuses.freeze, opponent, statuses.freeze[opponent] + turns),
        skip: [...statuses.skip] as [number, number],
        fusionLock: [...statuses.fusionLock] as [number, number]
      }));
      helpers.log(`${PLAYER_NAMES[opponent]} 被冻结 ${turns} 回合`, 'effect');
    }
  },
  [SkillEffect.InstantWin]: {
    resolve: (state, action, _context, helpers) => {
      helpers.setWinner(action.player);
      helpers.log(`${PLAYER_NAMES[action.player]} 宣布胜利！`, 'win');
      action.metadata.preWinSnapshot = {
        board: state.board.toSnapshot(),
        shichahai: state.shichahai.map(entry => ({ ...entry })),
        timeline: state.timeline.slice(),
        moveCount: [...state.moveCount] as [number, number],
        turnCount: state.turnCount,
        currentPlayer: state.currentPlayer
      };
    }
  },
  [SkillEffect.CleanSweep]: {
    resolve: (state, action, _context, helpers) => {
      const snapshot = {
        turn: state.turnCount,
        board: state.board.toSnapshot()
      };
      [action.player, getOpponent(action.player)].forEach(targetPlayer => {
        const stones = collectCells(state.board, value => value === targetPlayer);
        if (stones.length === 0) return;
        const picked = stones[Math.floor(Math.random() * stones.length)];
        state.board.remove(picked.row, picked.col);
        helpers.addShichahai(targetPlayer, action.card, picked.row, picked.col, snapshot);
      });
      helpers.log('随机清扫敌我双方的棋子', 'effect');
    }
  },
  [SkillEffect.TimeRewind]: {
    prepare: (state, action) => {
      const maxSteps = Number(action.params.maxSteps ?? 6);
      const options = state.timeline
        .filter(entry => entry.turn > 0)
        .slice(-maxSteps)
        .reverse();
      if (options.length === 0) {
        return { logs: [effectLog('没有可回溯的局面', 'error')], cancelled: true };
      }
      return {
        request: {
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
      const entry = state.timeline.find(item => item.id === action.selection.id);
      if (!entry) {
        helpers.log('未找到指定的时间节点', 'error');
        return;
      }
      state.board.restore(entry.board);
      state.shichahai = entry.shichahai.map(item => ({ ...item }));
      state.timeline = state.timeline.filter(item => item.turn <= entry.turn);
      state.turnCount = entry.turn;
      state.moveCount = recomputeMoveCount(state.timeline);
      state.currentPlayer = entry.player !== null ? getOpponent(entry.player as Player) : PlayerEnum.BLACK;
      helpers.log(`时光倒流至第 ${entry.turn} 回合`, 'effect');
    }
  },
  [SkillEffect.SkipNextTurn]: {
    resolve: (state, action, _context, helpers) => {
      const opponent = getOpponent(action.player);
      const turns = Number(action.params.turns ?? 1);
      helpers.updateStatuses(statuses => ({
        freeze: [...statuses.freeze] as [number, number],
        skip: updateTuple(statuses.skip, opponent, statuses.skip[opponent] + turns),
        fusionLock: [...statuses.fusionLock] as [number, number]
      }));
      helpers.log(`${PLAYER_NAMES[opponent]} 将跳过 ${turns} 个回合`, 'effect');
    }
  },
  [SkillEffect.SummonCharacter]: {
    resolve: (state, action, context, helpers) => {
      const characterTid = String(action.params.character ?? '');
      const character = characterTid ? context.charactersByTid.get(characterTid) : null;
      if (!character) {
        helpers.log('未找到可召唤的角色', 'error');
        return;
      }
      const characters = { ...state.characters };
      characters[action.player] = character;
      helpers.setCharacters(characters);
      helpers.updateStatuses(statuses => ({
        freeze: [...statuses.freeze] as [number, number],
        skip: [...statuses.skip] as [number, number],
        fusionLock: updateTuple(statuses.fusionLock, action.player, state.turnCount + 1)
      }));
      helpers.log(`${PLAYER_NAMES[action.player]} 召唤了 ${character.name}`, 'summon');
    }
  },
  [SkillEffect.ForceExit]: {
    resolve: (state, action, _context, helpers) => {
      const targetTid = action.params.target ? String(action.params.target) : null;
      const opponent = getOpponent(action.player);
      const current = state.characters[opponent];
      if (!current || (targetTid && String(current._tid ?? current.tid) !== targetTid)) {
        helpers.log('对手没有可驱逐的角色', 'error');
        return;
      }
      const characters = { ...state.characters };
      characters[opponent] = null;
      helpers.setCharacters(characters);
      helpers.log(`${PLAYER_NAMES[opponent]} 的 ${current.name} 被强制退场`, 'effect');
    }
  },
  [SkillEffect.CounterRetrieve]: {
    prepare: (state, counter) => {
      const target = counter.targetAction?.selection as { row: number; col: number } | undefined;
      if (!target) {
        return { logs: [effectLog('没有目标棋子可拾回', 'error')], cancelled: true };
      }
      const emptyCells = collectCells(state.board, value => value === null);
      if (emptyCells.length === 0) {
        return { logs: [effectLog('棋盘已满，无法重新放置棋子', 'error')], cancelled: true };
      }
      return {
        request: {
          type: 'cell',
          title: counter.card.nameZh,
          description: '选择拾回棋子的落点',
          player: counter.player,
          cells: emptyCells,
          origin: target
        },
        metadata: { original: target }
      };
    },
    resolve: (state, counter, _context, helpers) => {
      const original = counter.metadata?.original as { row: number; col: number } | undefined;
      if (!original) {
        helpers.log('拾回失败：缺少原始位置', 'error');
        return;
      }
      const owner = state.board.get(original.row, original.col);
      if (owner === null) {
        helpers.log('原位置没有棋子需要拾回', 'effect');
        return;
      }
      const dest = counter.selection as { row: number; col: number } | undefined;
      if (!dest) {
        helpers.log('未选择新的落点，拾回失效', 'error');
        return;
      }
      if (state.board.get(dest.row, dest.col) !== null) {
        helpers.log('目标位置已被占用', 'error');
        return;
      }
      state.board.remove(original.row, original.col);
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
      helpers.updateStatuses(statuses => ({
        freeze: updateTuple(statuses.freeze, counter.player, 0),
        skip: [...statuses.skip] as [number, number],
        fusionLock: [...statuses.fusionLock] as [number, number]
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
      const snapshot = counter.targetAction?.metadata?.preWinSnapshot;
      if (!snapshot) {
        helpers.log('暂无可恢复的棋盘快照', 'error');
        return;
      }
      state.board.restore(snapshot.board);
      state.shichahai = snapshot.shichahai.map((entry: ShichahaiEntry) => ({ ...entry }));
      state.timeline = snapshot.timeline.slice();
      state.moveCount = [...snapshot.moveCount] as [number, number];
      state.turnCount = snapshot.turnCount;
      state.currentPlayer = snapshot.currentPlayer;
      state.phase = 'playing';
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
      helpers.updateStatuses(statuses => ({
        freeze: [...statuses.freeze] as [number, number],
        skip: updateTuple(statuses.skip, punished, statuses.skip[punished] + 1),
        fusionLock: [...statuses.fusionLock] as [number, number]
      }));
      helpers.log(`${PLAYER_NAMES[punished]} 遭受道德制裁，下回合无法行动`, 'counter');
    }
  }
};

const effectLog = (message: string, type: string): GameLogEntry => ({
  message,
  type,
  time: Date.now()
});

const updateTuple = (tuple: [number, number], index: Player, value: number): [number, number] => {
  const next = [...tuple] as [number, number];
  next[index] = value;
  return next;
};

const collectCells = (
  board: GameStatus['board'],
  predicate: (value: Player | null, row: number, col: number) => boolean
): Array<{ row: number; col: number }> => {
  const cells: Array<{ row: number; col: number }> = [];
  board.forEachCell((row, col, value) => {
    if (predicate(value, row, col)) {
      cells.push({ row, col });
    }
  });
  return cells;
};

const recomputeMoveCount = (timeline: GameStatus['timeline']): [number, number] => {
  const counts: [number, number] = [0, 0];
  timeline.forEach(entry => {
    if (entry.player === PlayerEnum.BLACK) counts[PlayerEnum.BLACK]++;
    if (entry.player === PlayerEnum.WHITE) counts[PlayerEnum.WHITE]++;
  });
  return counts;
};

export const prepareCardEffect = (
  state: GameStatus,
  action: PendingAction,
  context: EffectContext
): EffectPrepareResult => {
  const handler = effectHandlers[action.effectId as SkillEffectId];
  if (!handler?.prepare) return {};
  return handler.prepare(state, action, context) ?? {};
};

export const resolveCardEffect = (
  state: GameStatus,
  action: PendingWithMeta,
  context: EffectContext,
  helpers: EffectHelpers
) => {
  const handler = effectHandlers[action.effectId as SkillEffectId];
  if (!handler?.resolve) return;
  handler.resolve(state, action, context, helpers);
};

export const prepareCounterEffect = (
  state: GameStatus,
  counter: PendingAction,
  context: EffectContext
): EffectPrepareResult => {
  const handler = effectHandlers[counter.effectId as SkillEffectId];
  if (!handler?.prepare) return {};
  return handler.prepare(state, counter, context) ?? {};
};

export const resolveCounterEffect = (
  state: GameStatus,
  counter: PendingWithMeta,
  context: EffectContext,
  helpers: EffectHelpers
) => {
  const handler = effectHandlers[counter.effectId as SkillEffectId];
  if (!handler?.resolve) return;
  handler.resolve(state, counter, context, helpers);
};
