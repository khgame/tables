# tool_01_tileset_slicer

一个纯前端的图像切片工具，用来把素材图（例如 tile set / sprite sheet）按照固定网格拆分，生成可供 tables 或 Excel 表格引用的切片配置。

## 使用方式

1. 打开 `index.html`（直接在浏览器中打开即可）。
2. 上传一张待处理的素材图。
3. 设置 tile 宽高、边距 (margin) 和间隔 (spacing)，自定义 ID 前缀与起始索引。
4. 工具会自动绘制栅格预览，列出全部切片，并显示坐标。
5. 通过按钮可以：
   - **导出 JSON**：包含 meta 信息与全部切片坐标。
   - **导出 CSV**：`id,x,y,width,height,row,col` 格式，可方便贴到 Excel。
   - **复制 JSON**：复制到剪贴板。

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
