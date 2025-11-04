# 本地 AI 技能释放逻辑（概述）

本文档说明白方（AI）在本地策略下的技能释放规则与优先级。若配置了云端大模型，则以云端决策为主，失败/超时会回退到本地策略。

## 总体流程
- 推理入口：`ai/scenarios.ts` 依据当前 `gameState` 派生场景（stone/skill/card_targeting/counter_window）。
- 大模型分支：如配置了 endpoint/model，则调用 `openAiClient.requestAiDecision`；否则走本地分支。
- 本地分支：
  - 落子（stone）：由 `ai/local/engine.ts` 做局面评估与位置建议；
  - 技能（skill）：由 `ai/fallbacks.ts` 应急策略决定是否/何时释放；
  - 反击（counter_window）：根据可用反击牌与场景做安全选择；
  - 目标选择（card_targeting）：按候选区/快照选首项。

## 技能（skill）规则（本地）
以下规则在 `ai/fallbacks.ts` 中实现，作为无云端/云端失败时的本地应急逻辑：

0. 本地 AI 禁用“时光倒流”
   - 不会主动释放 `time-rewind`（即使没有危险形），避免引入复杂回溯副作用；当所有可发动技能仅剩时光倒流时，转为落子。

1. 对手手牌很多（默认≥3），不轻易释放“力拔山兮”，除非局面无解
   - 判断“无解”标准：
     `core/analysis.analyzeBoardForPlayer(board, BLACK)` 的 `winMoves.length > 0`，即黑方有直接制胜的一手。
   - 若无解，则优先避免“力拔山兮”（`effectId === remove-to-shichahai` 或卡名包含“力拔山兮”），改用其他技能；
   - 若有无解威胁，则允许启用强力技能（力拔山兮）。

2. 对手手牌为空（=0）时，积极使用主动技能，优先“力拔山兮”
   - 先在可发动技能中查找“力拔山兮”（同上匹配），如可用则优先；
   - 否则按默认次序挑选第一张可发动技能。

3. 抽牌时优先“解牌”（若手中没有“解 力拔山兮”的牌）
   - 力拔山兮的解牌：擒拿（`effectId === counter-prevent-removal`）。
   - 触发入口：`core/gameEngine.triggerCardDraft` 中 AI 选牌逻辑 `chooseOptionForAI`；
   - 如白方手牌中缺少 `counter-prevent-removal`，则在抽牌选项中优先选择带有该效果的卡牌。

> 注：如果业务中“力拔山兮”的内部效果 id/名称不同，请在 `ai/fallbacks.ts` 中更新匹配函数。

## 动画与时序
- 释放技能后（含反击）会触发视觉事件，并在 UI 中播放动画；
- 动画期间 `useAIActions` 会暂停调度，玩家点击落子也会被禁用；
- 动画结束后再继续后续落子/反击，避免信息不可见（视觉清晰度优先）。

## 云端 Prompt（可选）
- 配置了云端模型时，可以在设置面板加入“自定义白方策略指令”，例如：
  - “对手手牌≥3时谨慎使用力拔山兮；手牌为0时优先主动技能；如缺解牌则在抽牌时优先选择擒拿类解牌。”
- 该指令会作为 `system` 消息附加到云端大模型请求中，与默认系统提示共同生效。

## 代码位置
- 场景派生：`src/ai/scenarios.ts`
- 本地技能策略（fallback）：`src/ai/fallbacks.ts`
- 本地落子评估：`src/ai/local/engine.ts`
- 选牌偏好（抽牌时）：`src/core/gameEngine.ts` 中 `chooseOptionForAI`
- 动画/视觉队列：`src/app/hooks/useVisualEffects.ts`、`src/components/SkillEffectLayer.tsx`
- 调度暂停（动画期间）：`src/ai/useAIActions.ts`
