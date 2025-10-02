# tool_01_tileset_slicer

一个纯前端的图像切片工具，用来把素材图（例如 tile set / sprite sheet）按照固定网格拆分，生成可供 tables 或 Excel 表格引用的切片配置。

## 使用方式

1. （推荐）执行 `npm run tool:tileset`，会在本地开启一个静态服务器并自动打开页面；也可以直接双击 `index.html`。
2. 上传一张待处理的素材图，或在“候选 tileset”区域选择已内置的示例（来自 `game_06_abyssal_nightfall`）。
3. 设置 tile 宽高、边距 (margin) 和间隔 (spacing)，自定义 ID 前缀与起始索引。
4. 工具会自动绘制栅格预览，列出全部切片，并显示坐标。选中某个 tile 后，可在“联通标注”区域勾选八方向可连边信息。
5. 使用下方画板，以当前选中的 tile 在自定义网格上绘制示例地图，可导出 JSON 作为额外参考数据。
6. 通过按钮可以：
   - **导出 JSON**：包含 meta 信息与全部切片坐标。
   - **导出 CSV**：`id,x,y,width,height,row,col` 格式，可方便贴到 Excel。
   - **复制 JSON**：复制到剪贴板。
   - **导出画板 JSON**：输出当前画板格子所使用的 tile id。

导出的 JSON 结构示例：

```json
{
  "meta": {
    "source": "blob:https://…",
    "width": 512,
    "height": 512,
    "tileWidth": 64,
    "tileHeight": 64,
    "margin": 0,
    "spacing": 0,
    "count": 64
  },
  "tiles": [
    { "id": "tile_0", "x": 0, "y": 0, "width": 64, "height": 64, "row": 0, "col": 0 },
    { "id": "tile_1", "x": 64, "y": 0, "width": 64, "height": 64, "row": 0, "col": 1 },
    …
  ]
}
```

可以将 JSON/CSV 中的数据拷贝到 tables 的 Excel 表，或者在自定义管线中引用。

## 注意事项

- 目前仅支持等间距的规则网格（uniform tiles）。
- 复制 JSON 需要浏览器允许剪贴板访问。
- 生成的 `meta.source` 为临时 Blob URL，主要用于调试；最终引用时建议替换为真实素材路径。
- 候选列表读取 `samples/` 目录下的素材，可根据需要新增文件并在 `script.js` 中注册。
- 联通标注导出时会写入 `connections`（方向数组）与 `connectivity`（布尔对象），可直接同步到 Excel。
- 画板功能使用当前画布的 tile 尺寸（即 `tileWidth` × `tileHeight`）绘制简易布局，仅用于快速验证切片组合。
