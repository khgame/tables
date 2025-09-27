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

## 上下文（Context）与枚举

- `loadContext(dir)` 会将 `dir` 下符合 `context.*.json` 的文件聚合为上下文对象
- `serializeContext(dirOut, serializers, context)` 会生成 `context.ts`（供 TS 序列化器引用），并可输出枚举
- 在 `context.meta.exports.enum = [ 'enums', ... ]` 中声明要导出的枚举集合名

```js
const { loadContext, serializeContext, tsSerializer } = require('@khgame/tables')
const ctx = loadContext('example')
serializeContext('out', [tsSerializer], ctx) // 生成 out/context.ts
```

## 一键批量导出（Out-of-Box）

- `exportTablesToTs(dirIn, dirOut)`：扫描目录所有 xlsx，生成聚合 `index.ts`、各自的 TS、`context.ts`

```js
const { exportTablesToTs } = require('@khgame/tables')
exportTablesToTs('./example', './out')
```
