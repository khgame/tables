# tool_01_tileset_slicer

一个纯前端的图像切片工具，用来把素材图（例如 tile set / sprite sheet）按照固定网格拆分，生成可供 tables 或 Excel 表格引用的切片配置。

## 使用方式

1. （推荐）执行 `npm run tool:tileset`，会在本地开启一个静态服务器并自动打开页面；也可以直接双击 `index.html`（预编译的 `dist/` 中已包含 JS）。需要修改源码时，请在 `src/` 下编辑 TypeScript 并运行 `npx tsc -p example/tool_01_tileset_slicer` 重新生成。
2. 上传一张待处理的素材图，或在“候选 tileset”区域选择已内置的示例（来自 `game_06_abyssal_nightfall`）。
3. 设置 tile 宽高、边距 (margin) 和间隔 (spacing)，自定义 ID 前缀与起始索引。
4. 工具会自动绘制栅格预览，列出全部切片，并显示坐标；可直接点击预览画布或右侧列表切换选中 tile，鼠标悬停亦会同步高亮。选中后，在“属性”面板设置 tile 类型、分组、渲染层、通行/标签等元信息。
5. “拓扑标注”面板支持两类标注：
   - **道路类**：切换方向按钮设置四/八向联通，默认输出为道路 bitmask。
   - **区域类**：填写中心、四向边缘及四角地形标识，可用于 Terrain/Wang 颜色定义。
6. 拓扑标注面板内提供额外 Tab：
   - **画板**：以当前选中的 tile 在自定义网格上绘制示例地图（左键绘制、右键清除），可导出 JSON 作为额外参考数据。
   - **导入配置**：加载之前导出的切片 JSON 或画板 JSON，快速恢复联通标注与画板布局。
7. 通过按钮可以：
   - **导出 JSON**：包含 meta 信息与全部切片坐标。
   - **导出 CSV**：`id,x,y,width,height,row,col` 格式，可方便贴到 Excel。
   - **复制 JSON**：复制到剪贴板。
   - **导出画板 JSON**：输出当前画板格子所使用的 tile id。

导出的 JSON 结构示例：

```json
{
  "meta": {
    "source": "blob:https://example",
    "width": 512,
    "height": 512,
    "tileWidth": 64,
    "tileHeight": 64,
    "margin": 0,
    "spacing": 0,
    "count": 64,
    "schemaVersion": 2
  },
  "tiles": [
    {
      "id": "tile_0",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "row": 0,
      "col": 0,
      "role": "road",
      "groupId": "stone_path",
      "meta": {
        "passable": true,
        "passableFor": ["player", "vehicle"],
        "layer": "ground",
        "tags": ["stone", "dry"]
      },
      "road": {
        "connections": { "n": true, "e": true, "s": false, "w": false },
        "diagonals": { "ne": false, "se": false, "sw": false, "nw": false }
      }
    }
  ]
}
```

画板导出的 JSON 结构：

```json
{
  "cols": 8,
  "rows": 8,
  "tileWidth": 64,
  "tileHeight": 64,
  "cells": [
    ["tile_0", null, "tile_5"],
    [null, "tile_3", "tile_3"],
    ["tile_4", "tile_4", null]
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
