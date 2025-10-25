export const PROMPT_ONLY_JSON_NOTICE =
  "务必仅返回最终 JSON 对象，不要附带解释、纠正说明或多余文本。";

export const BOARD_RESPONSE_INSTRUCTIONS = [
  '{"action":"place_stone","board":[[0,0,...15列],...共15行]}',
  '{"action":"place_stone","row":x,"col":y}',
  "board 字段推荐使用长度为 15 的二维数组（数组内为 0/1/2），仅新增一枚白子；如无法输出数组，可改用 row/col 坐标或 15 行字符串形式，我们会自动解析。",
];

export const RULES_OVERVIEW = (params: {
  INITIAL_HAND_SIZE: number;
  DRAW_INTERVAL: number;
  SKILL_UNLOCK_MOVE: number;
}) =>
  [
    "棋盘为 15×15，只要任意颜色连成五子即获胜。",
    "黑方先手，白方（你）后手并代表 AI。",
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
