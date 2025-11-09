# API

## readAndTranslate(path, options?, context?)

- 读取 Excel 并按插件流水线处理，返回 `Table`
- `options.sheetName`：不传默认选 `__data` 或第一张 sheet
- `options.plugins`：按顺序执行的插件数组

```js
const { readAndTranslate, tableConvert } = require('@khgame/tables')
const table = readAndTranslate('example/example.xlsx', { plugins: [tableConvert] })
console.log(table.schema)   // 解析出的 schema AST
console.log(table.convert)  // { tids, result, collisions }
```

## serialize(pathIn, dirOut, serializers, context?)

- 读取单个 Excel，并用多个序列化器生成多个产物文件
- `serializers` 形如：`{ 'Example.json': jsonSerializer, 'Example.ts': tsSerializer }`

```js
const { serialize, jsonSerializer, tsSerializer } = require('@khgame/tables')
serialize('example/example.xlsx', 'out', {
  'Example.json': jsonSerializer,
  'Example.ts': tsSerializer
})
```

## inspectTableFile(pathIn, options?, context?)

- 读取单个 Excel/CSV 并返回机器可读诊断对象
- 诊断包含实际 sheet 名、mark/desc 信息、schema model、convert 计数、索引与 alias 计数与转换错误
- 适合调试表头、生成 AI 修复上下文，或在导出前做轻量检查

```js
const { inspectTableFile, loadContext } = require('@khgame/tables')
const ctx = loadContext('example')
const diagnostics = inspectTableFile('example/items.csv', {}, ctx)
console.log(diagnostics.convert.tidCount)
```

## validateTableFile(pathIn, options?, context?)

`validateTableFile` 是 `inspectTableFile` 之上的稳定校验摘要，适合 AI agent、CI 和编辑器集成直接调用：

- 返回 `{ success, fileName, sheetName?, diagnostics, errors, warnings }`
- `errors[]` / `warnings[]` 使用 `{ severity, code, message, location?, diagnosticPath?, details? }`
- 当前错误码包括 `schema_error`、`convert_error`、`tid_collision`、`inspect_error`
- 不写文件、不打印日志，方便测试和 AI agent 直接调用
- `diagnostics` 保留完整 `inspectTableFile` 结果，便于定位 sheet、mark/desc、schema 和 convert 信息

调用方式：

```js
const { validateTableFile, loadContext } = require('@khgame/tables')
const ctx = loadContext('example')
const report = validateTableFile('example/items.csv', {}, ctx)

if (!report.success) {
  console.error(JSON.stringify(report.errors, null, 2))
}
```

## 上下文（Context）与枚举

- `loadContext(dir)` 会将 `dir` 下符合 `context.*.json` 的文件聚合为上下文对象
- `serializeContext(dirOut, serializers, context)` 会生成 `context.ts`（供 TS 序列化器引用），并可输出枚举
- 在 `context.meta.exports.enum = [ 'enums', ... ]` 中声明要导出的枚举集合名

```js
const { loadContext, serializeContext, tsSerializer } = require('@khgame/tables')
const ctx = loadContext('example')
serializeContext('out', [tsSerializer], ctx) // 生成 out/context.ts
```

## 索引（Indexes）

- `context.indexes` / `context.meta.indexes` 可声明额外索引，按表名、驼峰名、接口名或 `*` 匹配
- 支持字符串路径、路径数组或对象配置，默认生成唯一键映射到 TID
- 结果写入 `table.convert.indexes`，并在 `table.convert.meta.indexes` 提供模式与冲突信息

```json
{
  "indexes": {
    "Example": [
      "Label",
      { "name": "skill", "path": "rule.skillId", "mode": "multi" }
    ]
  }
}
```

## 一键批量导出（Out-of-Box）

- `exportTablesToTs(dirIn, dirOut)`：扫描目录所有 xlsx，生成聚合 `index.ts`、各自的 TS、`context.ts`

```js
const { exportTablesToTs } = require('@khgame/tables')
exportTablesToTs('./example', './out')
```
