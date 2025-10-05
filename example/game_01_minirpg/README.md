# game_01_minirpg

一个最小化的单机 RPG 示例，展示如何用 @khgame/tables 维护英雄、技能、装备、关卡与全局配置，并演示多段 `@` 组合成 8 位 TID。

## 目录说明

- `heroes.csv`：通过 `@ / @ / @` 组合生成英雄 ID，保留数值面板、跨表 `tid` 与人物肖像 URL。
- `skills.csv`：`@ / @ / @` 对应“类别 + 技能编号 + 等级”，并记录目标类型、能量消耗等字段。
- `items.csv`：子类 + 序号组合成 ID，附带成本、属性加成与来源关卡。
- `enemies.csv`：敌人类别 / 子类 / 序号组合成 ID，并记录生命、攻击、防御、弱点、经验奖励与肖像。
- `relics.csv`：新增 `alias` 列（`Relic Key`），为遗物生成可读别名及 `RelicsProtocol` 常量，方便在代码中通过别名访问对应配置。
- `stages.csv`：关卡类别 / 线路 / 序号组成 ID，字段涵盖环境、奖励、首通技能、`bossEnemy`（指向敌人表）、关卡背景图与前置关卡。
- `global_config.csv`：组合 ID + `any` 值列，集中维护版本号、开关、默认关卡等全局参数。
- `context.meta.json` / `context.enums.json`：定义并导出枚举，供 TS 输出引用。

## 快速体验

```bash
# 生成 lib/ 后运行示例脚本（输出文件位于 example/game_01_minirpg/out/）
npm run build
node example/game_01_minirpg/serialize.js
```

生成内容包括：

- `*.json`：稳定排序后的 JSON 数据。
- `*.ts`：同时包含接口定义与数据对象。
- `*Interface.ts`：仅导出接口声明，方便在项目中复用。
- `context.ts`：由 `context.*.json` 自动生成的枚举汇总。

你也可以直接使用 CLI：

```bash
 # 将目录下全部 csv 导出为 JSON
npx tables -i ./example/game_01_minirpg -o ./example/game_01_minirpg/out -f json
```

## 别名访问示例

alias 列会自动生成以下几个产物：

- `out/relics.ts`/`out/relicsInterface.ts` 中的 `RelicsProtocol` 常量数组与类型别名。
- `getRelicsByProtocol(alias)`：通过别名直接获取配置对象。
- `convert.aliases.key` 与索引 `convert.indexes.key`，用于按需查表。

在 TS 中可以这样使用：

```ts
import { RelicsProtocol, getRelicsByProtocol } from './out/relics'

const relic = getRelicsByProtocol('everburningEmber' as RelicsProtocol)
console.log(relic.desc)
```

运行 `node example/game_01_minirpg/serialize.js` 后即可查看上述导出的常量与函数。

随后直接打开 `example/game_01_minirpg/out/index.html`，即可看到由 React + Tailwind 搭建的紧凑文字界面：同屏查看剧情日志、切换英雄、推进关卡并触发简化的回合制战斗，所有内容均来自 tables 输出的 JSON 产物。

## ID 规划

- 英雄：`10SSSNNN`，S 表示子分类，N 表示序号（如 `10000001`）。
- 技能：`20SSSLLL`，`SSS` 为技能编号，`LLL` 为等级（如 `20001002` 表示技能 001 的 2 级）。
- 装备 / 道具：`30TTTNNN`，T 表示道具子类，N 表示序号。
- 敌人：`50SSSNNN`，S 表示敌人子类，N 表示序号。
- 关卡：`40RRRNNN`，R 表示线路，N 表示序号。
- 全局配置：`90SSSNNN`，S 表示配置段落，N 表示流水号。

表格中的 `tid` 字段会引用上述 ID，串起跨表依赖。

## 枚举上下文

`context.enums.json` 定义了常见枚举，运行脚本后会生成 `context.ts` 供 TS 输出引用：

- `HeroClass` / `HeroElement` / `HeroRole`
- `SkillTarget`
- `StageSubtype` / `StageEnvironment`
- `RewardCurrency`
- `ItemSlot`
- `GlobalValueType`
