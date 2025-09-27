# 商店与经济（shop）

展示“物品定价 + 限购 + 货币种类”的配置方式。

## Excel 表头（示意）
```
A: @        B: string    C: { price:uint, currency: enum(Currency) }   D: { daily:uint?, weekly:uint? }
A: tid      B: name      C: cost                                      D: limit
3001        体力药水      {price:50,currency:COIN}                     {daily:5}
3002        高级召唤券    {price:1,currency:GEM}                       {weekly:1}
```

- `enum(Currency)` 由上下文提供：
```json
{ "Currency": { "COIN": 1, "GEM": 2 } }
```
- `limit` 中的 `?` 表示可选（每日或每周限购其一或都无）

## 导出
```bash
npm run build
node lib/exec.js -i ./example/shop.xlsx -o ./docs/generated -f ts --silent
```

## 消费示例
```ts
import { IShop, shop } from '../generated/Shop'

function canBuy(tid: string, dailyBought: number, weeklyBought: number) {
  const row = shop[tid]
  const d = row.limit?.daily ?? Infinity
  const w = row.limit?.weekly ?? Infinity
  return dailyBought < d && weeklyBought < w
}
```
