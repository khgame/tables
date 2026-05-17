# tool_01_tileset_slicer

一个纯前端的图像切片工具，用来把素材图（例如 tile set / sprite sheet）按照固定网格拆分，生成可供 tables 或 Excel 表格引用的切片配置。

## 使用方式

1. （推荐）执行 `npm run tool:tileset`，会在本地开启一个静态服务器并自动打开页面；也可以直接双击 `index.html`（预编译的 `dist/` 中已包含 JS）。需要修改源码时，请在 `src/` 下编辑 TypeScript 并运行 `npx tsc -p example/tool_01_tileset_slicer` 重新生成。
2. 上传一张待处理的素材图，或在“候选 tileset”区域选择已内置的示例（来自 `game_06_abyssal_nightfall`）。顶部菜单栏集中提供素材加载、标注数据与绘图数据的导入/导出按钮。
3. 在“数据标注”主 Tab 的“网格参数”卡片中调整 tile 宽高、边距与间距，预览画布会实时刷新切片。
4. 切换列表或直接点击预览画布可选中切片；在“元属性”卡片中设置类型、分组、渲染层、通行与标签等信息。
5. “拓扑标注”卡片提供道路/区域两个子 Tab：道路可标记四/八向连通，区域可填写中心、边缘、角落地形；导入配置入口也位于此处。
6. “基于当前标注数据绘图”主 Tab 提供画板与 Brush/事件工具，可根据标注数据搭建示例地图：
   - `草地铺设`：所选 tile 自由涂抹；
   - `道路连线`：拖动自动补全直线铺设；
   - `矩形铺设`：拖拽形成矩形区域；
   - `方块笔刷`：以当前格为中心的 3×3 快速填充；
   - `区域填充`：一键洪水填充同类区域；
   - `擦除`：快速清空路径；
   - 右侧 `事件点` 按钮可放置/移除出生点、触发器、掉落点，支持导出到画板 JSON。
7. 顶部按钮可导出/复制 JSON、导出 CSV、保存画板数据，亦可加载已有的标注或画板 JSON。

导出的 JSON 结构示例：

```json
{
  "meta": {
    "source": "./samples/nightfall_tileset.png",
    "width": 512,
    "height": 512,
    "tileWidth": 64,
    "tileHeight": 64,
    "margin": 0,
    "spacing": 0,
    "count": 64,
    "schemaVersion": 3
  },
  "tiles": [
    {
      "id": "tile_12",
      "x": 128,
      "y": 64,
      "width": 64,
      "height": 64,
      "row": 1,
      "col": 2,
      "role": "road",
      "groupId": "stone_path",
      "road": { "connections": "ne" }
    },
    {
      "id": "tile_13",
      "x": 192,
      "y": 64,
      "width": 64,
      "height": 64,
      "row": 1,
      "col": 3,
      "role": "area",
      "meta": { "tags": ["grass"] },
      "area": {
        "center": "grass_center",
        "edges": { "n": "grass_edge_n", "s": "grass_edge_s" }
      }
    }
  ],
  "groups": ["stone_path", "grass"]
}
```

画板导出的 JSON 结构：

```json
{
  "cols": 12,
  "rows": 8,
  "tileWidth": 64,
  "tileHeight": 64,
  "cells": [
    ["stone_border_nw", "stone_border_n", "stone_border_ne"],
    ["stone_path_w", "stone_path_center", "stone_path_e"],
    [null, "road_intersection", null]
  ],
  "events": [
    { "row": 1, "col": 1, "type": "spawn" },
    { "row": 2, "col": 2, "type": "loot" }
  ]
}
```

可以将 JSON/CSV/画板数据拷贝到 tables 的 Excel 表，或者在自定义管线中引用；导出的切片 JSON 也可以通过“导入配置”页签重新载入（若 `meta.source` 可访问，会尝试自动加载原始图片）。导出的 `groups` 字段记录了所有分组 ID，可用于在游戏端建立地形/部件库。

## 注意事项

- 目前仅支持等间距的规则网格（uniform tiles）。
- 复制 JSON 需要浏览器允许剪贴板访问。
- 生成的 `meta.source` 为临时 Blob URL，主要用于调试；最终引用时建议替换为真实素材路径。
- 候选列表读取 `samples/` 目录下的素材，可根据需要新增文件并在 `script.js` 中注册。
- 联通标注导出时会写入道路 `road.connections/diagonals` 与区域 `area.center/edges/corners`，可直接同步到 Excel 或 Terrain/Wang Set。
- 画板功能使用当前画布的 tile 尺寸（即 `tileWidth` × `tileHeight`）绘制简易布局，仅用于快速验证切片组合。
- `autoguessTileSize()` 会尝试匹配常见尺寸（8/16/32/48/64/96/128 等），若无法整除则保留当前输入值。
- 导入切片 JSON 时会校验素材尺寸是否一致；如未提前载入素材且 `meta.source` 指向有效路径，工具会尝试自动加载原图。
- 导入画板 JSON 会在当前画板尺寸基础上恢复布局，若某些 tile id 无法匹配，会自动清除并提示数量。
- “属性”面板中的通行、层级、标签会原样写入 `meta` 字段，可在游戏解析阶段自定义含义。
