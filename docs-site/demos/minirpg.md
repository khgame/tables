# Mini RPG 示范

> 位置：`example/game_01_minirpg`

- **涵盖表格**：`heroes`、`skills`、`items`、`enemies`、`stages`、`global_config`
- **展示要点**：跨表引用、角色成长、战斗模拟、枚举上下文注入
- **序列化产物**：`*.json`、`*.ts`、`*Interface.ts`、web demo (`out/index.html`)

[立即体验 Demo](/examples/minirpg/index.html){.vp-doc-button .primary target="_blank" rel="noopener"}

## 快速生成

```bash
npm run ex:minirpg
```

生成目录：`example/game_01_minirpg/out`

## 表格示例

- `heroes.xlsx`：基础属性、成长系数、解锁条件
- `skills.xlsx`：技能冷却、类型、伤害计算参数
- `stages.xlsx`：关卡敌人组、奖励掉落、战斗脚本

## 交互体验

Mini RPG demo 使用 React + Tailwind 渲染，直接消费导表产物并提供：

- 阵容选择、技能释放、战斗日志
- 根据导出 `global_config` 进行平衡参数调整
- 可视化属性、装备与技能组合

源码可在仓库中查看，适合作为「配置 → 游戏玩法」的整合示例。
