# 物品与背包（items）

本页提供一个完整的“物品配置”示例，展示如何用类型标记描述嵌套结构、ID、枚举与可选字段。

## Excel 表头（可直接照抄）
```
A: @          B: string      C: enum(Rarity)        D: { maxStack:uint, tradable:bool }   E: $ghost { sell:uint }
A: tid        B: name        C: rarity              D: rule                                 E: shop
10001         Short Sword    RARE                   {maxStack:1,tradable:true}             {sell:100}
10002         HP Potion      COMMON                 {maxStack:99,tradable:false}           {sell:5}
10003         Quest Item     COMMON                 {maxStack:1,tradable:false}            
```
说明：
- `@`：物品 ID
- `enum(Rarity)`：使用上下文提供的枚举（见下）
- `$ghost { ... }`：当内部字段都为空时，整体视为不存在（TS 类型会带 `|undefined`）

## 上下文：枚举定义（Rarity）
在你的上下文目录（例如 `example/`）添加 `context.enums.json`：
```json
{
  "Rarity": {
    "COMMON": 1,
    "RARE": 2,
    "EPIC": 3,
    "LEGENDARY": 4
  }
}
```
并在 `context.meta.json` 中声明导出：
```json
{ "meta": { "exports": { "enum": ["enums"] } } }
```

## 导出命令
```bash
# 生成 TS 接口与上下文枚举
npm run build
node lib/exec.js -i ./docs/examples/excel/items.xlsx -o ./docs/generated -f ts --silent || true
```
提示：你也可以把上述表直接放到 `example/`，并运行：
```bash
node lib/exec.js -i ./example -o ./docs/generated -f ts --silent
```

## TS 引用（示意）
```ts
import { IItems, items } from '../generated/Items'
import * as TableContext from '../generated/context'

function isLegendary(tid: string) {
  return items[tid]?.rarity === TableContext.Rarity.LEGENDARY
}
```
