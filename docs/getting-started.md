# 快速上手

## 安装

- 全局安装 CLI：
```bash
npm i -g @khgame/tables
```
- 或在本仓库构建后本地安装：
```bash
npm install
npm run local-install
```

## 目录约定

- Excel 推荐每本使用 `__data` 作为默认 sheet（也可通过 API 指定）
- 推荐将示例/资产放在 `example/`，测试脚本放在 `test/`

## 命令行（CLI）

将 `example/` 下所有 `.xlsx` 批量导出为 JSON 到 `example/out/`：
```bash
tables -i ./example -o ./example/out -f json
```
导出为 TS：
```bash
tables -i ./example -o ./example/out -f ts
```
只处理单个文件：
```bash
tables -i ./example/example.xlsx -o ./example/out -f js
```
严格模式（TID 冲突报错）：
```bash
tables -i ./example -o ./example/out -f json --strict
```
静默/详细日志：`--silent` / `--verbose`

更多见 [CLI](cli.md)。

## API

读取并按插件流水线转换：
```js
const { readAndTranslate, tableConvert } = require('@khgame/tables')
const table = readAndTranslate('path/to.xlsx', { plugins: [tableConvert] })
console.log(table.convert) // { tids, result, collisions }
```
批量序列化输出：
```js
const { serialize, jsonSerializer, tsSerializer, loadContext, serializeContext } = require('@khgame/tables')
const context = loadContext('./example')
serializeContext('./out', { 'x.ts': tsSerializer, 'x.json': jsonSerializer }, context)
serialize('./example/example.xlsx', './out', { 'example.ts': tsSerializer, 'example.json': jsonSerializer }, context)
```
更多见 [API](api.md)。

## Excel 表头规则（极简）

- 第 1 行：类型标记行（使用 `@` 标识 TID 段；支持 string/float/int/uint/bool/any、联合 `A|B`、可选 `?`、嵌套 `[]`/`{}`、装饰器 `$strict/$ghost`）
- 第 2 行：字段描述行（输出键名/注释）
- 第 3 行起：数据行

详见 [概念与约定](concepts.md) 和 [最佳实践](best-practices.md)。
