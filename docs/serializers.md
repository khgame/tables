# 序列化器与上下文

内置序列化器：
- `jsonSerializer`：输出 JSON
- `jsSerializer`：输出可 `require()` 的 JS（`module.exports = {...}`）
- `tsSerializer`：输出 TS 接口 + 数据常量 + `import * as TableContext from "./context";`
- `tsInterfaceSerializer`：仅输出 TS 接口
 - `jsonxSerializer`（实验性）：在 JSON 外层增加协议头与源信息（见 protocol）

排序稳定性：
- 所有序列化器都会按 key 对 `convert.result` 进行排序，保证产出稳定（便于 Git diff）

上下文（Context）：
- 将 `docs/example/context.*.json` 等聚合为上下文（通过 `loadContext(dir)`），供序列化器使用
- `ts*` 相关序列化器可通过 `serializeContext(dirOut, serializers, context)` 生成 `context.ts`（包含枚举）
- 在 `context.meta.exports.enum = ['enums']` 中声明要输出的枚举集合名；枚举定义形如：
```json
{
  "Colors": { "Red": 1, "Blue": 2 }
}
```

示例：
```js
const ctx = loadContext('./example')
serializeContext('./out', [tsSerializer, tsInterfaceSerializer], ctx)
serialize('./example/hero_advance.xlsx', './out', {
  'HeroAdvance.ts': tsSerializer,
  'HeroAdvance.interface.ts': tsInterfaceSerializer
}, ctx)
```

协议版 JSON（jsonx）：
```js
const { serialize, jsonxSerializer } = require('@khgame/tables')
serialize('example/example.xlsx', 'example/out', { 'Example.json': jsonxSerializer })
```
