export const PROMPT_ONLY_JSON_NOTICE =
  "务必仅返回最终 JSON 对象，不要附带解释、纠正说明或多余文本。";

export const BOARD_RESPONSE_INSTRUCTIONS = [
  '{"action":"place_stone","board":"<15 lines of 0/1/2>"}',
  "board 字段为 15 行字符串（每行 15 个字符），使用 0 表示空位、1 表示黑子、2 表示白子，并且仅新增一枚白子。",
];

export const RULES_OVERVIEW = (params: {
  INITIAL_HAND_SIZE: number;
  DRAW_INTERVAL: number;
  SKILL_UNLOCK_MOVE: number;
}) =>
  [
    "棋盘为 15×15，只要任意颜色连成五子即获胜。",
    "黑方先手，白方（你）后手并代表 AI。",
    `开局每人只有 ${params.INITIAL_HAND_SIZE} 张手牌，可选择进行一次调度（mulligan）。`,
    `每累计 ${params.DRAW_INTERVAL} 次落子，会为另一位玩家抽一张牌。`,
    `第 ${params.SKILL_UNLOCK_MOVE} 步之后才能发动技能卡（合体技需满足角色等前置条件）。`,
    "冻结或跳过状态会阻止该玩家落子或发动非反击技能，反击卡在反击窗口内仍可使用。",
    "技能与反击的触发条件、克制关系、失败原因均会在数据中列出，请据此决策。",
  ].join("\n");

export const GOMOKU_STRATEGY_HINTS = [
  "始终沿着取胜优先级决策：先实现己方成五 > 阻止对手成五 > 构建活四/活三/双三。",
  "对白方而言 (值为 2)，若存在立即落子即可获胜的位置，立刻选择该点。",
  "若黑方存在形成四连或双三的威胁，必须优先在相邻点落子阻断。",
  "落子应当贴近当前棋形（与已有棋子曼哈顿距离≤2），避免远离局势的孤立点。",
  "除非技能能明显改善局势（阻止必败、创造胜势、满足前置条件），否则优先选择合理的落子。",
].join("\n");

export const SKILL_DECISION_HINTS = [
  "发动技能前请确认前置角色/目标存在，并评估效果是否优于落子。",
  "反击窗口内，如无法满足技能条件，应果断放弃反击以避免无效操作。",
  "技能描述中的失败条件会导致浪费回合，请确保避免触发（例如被擒拿、拾金不昧等克制）。",
].join("\n");
