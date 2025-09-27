# Mini RPG 全量样例

`example/game_01_minirpg/` 目录提供一个最小化的单机 RPG 数值配置：

- 多张 Excel：英雄、技能、物品、关卡与全局配置按真实项目拆分，并通过多段 `@` 组合形成 8 位 TID。
- 枚举上下文：`context.meta.json` + `context.enums.json` 会在导出时生成 `context.ts`，供 TS 输出引用（职业 / 元素 / 环境 / 货币 / 全局值类型等）。
- 序列化脚本：`serialize.js` 会一次性生成 JSON/TS/TS-Interface 三种格式以及上下文。

## 如何体验

```bash
npm run build
node example/game_01_minirpg/serialize.js
```

运行后可在 `example/game_01_minirpg/out/` 看到序列化产物（已通过 `.gitignore` 排除）。也可以通过 CLI：

```bash
npx tables -i ./example/game_01_minirpg -o ./example/game_01_minirpg/out -f json
```

## 表结构概要

| 表格 | 说明 | 关键字段 |
| --- | --- | --- |
| heroes.xlsx | `@/@/@` 组合成英雄 ID，保留数值面板与 `tid` 型跨表引用 | `id`, `signatureItem`, `primarySkill`, `unlockStage` |
| skills.xlsx | `@/@/@` 表达“技能类别 + 技能编号 + 等级”，并记录目标类型、能量消耗 | `id`, `code`, `level`, `target`, `unlockStage` |
| items.xlsx | 子类 + 序号组成 ID，附带成本、属性加成与来源关卡 | `id`, `currency`, `amount`, `sourceStage` |
| stages.xlsx | 关卡类别 / 线路 / 序号组合 ID，包含环境、奖励、首通技能 | `id`, `rewardItem*`, `unlockHero`, `firstClearSkill` |
| global_config.xlsx | 组合 ID + `any` 值列，集中维护版本、开关、默认关卡等 | `id`, `key`, `valueType`, `value` |

## ID 规划

- 英雄：`10SSSNNN`（S=子分类，N=序号）
- 技能：`20SSSLLL`（`SSS`=技能编号，`LLL`=等级，例如 `20001002`）
- 物品：`30TTTNNN`（T=道具子类，N=序号）
- 关卡：`40RRRNNN`（R=线路，N=序号）
- 全局配置：`90SSSNNN`（S=配置段落，N=流水号）

## 枚举定义

`context.enums.json` 中维护了：

- `HeroClass` / `HeroElement` / `HeroRole`
- `StageSubtype` / `StageEnvironment`
- `SkillTarget`
- `RewardCurrency`
- `ItemSlot`
- `GlobalValueType`

运行 `serialize.js` 后会在 `context.ts` 中生成对应的 TypeScript 枚举，TS 输出可直接引用 `TableContext.*`。
