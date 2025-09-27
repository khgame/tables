# 英雄进阶（hero_advance）

此示例基于仓库内 `example/hero_advance.xlsx`。

## 目标
- 按英雄 `tid` 聚合每一阶的消耗与成长字段
- 产出 `TS 接口 + 数据常量` 供游戏逻辑直接引用

## Excel 表头（示意）
```
A: @        B: uint         C: string           D: { to:uint, dependency:[uint] }    E: { cost:{gold:uint, mat:uint} }
A: tid      B: level        C: name             D: upgrade                         E: consume
1001        1               Warrior             {to:1002,dependency:[]}           {cost:{gold:100,mat:1}}
1001        2               Warrior             {to:1003,dependency:[2001]}       {cost:{gold:200,mat:3}}
```

- `@`：TID 段（本例仅 A 列）
- 嵌套对象：升级目标、依赖、消耗

## 导出命令
```bash
# 生成 TS 接口与数据
npm run build
node lib/exec.js -i ./example/hero_advance.xlsx -o ./docs/generated -f ts --silent
```
生成文件：`docs/generated/HeroAdvance.ts`

## 代码引用（示意）
```ts
import { IHeroAdvance, heroAdvance } from './generated/HeroAdvance'

function getNext(tid: string): string | undefined {
  const row = heroAdvance[tid]
  return row?.upgrade?.to
}
```

## 注意
- 可通过上下文定义枚举（如职业、阵营），详见 [序列化器与上下文](../serializers.md)
