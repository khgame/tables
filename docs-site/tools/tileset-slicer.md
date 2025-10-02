# Tileset 切片工具

> 位置：`example/tool_01_tileset_slicer`

一个纯前端的素材切片小工具，用来把规则网格的 tileset / spritesheet 拆分成 tables 可以直接消费的 JSON、CSV 与画板文件。适合在落地 Excel 之前先完成素材标注、道路拓扑或快速排版验证。

## 快速开始

1. 安装依赖后运行：
   ```bash
   npm run tool:tileset
   ```
   会在本地启动静态服务器并自动打开页面，也可以直接双击 `example/tool_01_tileset_slicer/index.html`。
2. 上传任意素材图，或在左上角选择预置的 `Nightfall Tileset` 示例。
3. 在 “网格参数” 调整 tile 宽/高、边距、间距，预览区会即时刷新切片边界。
4. 在 “元属性” 区域为每个切片配置类型（道路/区域/装饰）、分组、渲染层、通行限制与标签。
5. 根据角色自动展示的拓扑面板做进一步标注：
   - **道路连通**：16 个预设按钮一键覆盖四向组合；同时支持导出稀疏的 `connections` / `diagonals` 字符串编码。
   - **区域标注**：填写中心、四边、四角对应的素材 id，方便在游戏中组装地形过渡。
6. 切换到 “绘图” 页签使用画板刷子快速排版：
   - `画笔` 自由涂抹路径；
   - `连线` 按住拖动自动补全直线；
   - `矩形` 选区填充；
   - `擦除` 快速清空；
   状态栏会提示作用范围/格数，支持指针事件与触屏操作。
7. 顶部按钮可导出 / 复制 JSON、导出 CSV、保存画板 JSON；同一页面也提供导入入口，便于反复迭代。

## 导出结构

切片 JSON 采用压缩后的 `schemaVersion = 3`：只写入非默认的元属性，道路拓扑以字符串表示四向/对角连通。

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
      "road": { "connections": "nes" }
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

画板 JSON 与旧版兼容：

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
  ]
}
```

> `connections` 字符串的顺序与 `CARDINAL_DIRECTIONS` 一致（`n/e/s/w`），`diagonals` 对应 `ne/se/sw/nw`。空字符串表示无连通，字段缺省则默认全断开。

## 与 tables 协同

- 切片 JSON 可直接导入 Excel 的配置表，也可以在自定义导表流程中读取；`groups` 字段列举所有分组便于生成下拉选项或素材库。
- 画板 JSON 可以作为关卡草图或美术参考，表头字段与 `buildBoardExport` 输出保持一致。
- 当导入的 JSON 携带可访问的 `meta.source` 时，工具会尝试自动补载原图，便于复现历史标注。

## 小贴士

- 目前仅支持规则网格（uniform tiles），不支持自由拖拽切片。
- “复制 JSON” 依赖浏览器剪贴板权限，如失败请使用导出按钮保存文件。
- 可在 `example/tool_01_tileset_slicer/samples/` 中添加自定义素材，并在 `src/ui.ts` 的 `PRESET_TILES` 常量注册。
- 画板刷子默认使用当前网格的 `tileWidth` × `tileHeight`，调整网格后画板会保持同步。
- JSON/CSV 通过 `npm run build` 更新后也会被 docs-site 使用，方便在文档中展示最新结构。

欢迎在仓库 issue 中反馈更多需求或者提 PR 扩展新的工具。
