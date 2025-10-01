# tables – Excel 导表到 json/js/ts/ts-interface

让策划继续用 Excel，工程侧获得稳定、可读、类型安全的产物。

- 一键输出：`json | js | ts | ts-interface`
- 插件流水线：`rows/erows/mark/desc/schema/convert/...`
- 强类型：基于 `@khgame/schema` 解析类型标记，自动生成 TS 接口
- 稳定产物：结果 key 排序，利于 Git diff 与发布

快速开始：见 [快速上手](getting-started.md) · [CLI](cli.md) · [API](api.md) · [概念与约定](concepts.md) · [最佳实践](best-practices.md)

实战示例：
- [英雄进阶（hero_advance）](examples/hero-advance.md)
- [任务系统（missionTask）](examples/mission-task.md)
- [物品与背包（items）](examples/items.md)
- [掉落与关卡奖励（drop-table）](examples/drop-table.md)
- [商店与经济（shop）](examples/shop.md)
- [多语言（localization）](examples/localization.md)

高级话题：
- [插件与扩展点](plugins.md)
- [序列化器与上下文（枚举）](serializers.md)
- [发布到 GitHub Pages](how-to-publish.md)
