<script setup>
import { withBase } from 'vitepress'

const demoUrl = withBase('/examples/minirpg/index.html')
</script>

# Mini RPG 示范

> 位置：`example/game_01_minirpg`

- **涵盖表格**：`heroes`、`skills`、`items`、`enemies`、`stages`、`global_config`
- **展示要点**：跨表引用、角色成长、战斗模拟、枚举上下文注入
- **序列化产物**：`*.json`、`*.ts`（类型 + Repo 定义）、`*Solution.ts`（数据 + 默认实例）、web demo (`out/index.html`)

<a class="vp-doc-button primary" :href="demoUrl" target="_blank" rel="noopener">
  立即体验 Demo
</a>

## 快速生成

```bash
npm run ex:minirpg
```

生成目录：`example/game_01_minirpg/out`

## 表格示例

- `heroes.csv`：基础属性、成长系数、解锁条件
- `skills.csv`：技能冷却、类型、伤害计算参数
- `stages.csv`：关卡敌人组、奖励掉落、战斗脚本
- `relics.csv`：提供 `alias` 列（Relic Key），生成 `RelicsProtocol` 常量与 `RelicsRepo` 仓库（`relicsSolution.ts` 中包含默认实例，`getByKey` 可强类型访问）。

## 交互体验

Mini RPG demo 使用 React + Tailwind 渲染，直接消费导表产物并提供：

- 阵容选择、技能释放、战斗日志
- 根据导出 `global_config` 进行平衡参数调整
- 可视化属性、装备与技能组合

源码可在仓库中查看，适合作为「配置 → 游戏玩法」的整合示例。
