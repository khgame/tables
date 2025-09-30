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
  --input, -i   输入目录，默认 "."
  --output, -o  输出目录，默认 "."
  --format, -f  输出格式，json | js | ts | ts-interface
  --strict      启用严格模式（tid 冲突抛错）
```

示例：

```bash
tables -i ./example/game_01_minirpg -o ./artifacts -f ts-interface
```

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
