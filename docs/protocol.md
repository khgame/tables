# 数据协议（Protocol）

为统一跨平台消费格式，引入了可选的协议头定义（不破坏现有输出）。

- 协议常量：`TABLES_PROTOCOL_NAME = 'khgame.tables'`、`TABLES_PROTOCOL_VERSION = 1`
- 类型定义：`src/core/protocol.ts`

示例（`jsonxSerializer` 产物结构）：
```json
{
  "protocol": { "name": "khgame.tables", "version": 1 },
  "source": { "fileName": "Example", "sheetName": "__data" },
  "convert": {
    "tids": ["001"],
    "result": { "001": { "...": "..." } },
    "collisions": []
  }
}
```

注意：
- 现有 `json/js/ts/ts-interface` 序列化器保持兼容，不增加协议头。
- 若要使用协议头，请使用 `jsonxSerializer` 或自定义序列化器。

