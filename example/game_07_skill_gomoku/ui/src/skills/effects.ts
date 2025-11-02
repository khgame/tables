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
  enqueueVisual: (payload: { effectId?: string; card: RawCard; player: Player; role?: 'attacker' | 'counter' | 'normal' }) => void;
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
      const expiresAtTurn = state.turnCount + 1;
      helpers.updateStatuses(statuses => ({
        freeze: [...statuses.freeze] as [number, number],
        skip: [...statuses.skip] as [number, number],
        fusionLock: [...statuses.fusionLock] as [number, number],
        sealedCells: updateSealedCells(statuses.sealedCells, occupant, { row, col, expiresAtTurn })
      }));
      helpers.log(`${PLAYER_NAMES[occupant]} 的落点 (${row + 1}, ${col + 1}) 被沙尘封禁，下回合不得在此落子`, 'effect');
      helpers.log(`${PLAYER_NAMES[action.player]} 本回合放弃落子机会`, 'effect');
    }
  },
  [SkillEffect.FreezeOpponent]: {
    resolve: (state, action, _context, helpers) => {
      const opponent = getOpponent(action.player);
      const turns = Number(action.params.turns ?? 2);
      helpers.updateStatuses(statuses => ({
        freeze: updateTuple(statuses.freeze, opponent, statuses.freeze[opponent] + turns),
        skip: [...statuses.skip] as [number, number],
        fusionLock: [...statuses.fusionLock] as [number, number],
        sealedCells: cloneSealedCells(statuses.sealedCells)
      }));
      helpers.log(`${PLAYER_NAMES[opponent]} 被冻结 ${turns} 回合`, 'effect');
    }
  },
  [SkillEffect.InstantWin]: {
    prepare: (state, action, _context) => {
      // 在准备阶段创建快照，供反击技能使用
      action.metadata.preWinSnapshot = {
        board: state.board.toSnapshot(),
        shichahai: state.shichahai.map(entry => ({ ...entry })),
        timeline: state.timeline.slice(),
        moveCount: [...state.moveCount] as [number, number],
        turnCount: state.turnCount,
        currentPlayer: state.currentPlayer
      };
      return {};
    },
    resolve: (state, action, _context, helpers) => {
      helpers.setWinner(action.player);
      helpers.log(`${PLAYER_NAMES[action.player]} 宣布胜利！`, 'win');
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
    resolve: (state, _action, _context, helpers) => {
      // 新规则：悔棋效果 —— 移除双方最近一轮的落子（各移除一手，若某方无落子则忽略）
      const board = state.board as any;
      const history = board.history as Array<{ row: number; col: number; player: Player }>;
      if (!Array.isArray(history) || history.length === 0) {
        helpers.log('暂无可回退的落子', 'error');
        return;
      }

      const removeLastOf = (player: Player): { row: number; col: number } | null => {
        for (let i = history.length - 1; i >= 0; i--) {
          if (history[i].player === player) {
            const { row, col } = history[i];
            board.remove(row, col);
            history.splice(i, 1);
            return { row, col };
          }
        }
        return null;
      };

      const removedWhite = removeLastOf(PlayerEnum.WHITE);
      const removedBlack = removeLastOf(PlayerEnum.BLACK);

      // 同步移除对应的时间线记录（若存在）
      const popTimelineForMove = (player: Player, pos: { row: number; col: number } | null) => {
        if (!pos) return;
        for (let i = state.timeline.length - 1; i >= 0; i--) {
          const entry = state.timeline[i];
          if (entry.move && entry.player === player && entry.move.row === pos.row && entry.move.col === pos.col) {
            state.timeline.splice(i, 1);
            break;
          }
        }
      };
      popTimelineForMove(PlayerEnum.WHITE, removedWhite);
      popTimelineForMove(PlayerEnum.BLACK, removedBlack);

      // 更新回合统计与总手数（不还原卡牌/墓地/手牌）
      const removedCount = (removedWhite ? 1 : 0) + (removedBlack ? 1 : 0);
      state.turnCount = Math.max(0, state.turnCount - removedCount);
      state.moveCount = recomputeMoveCount(state.timeline);

      // 当前行动方保持不变（使用技能不消耗落子权）
      const segments: string[] = [];
      if (removedBlack) segments.push(`黑方 (${removedBlack.row}, ${removedBlack.col})`);
      if (removedWhite) segments.push(`白方 (${removedWhite.row}, ${removedWhite.col})`);
      if (segments.length > 0) {
        helpers.log(`时光倒流：移除了最近一轮落子（${segments.join('，')}）`, 'effect');
      } else {
        helpers.log('时光倒流：无可回退的落子', 'effect');
      }

      // 为避免“刚撤回又立刻落在同一位置”的不自然情况，
      // 对双方被撤回的位置各自设置一回合的禁手（至下一回合结束）。
      const expireAt = state.turnCount + 1;
      const nextSealed = cloneSealedCells(state.statuses.sealedCells);
      if (removedWhite) {
        nextSealed[PlayerEnum.WHITE] = { row: removedWhite.row, col: removedWhite.col, expiresAtTurn: expireAt };
      }
      if (removedBlack) {
        nextSealed[PlayerEnum.BLACK] = { row: removedBlack.row, col: removedBlack.col, expiresAtTurn: expireAt };
      }
      helpers.updateStatuses(statuses => ({
        freeze: [...statuses.freeze] as [number, number],
        skip: [...statuses.skip] as [number, number],
        fusionLock: [...statuses.fusionLock] as [number, number],
        sealedCells: nextSealed
      }));
      if (removedWhite || removedBlack) {
        helpers.log('撤回位置本回合禁止再次落子', 'effect');
      }
    }
  },
  [SkillEffect.SkipNextTurn]: {
    resolve: (state, action, _context, helpers) => {
      const opponent = getOpponent(action.player);
      const turns = Number(action.params.turns ?? 1);
      helpers.updateStatuses(statuses => ({
        freeze: [...statuses.freeze] as [number, number],
        skip: updateTuple(statuses.skip, opponent, statuses.skip[opponent] + turns),
        fusionLock: [...statuses.fusionLock] as [number, number],
        sealedCells: cloneSealedCells(statuses.sealedCells)
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
        fusionLock: updateTuple(statuses.fusionLock, action.player, state.turnCount + 1),
        sealedCells: cloneSealedCells(statuses.sealedCells)
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
      // 检查目标技能是否免疫拾回（如棒球）
      const action = counter.targetAction;
      if (action?.params && action.params.ignoreSeize) {
        return { logs: [effectLog('目标技能免疫拾回，反击失败', 'error')], cancelled: true };
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
      helpers.log(`${PLAYER_NAMES[counter.player]} 将棋子安置在 (${dest.row + 1}, ${dest.col + 1})`, 'counter');
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
        fusionLock: [...statuses.fusionLock] as [number, number],
        sealedCells: cloneSealedCells(statuses.sealedCells)
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
      // 反击成功后，立即将回合权交给反击方，并开始新的可行动回合
      state.currentPlayer = counter.player;
      (state as any).aiTurnId = ((state as any).aiTurnId ?? 0) + 1;
      state.phase = 'playing';
      state.winner = null;
      helpers.log('东山再起，棋局恢复如初', 'counter');

      const punished = getOpponent(counter.player);
      helpers.updateStatuses(statuses => ({
        freeze: [...statuses.freeze] as [number, number],
        skip: updateTuple(statuses.skip, punished, statuses.skip[punished] + 1),
        fusionLock: [...statuses.fusionLock] as [number, number],
        sealedCells: cloneSealedCells(statuses.sealedCells)
      }));
      helpers.log(`${PLAYER_NAMES[punished]} 将跳过下一个回合`, 'counter');
    }
  },
  [SkillEffect.CounterCancelFusion]: {
    resolve: (state, counter, _context, helpers) => {
      const target = state.pendingAction;
      if (target?.params && (target.params as Record<string, unknown>).immuneShout) {
        helpers.log('目标技能免疫喝止，反击未奏效', 'error');
        return;
      }
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
        fusionLock: [...statuses.fusionLock] as [number, number],
        sealedCells: cloneSealedCells(statuses.sealedCells)
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

const cloneSealedCells = (
  sealed: GameStatus['statuses']['sealedCells']
): GameStatus['statuses']['sealedCells'] =>
  sealed.map(cell => (cell ? { ...cell } : null)) as [
    { row: number; col: number; expiresAtTurn: number } | null,
    { row: number; col: number; expiresAtTurn: number } | null
  ];

const updateSealedCells = (
  sealed: GameStatus['statuses']['sealedCells'],
  index: Player,
  value: { row: number; col: number; expiresAtTurn: number } | null
): GameStatus['statuses']['sealedCells'] => {
  const next = cloneSealedCells(sealed);
  next[index] = value ? { ...value } : null;
  return next;
};

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
