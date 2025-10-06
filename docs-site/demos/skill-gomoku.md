<script setup>
import { withBase } from 'vitepress'

const demoUrl = withBase('/examples/skill-gomoku/index.html')
</script>

# Skill Gomoku 示范

> 位置：`example/game_07_skill_gomoku`

- **涵盖表格**：`cards`、`combos`、`characters`、`states`、`glossary`
- **展示要点**：卡牌系统、克制关系、合体技、状态管理与术语表
- **序列化产物**：`*.json`、`*.ts`（类型 + Repo 定义）、`*Solution.ts`（数据 + 默认实例）

<a class="vp-doc-button primary" :href="demoUrl" target="_blank" rel="noopener">
  立即体验 Demo
</a>

## 快速生成

```bash
npm run ex:skill-gomoku
```

生成目录：`example/game_07_skill_gomoku/out`

## 玩法概述

**Skill Gomoku** 将五子棋与技能卡牌系统结合，灵感来自小品《技能五子棋》：

- **基础规则**：15×15 棋盘，连成五子获胜
- **抽牌节奏**：开局 2 张手牌，每 3 步落子后对手抽 1 张
- **技能时机**：第 5 步起可发动技能
- **卡牌分类**：
  - 进攻/控制卡：己方落子前发动
  - 反击卡：即时响应对手技能
  - 特殊卡：任意时机发动
- **合体技**：需"张兴朝"角色在场才能发动特殊技能

## 表格结构

### cards.csv（16 张卡牌）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `tid` | `@` | 卡牌 ID（1001-1016） |
| `type` | `enum<CardType>` | Attack/Control/Counter/Support |
| `timing` | `enum<CardTiming>` | PreMove/Reaction/Anytime |
| `nameZh` / `nameEn` | `string` | 中英文卡名 |
| `rarity` | `enum<CardRarity>` | Common/Rare/Epic/Legendary |
| `cost` / `cooldown` | `uint?` | 费用与冷却回合数 |
| `effect` | `string` | 效果描述 |
| `triggerCondition` | `string?` | 触发条件（反击卡必填） |
| `counteredBy` | `string?` | 被何种卡克制（管道符分隔） |
| `requires` | `string?` | 前置条件（角色/状态） |
| `tags` | `string?` | 标签（Removal/Freeze/DirectWin 等） |

**索引配置**：
```json
{
  "byNameEn": "nameEn",
  "byType": { "path": "type", "mode": "multi" },
  "byTiming": { "path": "timing", "mode": "multi" }
}
```

### combos.csv（合体技/连锁）

定义卡牌组合效果：
- `requiresCards`：所需卡牌 ID（管道符分隔）
- `effectSummary`：组合效果描述
- `failCondition`：失败条件

### characters.csv（角色/场地）

特殊角色定义：
- **张兴朝**：合体技前置角色
- **什刹海**：墓地/弃牌堆概念

### states.csv（状态效果）

持续效果与 Buff/Debuff：
- `category`：Board（棋盘级） / Piece（棋子级）
- `duration`：持续回合数
- `removalCard`：移除状态的卡牌

### glossary.csv（术语表）

游戏机制关键术语与定义。

## 典型卡牌示例

**飞沙走石（1001 - 进攻卡）**
```typescript
{
  type: "attack",
  timing: "pre-move",
  rarity: "common",
  cost: 1,
  effect: "指定敌方一枚棋子，将其送入什刹海",
  counteredBy: "拾金不昧|擒拿",
  tags: "Removal"
}
```

**两极反转（1011 - 反击卡）**
```typescript
{
  type: "counter",
  timing: "reaction",
  rarity: "legendary",
  cost: 2,
  effect: "敌方发动力拔山兮时触发，改为我方直接获胜",
  triggerCondition: "敌方宣告力拔山兮时",
  tags: "DirectWin|Reflect"
}
```

## 技术亮点

- **枚举驱动类型**：`CardType`、`CardTiming`、`CardRarity` 等通过 `context.enums.json` 统一管理
- **可选字段**：`cost?`、`cooldown?`、`triggerCondition?` 允许留空
- **克制链**：`counteredBy` 字段串联卡牌克制关系
- **索引加速**：自动生成 `byNameEn`、`byType`、`byTiming` 等索引
- **类型安全**：生成的 TS 类型保证编译时校验

## 扩展方向

- **资源系统**：为卡牌增加费用或冷却，避免连续爆发
- **牌组构筑**：允许玩家自选若干卡牌进入牌库
- **AI 对战**：基于克制关系实现自动出牌逻辑
- **事件重放**：记录对局过程，支持时光倒流功能

---

> 本示例展示了 tables 在卡牌游戏场景的完整应用，配置表的结构化设计支持复杂的技能交互、克制关系和条件触发逻辑。
