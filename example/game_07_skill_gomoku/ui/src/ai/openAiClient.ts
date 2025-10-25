import type { GameStatus, RawCard, Player, TargetRequest } from "../types";
import {
  PlayerEnum,
  SKILL_UNLOCK_MOVE,
  DRAW_INTERVAL,
  INITIAL_HAND_SIZE,
} from "../core/constants";
import {
  RULES_OVERVIEW,
  PROMPT_ONLY_JSON_NOTICE,
  GOMOKU_STRATEGY_HINTS,
  SKILL_DECISION_HINTS,
  BOARD_RESPONSE_INSTRUCTIONS,
} from "./promptTemplates";
import { aiLog } from "./logger";

export interface AiSettings {
  endpoint: string;
  apiKey: string;
  reasoningModel: string;
  fastModel: string;
}

export type AiScenario =
  | { kind: "mulligan"; player: Player; card: RawCard | null }
  | { kind: "skill"; player: Player; game: GameStatus; skills: Array<{ handIndex: number; card: RawCard }>; contextNote?: string }
  | { kind: "stone"; player: Player; game: GameStatus; contextNote?: string; analysis?: string }
  | {
      kind: "card_targeting";
      player: Player;
      request: TargetRequest;
      game: GameStatus;
    }
  | {
      kind: "counter_window";
      player: Player;
      game: GameStatus;
      pendingCard: GameStatus["pendingAction"];
      availableCounters: Array<{ handIndex: number; card: RawCard }>;
    };

export type AiPlayingDecision =
  | { kind: "place_stone"; board: number[][] }
  | { kind: "place_stone"; row: number; col: number }
  | {
      kind: "play_card";
      cardId?: string;
      handIndex?: number;
      targets?: unknown;
    };

export type AiDecision =
  | { kind: "mulligan"; replace: boolean }
  | AiPlayingDecision
  | { kind: "target_cell"; row: number; col: number }
  | { kind: "target_snapshot"; id: string }
  | {
      kind: "counter";
      useCounter: boolean;
      cardId?: string;
      handIndex?: number;
    };

const BOARD_RESPONSE_PROMPT = BOARD_RESPONSE_INSTRUCTIONS.map((line, index) =>
  index === 0 ? `- ${line}` : `  ${line}`,
).join("\n");

export const DEFAULT_SYSTEM_PROMPT = [
  "You are the AI opponent for a skill-enabled Gomoku duel. You will always receive:",
  "- a JSON object with the current 15x15 board encoded as integers (0 empty, 1 black, 2 white)",
  "- additional context describing available skills, graveyards, statuses, and pending actions",
  "",
  "You must respond with a single JSON object (no markdown fences, no narration). Supported responses:",
  "",
  BOARD_RESPONSE_PROMPT,
  '- {"action":"play_card","cardId":"<card tid or effectId>","targets":[...]}',
  "  Indicate a skill card from your hand to cast. Include any required targets (cells, snapshots, cards).",
  "",
  '- {"action":"pass"}',
  "  Skip using a skill or placing a stone this opportunity.",
  "",
  'For mulligan windows return {"action":"mulligan","replace":true|false}.',
  'For target selection return {"action":"select_cell","row":number,"col":number} or {"action":"select_snapshot","id":"snapshot id"}.',
  'For counter windows return {"action":"counter","useCounter":true|false,"cardId"?:string}.',
  "",
  "Always return valid JSON parsable via JSON.parse.",
].join("\n");

const RULES_TEXT = RULES_OVERVIEW({
  INITIAL_HAND_SIZE,
  DRAW_INTERVAL,
  SKILL_UNLOCK_MOVE,
});
const STRATEGY_TEXT = GOMOKU_STRATEGY_HINTS;
const SKILL_HINT_TEXT = SKILL_DECISION_HINTS;
const AI_REQUEST_TIMEOUT_MS = 45000;

export const hasValidSettings = (
  settings: AiSettings | null | undefined,
): settings is AiSettings => {
  if (!settings) return false;
  return Boolean(settings.endpoint && settings.reasoningModel);
};

const selectModelForScenario = (
  settings: AiSettings,
  scenario: AiScenario["kind"],
): string => {
  if (scenario === "stone") {
    return settings.fastModel || settings.reasoningModel;
  }
  return settings.reasoningModel;
};

export const requestAiDecision = async (
  settings: AiSettings,
  scenario: AiScenario,
  options?: { feedback?: string },
): Promise<AiDecision | null> => {
  const userContent = buildUserPrompt(scenario, options);
  const model = selectModelForScenario(settings, scenario.kind);
  const modelSelectionInfo = { scenario: scenario.kind, model }
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: DEFAULT_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.1,
  };

  aiLog.info("[request_prompt]", body.messages, modelSelectionInfo);

  const controller = new AbortController();
  const timer = window.setTimeout(() => {
    controller.abort();
  }, AI_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(settings.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(settings.apiKey
          ? { Authorization: `Bearer ${settings.apiKey}` }
          : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as DOMException)?.name === "AbortError") {
      throw new Error(
        `AI request timed out after ${AI_REQUEST_TIMEOUT_MS}ms`,
      );
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await safeReadText(response);
    throw new Error(
      `AI request failed: ${response.status} ${response.statusText} ${text}`,
    );
  }

  const payload = await response.json().catch(() => {
    throw new Error("AI response is not valid JSON");
  });
  aiLog.info("[response_raw]", payload, modelSelectionInfo);

  const content = extractMessageContent(payload);
  if (!content) return null;
  aiLog.info("[response_content]", content, modelSelectionInfo);

  const parsed = parseDecision(content, scenario.kind);
  return parsed;
};

const safeReadText = async (resp: Response): Promise<string> => {
  try {
    return await resp.text();
  } catch (err) {
    aiLog.error("failed to read response text", err);
    return "";
  }
};

const extractMessageContent = (payload: any): string | null => {
  if (!payload) return null;
  const choice =
    payload.choices?.[0]?.message?.content ?? payload.choices?.[0]?.text;
  if (typeof choice === "string") return choice;
  return null;
};

const parseDecision = (
  raw: string,
  scenario: AiScenario["kind"],
): AiDecision | null => {
  const json = extractJson(raw);
  if (!json) return null;

  try {
    const data = JSON.parse(json);
    return normaliseDecision(data, scenario);
  } catch (err) {
    aiLog.error("failed to parse AI JSON", err, raw);
    return null;
  }
};

const extractJson = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const fenceMatch = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  if (fenceMatch) return fenceMatch[1];
  const braceStart = trimmed.indexOf("{");
  const braceEnd = trimmed.lastIndexOf("}");
  if (braceStart >= 0 && braceEnd > braceStart) {
    return trimmed.slice(braceStart, braceEnd + 1);
  }
  return null;
};

const normaliseDecision = (
  data: any,
  scenario: AiScenario["kind"],
): AiDecision | null => {
  if (!data || typeof data !== "object") return null;
  const rawAction =
    typeof data.action === "string" ? data.action.toLowerCase() : undefined;

  switch (scenario) {
    case "mulligan": {
      const replaceValue = data.replace ?? data.keep === false;
      if (rawAction === "mulligan" && typeof replaceValue === "boolean") {
        return { kind: "mulligan", replace: Boolean(replaceValue) };
      }
      if (typeof data.replace === "boolean")
        return { kind: "mulligan", replace: data.replace };
      if (typeof data.swap === "boolean")
        return { kind: "mulligan", replace: data.swap };
      break;
    }
    case "skill": {
      if (
        rawAction === "place_stone" ||
        rawAction === "board" ||
        rawAction === "result" ||
        typeof data.result !== "undefined" ||
        typeof data.board !== "undefined" ||
        typeof data.boardAscii !== "undefined"
      ) {
        const boardMatrixRaw =
          (typeof data.result !== "undefined" ? data.result : null) ??
          (typeof data.board !== "undefined" ? data.board : null) ??
          (typeof data.boardAscii !== "undefined" ? data.boardAscii : null);
        const boardMatrix = normaliseBoardMatrix(boardMatrixRaw);
        if (boardMatrix) {
          return { kind: "place_stone", board: boardMatrix };
        }
      }
      if (isNumber(data.row) && isNumber(data.col)) {
        return { kind: "place_stone", row: Number(data.row), col: Number(data.col) };
      }
      if (rawAction === "play_card" || rawAction === "skill") {
        const handIndex = isNumber(data.handIndex ?? data.cardIndex)
          ? Number(data.handIndex ?? data.cardIndex)
          : undefined;
        const cardId =
          typeof data.cardId === "string"
            ? data.cardId
            : typeof data.card === "string"
              ? data.card
              : undefined;
        return {
          kind: "play_card",
          cardId,
          handIndex,
          targets: data.targets ?? data.selection ?? null,
        };
      }
      if (
        rawAction === "pass" ||
        rawAction === "wait" ||
        rawAction === "end_turn"
      ) {
        return { kind: "pass" };
      }
      if (Array.isArray(data.result)) {
        const boardMatrix = normaliseBoardMatrix(data.result);
        if (boardMatrix) {
          return { kind: "place_stone", board: boardMatrix };
        }
      }
      break;
    }
    case "stone": {
      if (
        rawAction === "place_stone" ||
        rawAction === "board" ||
        rawAction === "result" ||
        typeof data.result !== "undefined" ||
        typeof data.board !== "undefined" ||
        typeof data.boardAscii !== "undefined"
      ) {
        const boardMatrixRaw =
          (typeof data.result !== "undefined" ? data.result : null) ??
          (typeof data.board !== "undefined" ? data.board : null) ??
          (typeof data.boardAscii !== "undefined" ? data.boardAscii : null);
        const boardMatrix = normaliseBoardMatrix(boardMatrixRaw);
        if (boardMatrix) {
          return { kind: "place_stone", board: boardMatrix };
        }
      }
      if (isNumber(data.row) && isNumber(data.col)) {
        return { kind: "place_stone", row: Number(data.row), col: Number(data.col) };
      }
      if (
        rawAction === "pass" ||
        rawAction === "wait" ||
        rawAction === "end_turn"
      ) {
        return { kind: "pass" };
      }
      if (Array.isArray(data.result)) {
        const boardMatrix = normaliseBoardMatrix(data.result);
        if (boardMatrix) {
          return { kind: "place_stone", board: boardMatrix };
        }
      }
      break;
    }
    case "card_targeting": {
      if (
        rawAction === "select_cell" &&
        isNumber(data.row) &&
        isNumber(data.col)
      ) {
        return { kind: "target_cell", row: data.row, col: data.col };
      }
      if (rawAction === "select_snapshot" && typeof data.id === "string") {
        return { kind: "target_snapshot", id: data.id };
      }
      break;
    }
    case "counter_window": {
      if (rawAction === "counter") {
        const useCounter = Boolean(
          data.useCounter ?? data.counter ?? data.countered,
        );
        const handIndex = isNumber(data.handIndex ?? data.cardIndex)
          ? Number(data.handIndex ?? data.cardIndex)
          : undefined;
        const cardId =
          typeof data.cardId === "string" ? data.cardId : undefined;
        return { kind: "counter", useCounter, handIndex, cardId };
      }
      if (typeof data.useCounter === "boolean") {
        const handIndex = isNumber(data.handIndex ?? data.cardIndex)
          ? Number(data.handIndex ?? data.cardIndex)
          : undefined;
        const cardId =
          typeof data.cardId === "string" ? data.cardId : undefined;
        return {
          kind: "counter",
          useCounter: data.useCounter,
          handIndex,
          cardId,
        };
      }
      break;
    }
    default:
      return null;
  }

  return null;
};

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const buildUserPrompt = (
  scenario: AiScenario,
  options?: { feedback?: string },
): string => {
  switch (scenario.kind) {
    case "mulligan":
      return buildMulliganPrompt(
        scenario.player,
        scenario.card,
        options?.feedback,
      );
    case "skill":
      return buildSkillPrompt(
        scenario.player,
        scenario.game,
        scenario.skills,
        scenario.contextNote,
        options?.feedback,
      );
    case "stone":
      return buildStonePrompt(
        scenario.player,
        scenario.game,
        scenario.contextNote,
        scenario.analysis,
        options?.feedback,
      );
    case "card_targeting":
      return buildTargetPrompt(
        scenario.player,
        scenario.request,
        scenario.game,
        options?.feedback,
      );
    case "counter_window":
      return buildCounterPrompt(
        scenario.player,
        scenario.game,
        scenario.pendingCard,
        scenario.availableCounters,
        options?.feedback,
      );
    default:
      return "";
  }
};

const buildMulliganPrompt = (
  player: Player,
  card: RawCard | null,
  feedback?: string,
): string => {
  const data = {
    scenario: "mulligan",
    player: describePlayer(player),
    card: card ? simplifyCard(card) : null,
  };
  return [
    "决定是否要在调度阶段替换唯一手牌。",
    '返回 JSON: {"action":"mulligan","replace":true|false}',
    "规则速览:",
    RULES_TEXT,
    feedback ? `上一次决策失败原因：${feedback}` : undefined,
    PROMPT_ONLY_JSON_NOTICE,
    "当前数据:",
    JSON.stringify(data, null, 2),
  ]
    .filter(Boolean)
    .join("\n");
};

const buildSkillPrompt = (
  player: Player,
  game: GameStatus,
  skills: Array<{ handIndex: number; card: RawCard }>,
  note?: string,
  feedback?: string,
): string => {
  const boardMatrix = serializeBoardMatrix(game.board);
  const boardAscii = formatBoardAscii(boardMatrix);
  const timelineNarrative = serializeTimelineNarrative(game.timeline);
  const statuses = serializeStatuses(game.statuses);
  const characters = serializeCharacters(game.characters);
  const graveyards = serializeGraveyards(game.graveyards);
  const handSize = (game.hands[player] ?? []).length;
  const skillsSummary = skills.map(({ handIndex, card }) => formatSkillPromptLine(handIndex, card));
  return [
    "棋盘快照 (0 空, 1 黑, 2 白):",
    boardAscii,
    timelineNarrative ? `最近棋谱: ${timelineNarrative}` : undefined,
    `可发动技能 (${skillsSummary.length} 张，handIndex 对应手牌位置):`,
    skillsSummary.length ? skillsSummary.join("\n") : "(当前无可发动技能)",
    `白方手牌数量：${handSize}`,
    statuses.freeze.some((val: number) => val > 0) || statuses.skip.some((val: number) => val > 0)
      ? `状态提示：冻结 ${statuses.freeze.join('/')}，跳过 ${statuses.skip.join('/')}`
      : undefined,
    characters.white ? `白方角色：${characters.white}` : undefined,
    characters.black ? `黑方角色：${characters.black}` : undefined,
    graveyards.black.length || graveyards.white.length
      ? `墓地概览：黑方 ${graveyards.black.length} 张，白方 ${graveyards.white.length} 张`
      : undefined,
    "规则速览:",
    RULES_TEXT,
    "策略提示:",
    STRATEGY_TEXT,
    "技能决策提示:",
    SKILL_HINT_TEXT,
    feedback ? `上一次行动执行失败：${feedback}` : undefined,
    note ? `局面提示：${note}` : undefined,
    "你是白方 (2)，请优先判断哪些技能可以立即改善局面；若技能不足胜任，可返回落子或暂不行动。",
    PROMPT_ONLY_JSON_NOTICE,
  ]
    .filter(Boolean)
    .join("\n");
};

const buildStonePrompt = (
  player: Player,
  game: GameStatus,
  note?: string,
  analysis?: string,
  feedback?: string,
): string => {
  const boardMatrix = serializeBoardMatrix(game.board);
  const boardAscii = formatBoardAscii(boardMatrix);
  const timelineNarrative = serializeTimelineNarrative(game.timeline);
  const statuses = serializeStatuses(game.statuses);
  const characters = serializeCharacters(game.characters);
  const graveyards = serializeGraveyards(game.graveyards);
  return [
    "棋盘快照 (0 空, 1 黑, 2 白):",
    boardAscii,
    timelineNarrative ? `最近棋谱: ${timelineNarrative}` : undefined,
    statuses.freeze.some((val: number) => val > 0) || statuses.skip.some((val: number) => val > 0)
      ? `状态提示：冻结 ${statuses.freeze.join('/')}，跳过 ${statuses.skip.join('/')}`
      : undefined,
    characters.white ? `白方角色：${characters.white}` : undefined,
    characters.black ? `黑方角色：${characters.black}` : undefined,
    graveyards.black.length || graveyards.white.length
      ? `墓地概览：黑方 ${graveyards.black.length} 张，白方 ${graveyards.white.length} 张`
      : undefined,
    "基本规则：棋盘 15×15，连成五子即胜，黑先白后。",
    "策略提示:",
    STRATEGY_TEXT,
    analysis ? `局面分析:\n${analysis}` : undefined,
    feedback ? `上一次行动执行失败：${feedback}` : undefined,
    note ? `局面提示：${note}` : undefined,
    "你是白方 (2)，当前目标仅是选择落子位置，可优先阻挡黑方威胁或制造胜势。",
    '返回 JSON：{"action":"place_stone","row":目标行,"col":目标列}。必须选择一个合法空位，不允许返回 pass；如无法提供坐标，可回退为完整棋盘数组。',
    PROMPT_ONLY_JSON_NOTICE,
  ]
    .filter(Boolean)
    .join("\n");
};

const buildTargetPrompt = (
  player: Player,
  request: TargetRequest,
  game: GameStatus,
  feedback?: string,
): string => {
  const boardMatrix = serializeBoardMatrix(game.board);
  const boardAscii = formatBoardAscii(boardMatrix);
  const data = {
    scenario: "card_targeting",
    player: describePlayer(player),
    request,
    boardAscii,
  };
  const instruction =
    request.type === "snapshot"
      ? '返回 JSON: {"action":"select_snapshot","id":"选项 id"}'
      : '返回 JSON: {"action":"select_cell","row":number,"col":number}';
  return [
    "选择技能或反击所需的目标。",
    instruction,
    "规则速览:",
    RULES_TEXT,
    "技能决策提示:",
    SKILL_HINT_TEXT,
    feedback ? `上一次选择无效：${feedback}` : undefined,
    PROMPT_ONLY_JSON_NOTICE,
    "当前数据:",
    JSON.stringify(data),
  ]
    .filter(Boolean)
    .join("\n");
};

const buildCounterPrompt = (
  player: Player,
  game: GameStatus,
  pendingCard: GameStatus["pendingAction"],
  available: Array<{ handIndex: number; card: RawCard }>,
  feedback?: string,
): string => {
  const boardMatrix = serializeBoardMatrix(game.board);
  const boardAscii = formatBoardAscii(boardMatrix);
  const data = {
    scenario: "counter_window",
    player: describePlayer(player),
    pendingCard: pendingCard ? simplifyPending(pendingCard) : null,
    availableCounters: available.map((item) => ({
      handIndex: item.handIndex,
      ...simplifyCard(item.card),
    })),
    handSize: (game.hands[player] ?? []).length,
    boardAscii,
  };
  return [
    "决定是否使用反击卡。",
    '返回 JSON: {"action":"counter","useCounter":true|false,"cardId"?:"可选手牌id"}',
    "规则速览:",
    RULES_TEXT,
    "技能决策提示:",
    SKILL_HINT_TEXT,
    feedback ? `上一次反击失败：${feedback}` : undefined,
    PROMPT_ONLY_JSON_NOTICE,
    "当前数据:",
    JSON.stringify(data),
  ]
    .filter(Boolean)
    .join("\n");
};

const formatSkillPromptLine = (handIndex: number, card: RawCard): string => {
  const segments: string[] = [];
  segments.push(`#${handIndex} ${card.nameZh}`);
  if (card.effect) segments.push(card.effect.trim());
  if (card.triggerCondition) segments.push(`触发：${card.triggerCondition}`);
  if (card.timing) segments.push(`时机：${card.timing}`);
  return segments.join(" — ");
};

const simplifyCard = (card: RawCard) => ({
  tid: card._tid ?? card.tid ?? null,
  nameZh: card.nameZh,
  nameEn: card.nameEn,
  type: card.type,
  timing: card.timing,
  effectId: card.effectId,
  effect: card.effect,
  tags: card.tags,
  counteredBy: card.counteredBy,
});

const simplifyPending = (pending: GameStatus["pendingAction"]) => {
  if (!pending) return null;
  return {
    player: describePlayer(pending.player),
    effectId: pending.effectId,
    selection: pending.selection,
    status: pending.status,
    card: simplifyCard(pending.card),
  };
};

const simplifyCounterWindow = (
  window: GameStatus["counterWindow"],
): Record<string, unknown> => ({
  responder: describePlayer(window.responder),
  expiresAt: window.expiresAt,
  startedAt: window.startedAt,
});

const serializeBoardMatrix = (board: GameStatus["board"]) => {
  const matrix: number[][] = [];
  for (let r = 0; r < board.size; r++) {
    const row: number[] = [];
    for (let c = 0; c < board.size; c++) {
      const value = board.get(r, c);
      if (value === PlayerEnum.BLACK) row.push(1);
      else if (value === PlayerEnum.WHITE) row.push(2);
      else row.push(0);
    }
    matrix.push(row);
  }
  return matrix;
};

const serializeStatuses = (statuses: GameStatus["statuses"]) => ({
  freeze: statuses.freeze,
  skip: statuses.skip,
  fusionLock: statuses.fusionLock,
});

const serializeCharacters = (characters: GameStatus["characters"]) => ({
  black: characters[PlayerEnum.BLACK]?.name ?? null,
  white: characters[PlayerEnum.WHITE]?.name ?? null,
});

const describePlayer = (player: Player) =>
  player === PlayerEnum.BLACK ? "BLACK" : "WHITE";

const serializeGraveyards = (graveyards: GameStatus["graveyards"]) => ({
  black: graveyards[PlayerEnum.BLACK].map((entry) => ({
    cardTid: entry.cardTid,
    reason: entry.reason,
    turn: entry.turn,
  })),
  white: graveyards[PlayerEnum.WHITE].map((entry) => ({
    cardTid: entry.cardTid,
    reason: entry.reason,
    turn: entry.turn,
  })),
});

const normaliseBoardMatrix = (matrix: any): number[][] | null => {
  if (typeof matrix === "string") {
    const lines = matrix
      .trim()
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    return convertBoardLines(lines);
  }
  if (Array.isArray(matrix) && matrix.every((row) => typeof row === "string")) {
    return convertBoardLines(matrix as string[]);
  }
  if (!Array.isArray(matrix)) return null;
  const rows: number[][] = [];
  for (const row of matrix) {
    if (!Array.isArray(row)) return null;
    const normalisedRow: number[] = [];
    for (const cell of row) {
      const value = Number(cell);
      if (!Number.isFinite(value)) return null;
      if (value !== 0 && value !== 1 && value !== 2) return null;
      normalisedRow.push(value);
    }
    rows.push(normalisedRow);
  }
  return rows;
};

const convertBoardLines = (lines: string[]): number[][] | null => {
  if (!lines.length) return null;
  const width = lines[0].length;
  if (width === 0) return null;
  const rows: number[][] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.length !== width) return null;
    const values: number[] = [];
    for (const ch of line) {
      const value = Number(ch);
      if (!Number.isFinite(value) || ![0, 1, 2].includes(value)) {
        return null;
      }
      values.push(value);
    }
    rows.push(values);
  }
  return rows;
};

const serializeRecentTimeline = (
  timeline: GameStatus["timeline"],
  limit = 10,
) => {
  const meaningful = timeline
    .filter((entry) => typeof entry.turn === "number" && entry.turn > 0)
    .slice(-limit);
  return meaningful.map((entry) => ({
    turn: entry.turn,
    player:
      entry.player === null ? "NONE" : describePlayer(entry.player as Player),
    move:
      entry.move && typeof entry.move.row === "number"
        ? { row: entry.move.row, col: entry.move.col }
        : null,
  }));
};

const formatBoardAscii = (matrix: number[][]) =>
  matrix.map((row) => row.join("")).join("\n");

const serializeTimelineNarrative = (
  timeline: GameStatus["timeline"],
  limit = 5,
): string | null => {
  const meaningful = timeline
    .filter((entry) => typeof entry.turn === "number" && entry.turn > 0)
    .slice(-limit);
  if (!meaningful.length) return null;
  const sentences = meaningful.map((entry) => {
    const prefix = `第${entry.turn}手`;
    const actor = entry.player === null ? "未知" : describePlayer(entry.player as Player);
    if (entry.move && typeof entry.move.row === "number") {
      return `${prefix}：${actor} 落子 (${entry.move.row}, ${entry.move.col})。`;
    }
    return `${prefix}：${actor} 通过技能或状态改变局面。`;
  });
  return sentences.join(" ");
};
