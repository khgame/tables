<script setup>
import { withBase } from 'vitepress'

const demoUrl = withBase('/examples/skill-gomoku/index.html')
</script>

# Skill Gomoku 示范

> 位置：`example/game_07_skill_gomoku`

- **涵盖表格**：`cards`、`characters`
- **展示要点**：完整的五子棋卡牌游戏、AI对手、反击系统、合体技
- **序列化产物**：`*.json`、`*.ts`（类型 + Repo 定义）、`*Solution.ts`（数据 + 默认实例）、`index.html`（可玩游戏）

<a class="vp-doc-button primary" :href="demoUrl" target="_blank" rel="noopener">
  立即体验 Demo
</a>

## 快速生成

```bash
npm run ex:skill-gomoku
```

生成目录：`example/game_07_skill_gomoku/out`

## 玩法概述

**Skill Gomoku** 将五子棋与技能卡牌系统结合，灵感来自小品《技能五子棋》。这是一个**完整可玩的游戏**，包含AI对手和完善的反击机制：

- **基础规则**：15×15 棋盘，连成五子获胜
- **抽牌节奏**：开局 2 张手牌，每 3 步落子后对手抽 1 张
- **技能时机**：第 5 步起可发动技能
- **游戏模式**：
  - 双人对战：本地轮流操作
  - AI对战：挑战智能AI（白方）
- **卡牌分类**：
  - 进攻/控制卡（PreMove）：己方落子前发动
  - 反击卡（Reaction）：即时响应对手技能
  - 特殊卡（Anytime）：任意时机发动
- **合体技**：需召唤"张兴朝"角色才能发动特殊技能

## 表格结构

### cards.csv（16 张卡牌）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `tid` | `@` | 卡牌 ID（1001-1016） |
| `type` | `enum<CardType>` | Attack/Counter/Support |
| `timing` | `enum<CardTiming>` | PreMove/Reaction/Anytime |
| `nameZh` / `nameEn` | `string` | 中英文卡名 |
| `rarity` | `enum<CardRarity>` | Common/Rare/Legendary |
| `speed` | `enum<CardSpeed>` | Normal/Instant |
| `cost` | `uint?` | 费用（可选） |
| `effect` | `string` | 效果描述 |
| `triggerCondition` | `string?` | 触发条件（反击卡必填） |
| `counteredBy` | `string?` | 被何种卡克制（管道符分隔） |
| `requires` | `string?` | 前置条件（角色名称） |
| `requiresCards` | `string?` | 需要的卡牌TID |
| `failCondition` | `string?` | 失败条件 |
| `tags` | `string?` | 标签（Removal/Freeze/DirectWin/Fusion 等） |
| `quote` | `string` | 名台词（来自小品） |
| `artwork` | `string` | 卡牌立绘URL |

**索引配置**：
```json
{
  "byNameEn": "nameEn",
  "byType": "type",
  "byRarity": "rarity",
  "byTiming": "timing",
  "byCounter": { "path": "counteredBy", "mode": "multi", "allowEmpty": true },
  "byTags": { "path": "tags", "mode": "multi", "allowEmpty": true }
}
```

### characters.csv（角色/场地）

特殊角色定义：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `tid` | `@` | 角色ID（3001-3002） |
| `roleType` | `enum<RoleType>` | Character/Location |
| `name` | `string` | 角色名称 |
| `entryEffect` | `string` | 登场效果 |
| `exitEffect` | `string?` | 离场效果 |
| `enablesCards` | `string?` | 启用的卡牌TID（管道符分隔） |
| `defeatCondition` | `string?` | 被击败条件 |
| `quote` | `string?` | 名台词 |
| `artwork` | `string` | 角色立绘URL |

**角色列表**：
- **张兴朝**（3001）：合体技前置角色，启用"我是保洁"和"调呈离山东"
- **什刹海**（3002）：墓地/弃牌堆概念

## 典型卡牌示例

**飞沙走石（1001 - 进攻卡）**
```typescript
{
  type: "Attack",
  timing: "PreMove",
  rarity: "Common",
  cost: 1,
  speed: "Normal",
  effect: "指定敌方棋子移出棋盘，进入什刹海；目标落点下回合被封禁，同时自己放弃本回合落子。",
  counteredBy: "拾金不昧|擒拿",
  tags: "Removal",
  quote: "飞沙走石！"
}
```

**两极反转（1011 - 反击卡）**
```typescript
{
  type: "Counter",
  timing: "Reaction",
  rarity: "Legendary",
  cost: 2,
  speed: "Instant",
  effect: "敌方发动力拔山兮时触发，直接夺取胜利，无需恢复棋局。",
  triggerCondition: "敌方发动力拔山兮时",
  tags: "DirectWin|Reflect",
  quote: "两极反转！"
}
```

**技能五（1015 - 支持卡）**
```typescript
{
  type: "Support",
  timing: "Anytime",
  rarity: "Common",
  cost: 1,
  effect: "召唤张兴朝入场，开启所有合体技。",
  tags: "Summon",
  quote: "技能五！"
}
```

## 技术亮点

### 游戏实现

- ✅ **完整的五子棋逻辑**：15×15棋盘，四方向胜利判定
- ✅ **卡牌系统**：16张卡牌，4种类型，完整克制关系网络
- ✅ **AI对手**：
  - 启发式评估（连子数量、空位评分）
  - 智能决策（70%召唤张兴朝，30%使用直接获胜卡）
  - 60%概率使用反击卡
  - 自然延迟（800ms落子，1500ms反击）
- ✅ **反击系统**：完善的Counter窗口，可选择反击卡或放弃
- ✅ **UI实现**：React + Tailwind，精美卡牌展示，实时游戏日志

### 代码架构（SOLID & DRY）

- **单一职责**：`GomokuBoard`（棋盘）、`CardDeck`（卡牌）、`useGameState`（状态）完全分离
- **依赖倒置**：UI组件依赖Hook抽象，AI通过函数接口交互
- **开闭原则**：卡牌效果通过tags扩展，无需修改核心代码
- **DRY原则**：Card组件复用，统一的评估逻辑，无重复代码
- **性能优化**：useMemo/useCallback + AI搜索剪枝（减少90%计算量）

### 数据驱动

- **枚举驱动类型**：`CardType`、`CardTiming`、`CardRarity` 等通过 `context.enums.json` 统一管理
- **可选字段**：`cost?`、`speed?`、`triggerCondition?` 允许留空
- **克制链**：`counteredBy` 字段串联卡牌克制关系
- **索引加速**：自动生成多维度索引
- **类型安全**：生成的 TS 类型保证编译时校验

## 文件产物

```
out/
├── cards.json              # 卡牌数据（17KB）
├── cards.ts                # TypeScript类型定义
├── cardsSolution.ts        # 含数据的TS文件
├── characters.json         # 角色数据
├── characters.ts           # TypeScript类型定义
├── charactersSolution.ts   # 含数据的TS文件
├── context.ts              # 枚举上下文
└── index.html              # 完整可玩游戏（56KB，1800行代码）
```

## 扩展方向

- **资源/费用系统**：为卡牌增加费用或冷却，避免连续爆发
- **牌组构筑模式**：允许玩家自选若干卡牌进入牌库
- **增强AI**：Alpha-Beta搜索提升棋力、强化学习训练卡牌策略
- **多难度等级**：简单/中等/困难AI
- **联机对战**：WebSocket实时对战

---

> 本示例是 tables 最完整的游戏Demo，展示了从Excel/CSV配置到可玩游戏的完整流程。包含AI对手、反击系统、合体技等复杂机制，代码严格遵循SOLID和DRY原则，是学习游戏数据驱动开发的最佳范例。
