# Skill Gomoku（game_07）现状与计划

最后更新：2025-02-15

## 当前落实情况
- **docs-site Demo 404**  
  `scripts/build-site.js` 已将 `game_07_skill_gomoku` 纳入发布流程（scripts/build-site.js:30-46），`docs-site/demos/skill-gomoku.md` 也提供了链接，但 `.vitepress/config.ts` 的导航/侧边栏尚未注入对应入口（docs-site/.vitepress/config.ts:63-69），也没有验证 `npm run build:site` 的真实产物，因此线上仍会返回 404。
- **卡牌图像加载失败 → 基础 SVG 占位**  
  目前 `CardIllustration` 以程序化渐变替代外链图片（ui/src/components/index.tsx:97-181），卡背也只是一层渐变（ui/src/components/CardFrame.tsx:1-81）。虽然避免了加载失败，但与要求的“炉石风格插画＋标志性卡背”相差甚远，且未针对每张技能卡定制插画。
- **UI 重构未达 UIDESIGN**  
  `main.tsx` 已将布局收敛到单屏（ui/src/main.tsx:175-339）并引入 HUD/日志组件，`ZonePanel` 等也实现基础信息展示。然而：  
  - 棋盘仍是简易木纹渐变（ui/src/components/index.tsx:41-95），缺少三维质感、光影和特效。  
  - 墓地与什刹海面板依旧是文字列表（ui/src/components/index.tsx:503-566），不符合“图标 + 缩略卡”设计。  
  - 反击窗口、确认按钮、HUD 等仍偏线框风，未呈现面性、浮雕、粒子特效。  
  - 缺少参考图里的右侧对局记录栏装饰、顶部手牌背面堆叠、背景场景。
- **美术素材与技能特效缺失**  
  当前仅有 `public/skill-gomoku.svg` 简易 logo（ui/public/skill-gomoku.svg:1-12），没有背景插画、牌背纹理、墓地区/什刹海图标，也未实现 UIDESIGN 描述的飞沙走石、时光倒流等动画特效（skills 层只处理逻辑，未触发视觉效果）。
- **脚本语言**  
  UI 与游戏逻辑已迁移至 TypeScript，但导出脚本仍为 `serialize.js`（example/game_07_skill_gomoku/serialize.js:1-91）。若要满足“所有脚本使用 TS”，需评估改写并调整调用命令。

## 已完成的基础工作
- 代码已全面转为 TypeScript，核心流程、技能模块与 UI 组件拆分到 `core/`、`skills/`、`components/` 等目录。
- Vite 构建脚手架就绪，可通过 `npm run ex:skill-gomoku` 产出 `out/index.html`，或 `npm run ex:skill-gomoku:dev` 进入开发模式。
- AI 与流程逻辑已升级：AI 有启发式落子与技能反制框架，调度阶段默认对手不可见。

## 待办事项
1. **修复 docs-site Demo**
   - [x] 在 `docs-site/.vitepress/config.ts` 中补充 Skill Gomoku 的导航/侧边栏项，避免直接访问 404。
   - [x] 运行 `npm run ex:skill-gomoku && npm run docs:build`，确认 `dist` 内含 `demos/skill-gomoku/index.html` 与 `examples/skill-gomoku/index.html`。
   - [x] 若仍 404，排查 `withBase('/examples/skill-gomoku/index.html')` 的产出路径与静态资源部署路径差异。

2. **卡牌视觉升级**
   - [x] 根据 UIDESIGN 绘制 Hearthstone 风格卡面与卡背 SVG，区分进攻（橙）、反击（紫）、特殊（蓝）等色系。
   - [x] 按技能内容绘制主插画/图标，填充至 `CardIllustration` 或拆分为独立素材文件。
   - [x] 调整标签/徽章体系：合体技、稀有度、费用、时机图标与 UIDESIGN 提示一致。
   - [x] 替换背面卡组堆叠与顶部对手手牌背面样式，使其能量感统一。

3. **界面还原设计稿**
   - [x] 重画棋盘背景、光效与指示（含冻结/飞沙等状态特效，光环、粒子、格点高亮）。
   - [x] 以图形化组件重做墓地、什刹海、对局记录面板，并加入动画/图标。
   - [x] 实现对手 HUD、玩家 HUD、确认按钮、菜单等控件的最终排版与样式。
   - [ ] 还原调度阶段、墓地浏览等其他弹窗的版式与交互（调度面板仍待统一视觉语言）。

4. **美术与特效管线**
   - [x] 落地参考图中的核心背景、装饰元素（通过 CSS 绘制的场景与棋盘光效）。
   - [x] 为技能效果编写动画组件（粒子、滤镜、震屏等），并整合进 `skills/effects.ts` 流程或 UI 层状态。
   - [ ] 记录素材来源、命名规范与使用方式，补充至 `README.md` 或新增 `ASSETS.md`。

## 风险 / 依赖
- 需要投入较多美术绘制时间（SVG/位图），可能需联合设计同学。
- 多数动画依赖 Canvas/SVG/GSAP 等实现，需评估性能与工程复杂度。
- docs-site 的路径问题需结合部署环境验证，可能涉及 GitHub Pages `base` 配置。

## 下一步建议
1. 先修复 docs-site 导航与构建，确保 Demo 可访问。
2. 与设计确认 SVG 资产切图方案，搭建卡牌/背景基础组件。
3. 按 UIDESIGN 分阶段还原 UI（先布局、后特效、最后动画）。
4. 加入基础视觉回归测试（截图对比或 Storybook Snapshot），避免后续改动破坏美术布局。
