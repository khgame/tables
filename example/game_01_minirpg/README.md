# game_01_minirpg

一个最小化的单机 RPG 示例，展示如何用 @khgame/tables 维护英雄、技能、装备、关卡与全局配置，并演示多段 `@` 组合成 8 位 TID。

## 目录说明

- `heroes.xlsx`：通过 `@ / @ / @` 组合生成英雄 ID，保留数值面板与 `tid` 型跨表引用。
- `skills.xlsx`：`@ / @ / @` 对应“类别 + 技能编号 + 等级”，并记录目标类型、能量消耗等字段。
- `items.xlsx`：子类 + 序号组合成 ID，附带成本、属性加成与来源关卡。
- `stages.xlsx`：关卡类别 / 线路 / 序号组成 ID，字段涵盖环境、奖励、首通技能等。
- `global_config.xlsx`：组合 ID + `any` 值列，集中维护版本号、开关、默认关卡等全局参数。
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
 # 将目录下全部 xlsx 导出为 JSON
npx tables -i ./example/game_01_minirpg -o ./example/game_01_minirpg/out -f json
```

## ID 规划

- 英雄：`10SSSNNN`，S 表示子分类，N 表示序号（如 `10000001`）。
- 技能：`20SSSLLL`，`SSS` 为技能编号，`LLL` 为等级（如 `20001002` 表示技能 001 的 2 级）。
- 装备 / 道具：`30TTTNNN`，T 表示道具子类，N 表示序号。
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
