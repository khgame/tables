<script setup>
import { withBase } from 'vitepress'

const demoUrl = withBase('/examples/click-cookies/index.html')
</script>

# Click Cookies 示范

> 位置：`example/game_02_click_cookies`

- **涵盖表格**：`producers`、`upgrades`、`achievements`、`artifacts`、`global_config`
- **展示要点**：增量产能计算、自动化队列、成就解锁与多层货币系统
- **序列化产物**：`*.json`、`*.ts`、`*Interface.ts`、web demo (`out/index.html`)

<a class="vp-doc-button primary" :href="demoUrl" target="_blank" rel="noopener">
  立即体验 Demo
</a>

## 快速生成

```bash
npm run ex:click-cookies
```

生成目录：`example/game_02_click_cookies/out`

## 特性亮点

- 动态曲线：`global_config.xlsx` 指定生产速率、价格浮动与货币兑换
- 升级树：多层级升级互斥/叠加，通过 `$oneof`、`Pair`、`Map` 等标记构造
- 成就系统：利用上下文枚举描述条件类型，序列化时自动扩展枚举定义

## UI 一览

Demo 页面提供实时点击体验，展示：

- 实时资源统计、产能与消耗速率
- 升级面板与条件判定
- 成就弹窗与多阶段节奏推进

非常适合展示导表如何驱动放置/增量玩法。
