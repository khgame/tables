# 快速开始

`tables` 提供完整的 Excel → 游戏产物流水线：

1. 读取并抽象 Excel，为下游插件提供统一的 `Table` 结构。
2. 解析标记行，推导 Schema、生成描述信息。
3. 根据策略转换数据、生成 `tid` 映射以及冲突报告。
4. 通过序列化器输出 JSON / JS / TS / TS-Interface 等多种格式。

## 安装

```bash
npm i -g @khgame/tables
# 或
npm install && npm run local-install
```

## CLI 用法

```bash
Usage: tables [-i INPUT_DIR] [-o OUTPUT_DIR] [-f FORMAT]

Options:
  --input, -i   输入目录（默认为当前目录）
  --output, -o  输出目录（默认为当前目录）
  --format, -f  输出格式，json | js | ts | ts-interface | jsonx | go | csharp
  --strict      启用严格模式（TID 冲突立即抛错）
  --silent      静默模式，仅输出错误
  --verbose     详细模式，打印插件执行详情
```

示例：

```bash
tables -i ./example/game_01_minirpg -o ./artifacts -f ts-interface
```

更多常用命令：

- 批量导出 JSON：
  ```bash
  tables -i ./example -o ./example/out -f json
  ```
- 导出 TS：
  ```bash
  tables -i ./example -o ./example/out -f ts
  ```
- 单文件处理：
  ```bash
  tables -i ./example/example.xlsx -o ./example/out -f js
  ```
- 严格模式（检测 TID 冲突）：
  ```bash
  tables -i ./example -o ./example/out -f json --strict
  ```

## 目录建议

- Excel 推荐将主数据放在 `__data` sheet（若需多 sheet，可在 API 中显式指定 `sheetName`）。
- 示例、静态 Demo 统一放在 `example/`，便于 `npm run ex:*` 一键体验。
- 测试脚本放在 `test/`，配合 Jest 回归。
- 自定义上下文（枚举、常量、策略）集中在 `context.*.json`，并通过 `serializeContext` 产出。

## API 入口

```ts
import {
  readAndTranslate,
  serialize,
  serializeContext,
  tableConvert,
  tableSchema
} from '@khgame/tables'
```

- `readAndTranslate(filepath, { plugins }, context)`：单表读取与插件执行。
- `serialize(excelPath, outputDir, serializerMap, context)`：按映射执行多种序列化输出。
- `serializeContext(rootDir, serializerList, context)`：根据上下文批量输出全局定义（如枚举）。

更多细节请阅读下方章节。

## Excel 表头速览

- 第 1 行：类型标记行（含 `@` 主键片段）。
- 第 2 行：字段描述行（字段名 / 注释）。
- 第 3 行起：数据行。

常见语法：

| 标记 | 说明 |
| --- | --- |
| `@` | 拼接 TID 片段 |
| `string` / `int` / `float` / `bool` / `tid` | 基础类型 |
| `Array<T>` 或 `[...]` | 动态数组 |
| `{ ... }` | 对象字面量，字段名取自描述行 |
| `enum(Name)` | 引用上下文枚举 `context.enums.Name` |
| `$ghost { ... }` | 当字段整体为空时跳过导出，并在类型上附加 `| undefined` |
| `$strict [ ... ]` | 数组长度必须与声明一致 |

更多语法与装饰器说明见 [概念与约定](/guide/concepts) 与 [最佳实践](/guide/best-practices)。
