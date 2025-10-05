# tables

轻量级跨平台 Excel/CSV 导表工具 ( `Excel/CSV` ==> `json`/`js`/`ts`/`ts-interface` )

## 在线体验

- GitHub Pages: https://khgame.github.io/tables/
- 站点包含各示例（Mini RPG / Click Cookies / A Dark Room）的静态 Demo，可直接打开 `examples/<name>/index.html` 体验导表结果。
- 文档站点（`docs-site/`）及 `README` 会同步发布，方便快速查阅概念约定与插件说明。

## 功能

- 支持将 Excel/CSV 转换为 json/js/ts/ts-interface 等多种序列化格式，可按需扩展新的目标
- 提供 `jsonx`（实验性）协议导出：在 JSON 外包裹协议头与来源信息，便于客户端校验版本
- 原生支持结构化数据、枚举、`$ghost`/`$strict` 等装饰器，类型由表头标记驱动并在导出时强校验
- 携带插件系统，具有高可扩展性，可组合出不同的导表流水线
- 丰富的官方插件覆盖 ID 规划、表结构描述、索引、数据验证等多类场景

## 基础用法

### 安装

直接从 npm 安装

`npm i -g @khgame/tables`

或者从源码安装

1. clone 项目到本地
2. `npm install && npm run local-install`

### CLI

```bash
Usage: tables [-i INPUT_DIR] [-o OUTPUT_DIR] [-f FORMAT]

Options:
  --input, -i   the input directory                               [default: "."]
  --output, -o  the output directory                              [default: "."]
  --format, -f  export format (defaults to "json").
                 Available values are resolved from the serializer registry at
                 runtime (json, js, ts, ts-interface, jsonx, go, csharp by default).
  -h, --help    Show help                                              [boolean]
  --version     Show version number                                    [boolean]
```

默认会扫描输入目录下的 .xls/.xlsx/.csv 表格文件，可直接与 Excel 模板共用标注约定。

### API

- Out-of-box API : `readAndTranslate(filepath [,option])`
    > 这种用法下, 只会读出这个文件中的一张 sheet, sheet 名规则如下  
    > - 如果在 option 中填写了 sheetName 字段, 则读出该指定的 sheet  
    > - 如果没有指定, 读出名字为 `__data` 的 sheet
    > - 如果没有该 sheet, 则读出表内第一张 sheet
- 读出 SheetJS (`xlsx`) 原始结构: `workbook = readWorkBook(filePath)`
    > 包含所有的 sheet, 具体数据结构请参照 [SheetJS 文档](https://docs.sheetjs.com/)
- 将已经读出的 `workbook` 解析成 table: `translateWorkBook(workbook, sheetName)`
    > sheet 选择规则同 readAndTranslate

### Example

```js
const { readAndTranslate } = require('@khgame/tables')
let table = readAndTranslate(`${__dirname}/excel/your_awesome_excel.xlsx`)
```

推荐将产物集中到示例目录下：
```bash
tables -i ./example -o ./example/out -f json --silent
```

如果需要扩展导出格式，可参考 [`docs-site/reference/serializer-registry.md`](./docs-site/reference/serializer-registry.md) 了解注册自定义格式的方法。

如果需要参考一个较完整的项目结构，可直接使用 `example/game_01_minirpg/` 下的多表样例（英雄 / 技能 / 物品 / 敌人 / 关卡 / 全局配置），可通过 `npm run ex:minirpg`（或 `node example/game_01_minirpg/serialize.js`）生成 JSON、TS 产物以及一个基于 React + Tailwind 的静态网页（`out/index.html`）；该示例演示了 8 位 ID 分类、跨表引用以及前端即时消费（含简化回合制战斗）。

如果想展示增量点击类玩法，可参考 `example/game_02_click_cookies/`，运行 `npm run ex:click-cookies`（或 `node example/game_02_click_cookies/serialize.js`）后，会生成建筑 / 升级 / 成就等产物和一个可直接打开的点击饼干 Demo 页面。

如果想查看完整的增量游戏示例，可参考 `example/game_03_a_dark_room/`，这是一个基于经典游戏《A Dark Room》的完整实现。运行 `npm run ex:darkroom` 会自动构建项目并在 `http://localhost:8765` 启动服务器。该示例展示了：
- 多表联动的复杂游戏系统（资源 / 建筑 / 职业 / 行动 / 事件 / 全局配置）
- 配置驱动的游戏逻辑（直接使用配置表字段，无需额外转换）
- React 组件化的 UI 架构（模块化组织：utils / hooks / components / gameLogic / sceneConfig 等）
- 完整的游戏机制（资源生产消耗、冷却系统、解锁条件、场景切换等）
- 浏览器存档系统（localStorage 自动保存）

## 类型标记速览

`tables` 通过标记行（mark row）解析字段类型、装饰器与 ID 片段。标记行在 Excel 中与描述行（下一行）搭配使用：标记行写语法 token，描述行写字段名；空白单元格代表该位置在 Excel 中留空。

- `@`：拼接主键，多个 `@` 列会按照列顺序合并成最终 TID。导出时会使用 Excel 显示值（保留前导零、填充宽度等）；若整行的任意 `@` 片段为空，`tableConvert` 会抛出包含表名 / 行号的错误。
- `type?`：在类型末尾追加 `?` 表示可选，例如 `uint?`、`tid?`、`enum<Rarity>?`。未写 `?` 的列一旦留空会被视为缺失值并立即报错；字符串类型（`string`）是例外，空单元格会被标准化为 `""`。
- `enum<EnumName>`：引用上下文中的枚举（如 `enum<Rarity>`）。解析阶段会严格校验枚举项是否存在于 `context.enums.*` 中，缺失会报错；可用 `enum<Rarity|TEMP>` 追加一个字面量兜底值来兼容占位。
- `[` / `{` 等括号：必须“一列一个 token”，并与 `$ghost`、`$strict` 等装饰器组合使用。括号列在数据行通常保持空白，仅字段列（例如 `tid`、`uint`）实际写入值。
- `alias` / `alias?`：声明别名列，用于构建“别名 -> TID”映射。必须提供字段名（描述行），同一张表最多一个 alias 列；`alias?` 仅表示允许空白。

`tableConvert` 内部会调用 `@khgame/schema` 的 `exportJson`：若标记列未写 `?` 且数据为空，将立即抛出缺失值错误；整段 `$ghost { ... }` 则允许全部字段为空时整体缺省。结合 `tableEnsureRows` 可以过滤全空行。

#### 行定位与约定

- **标记行（Mark Row）**：写类型 token、装饰器、结构符号（`@`/`uint`/`enum<Rarity>`/`$strict` 等）。这里不会写字段名，也不会自动派生别名。
- **字段名行（Desc Row）**：写实际字段名（`tid`/`name`/`weight`……）。上一行的类型将套用到这一列的字段名上。
- **数据行（Data Rows）**：自标记行下方两行开始是正式数据。数组或对象的结构必须逐列完整展开。
- **上下文（Context）**：`context.enums.*`、`context.meta.*` 等在读取前通过 `loadContext` 注入，可配合 `enum<EnumName>`、`$ghost` 等标记使用。

> 注意：`weight:uint` 这一类“字段名:类型” token 不会被解析成类型；冒号只会原样保留。字段名写在字段名行，类型写在标记行即可。

### TID 组合与导出

以 `enemies.xlsx` 为例，表头前三列均标记为 `@`：

```
@      @         @      name      ...
sector category  serial
50     00        0001   Frostfang ...
```

导出时三个片段会按顺序拼成 `50000001`，并写入结果对象的 `_tid` 字段：

```json
{
  "tids": ["50000001", "50000002"],
  "result": {
    "50000001": {
      "_tid": "50000001",
      "name": "Frostfang Raider",
      "hp": 950
      // ...其他字段
    }
  }
}
```

对应的 TypeScript 产物会提供统一的品牌化类型：

```ts
// protocol/enemies.ts
export type EnemiesTID = TableContext.KHTableID;
export const toEnemiesTID = (value: string): EnemiesTID => value as EnemiesTID;
export const enemiesTids: EnemiesTID[] = raw.tids.map(toEnemiesTID);
export const enemies: Record<EnemiesTID, IEnemies> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toEnemiesTID(tid), value as IEnemies])
);

// protocol/enemiesInterface.ts
export interface IEnemies {
  _tid: EnemiesTID;
  name: string;
  hp: number;
  // ...其他字段
}

// 业务代码中使用品牌化 ID：
import { enemies, enemiesTids, toEnemiesTID } from './protocol/enemies';

const first: IEnemies = enemies[enemiesTids[0]];
const fromString = toEnemiesTID('50010001');
const specific = enemies[fromString];
```

> 提示：`TableContext` 会额外导出基础的 `KHTableID` 类型；枚举类型需在标记行写成 `enum<HeroClass>`，才能生成 `TableContext.HeroClass` 引用。

以下示例直接取自 `example/example.xlsx`：第 5 行为标记行，第 6 行为描述行，第 7/8 行对应 `convert.result` 的前两条数据（TID `2000000`、`2000001`）。横向排列表格便于照抄列布局：

| 行 \ 列 | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | AA | AB | AC | AD | AE | AF | AG | AH | AI | AJ | AK | AL | AM | AN | AO | AP | AQ | AR | AS | AT | AU | AV | AW | AX | AY | AZ | BA | BB | BC | BD | BE | BF | BG |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 第 5 行（类型标记） | `@` | `@` | `@` | `string` | `{` | `tid` | `[` | `tid` | `]` | `}` | `[` | `{` | `tid` | `number` | `}` | `]` | `[` | `Pair<uint>` | `Pair<uint>` | `Pair<uint>` | `]` | `Array<float>` | `Pair<uint>` | `Array<Pair>` | `[` | `[` | `int` | `int` | `int` | `]` | `[` | `[` | `bool` | `]` | `]` | `]` | `$oneof [` | `tid` | `bool` | `Pair<uint>` | `]` | `$strict [` | `{` | `uint` | `}` | `$ghost {` | `uint` | `}` | `[` | `ufloat` | `$ghost{` | `string` | `}` | `]` | `]` | `uint|string` |
| 第 6 行（字段名） | `ctype` | `building` | `level` | `name` | `upgrage` | `to` | `dependency` |  |  |  | `product` |  | `tid` | `num` |  |  | `cost` |  |  |  |  | `arr` | `pair` | `map` | `nest` |  |  |  |  |  |  |  |  |  |  |  | `stars` |  |  |  |  | `nestedArray` |  | `data` |  |  | `data` |  |  |  |  | `1` |  |  |  |  | `ax` |
| 第 7 行（示例） | `20` | `000` | `00` | `farm` | `''` | `2000001` | `''` | `''` | `''` | `''` | `''` | `''` | `1000001` | `1` | `''` | `''` | `''` | `oil:388` | `ore1:1551` | `''` | `''` | `1|2|3` | `tag:0` | `tag:0` | `''` | `''` | `1` | `2` | `3` | `''` | `''` | `''` | `Y` | `''` | `''` | `''` | `''` | `111` | `''` | `''` | `''` | `''` | `''` | `111` | `''` | `''` | `''` | `''` | `''` | `''` | `1` | `''` | `''` | `''` | `''` | `''` | `1` |
| 第 8 行（示例） | `20` | `000` | `01` | `farm` | `''` | `2000002` | `''` | `2000001` | `''` | `''` | `''` | `''` | `1000001` | `2` | `''` | `''` | `''` | `oil:416` | `ore1:1663` | `ore1:1663` | `''` | `1|2|4` | `tag:1` | `tag:s1` | `''` | `''` | `1` | `2` | `''` | `''` | `''` | `''` | `''` | `''` | `''` | `''` | `''` | `222` | `''` | `''` | `''` | `''` | `''` | `111` | `''` | `''` | `222` | `''` | `''` | `''` | `2` | `''` | `2` | `''` | `''` | `''` | `2` |

- 标记行需要逐列拆分所有 token，括号、装饰器、类型都占独立单元格。
- 描述行（第 6 行）仅在需要生成字段名时填写，空白代表该位置不生成字段。
- `Y` 会被布尔型解析为 `true`；`oil:388` 等 `资源:数值` 输入会根据 `Pair<uint>` 解析为 `{ key: 'oil', val: 388 }`。
- 未显式加 `?` 的列若在数据行留空（且不在 `$ghost` 块内）会触发 `exportJson` 缺失值报错；若需要整体可选请使用 `$ghost { ... }` 或 `uint?` 等标记。
- 表格中的 `''` 仅表示 Excel 中该单元格留空。

### 常用模式示例

下列模板可单独复制到 Excel，快速组合出常见配置：

**主键 + 枚举 + 可选子结构**

| 行 \ 列 | A | B | C | D | E | F |
| --- | --- | --- | --- | --- | --- | --- |
| 标记行 | `@` | `string` | `enum<Rarity>` | `$ghost {` | `uint?` | `}` |
| 描述行 | `tid` | `name` | `rarity` | `shop` | `sell` | *(空)* |
| 示例 1 | `10001` | `Short Sword` | `RARE` | *(空)* | `100` | *(空)* |
| 示例 2 | `10002` | `HP Potion` | `COMMON` | *(空)* | *(空)* | *(空)* |

> 枚举值来自 `context.enums.json`：
> ```json
> { "Rarity": { "COMMON": 1, "RARE": 2, "EPIC": 3, "LEGENDARY": 4 } }
> ```

**严格掉落数组**

| 行 \ 列 | A | B | C | D | E | F | G | H |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 标记行 | `@` | `string` | `$strict [` | `{` | `tid` | `uint` | `}` | `]` |
| 字段名行 | `tid` | `name` | `entries` | *(空)* | `dropTid` | `weight` | *(空)* | *(空)* |
| 示例 1 | `3001` | `Stage 1-1` | *(空)* | *(空)* | `2001` | `50` | *(空)* | *(空)* |
| 示例 2 | `3002` | `Stage 1-2` | *(空)* | *(空)* | `2003` | `70` | *(空)* | *(空)* |

> 若数组需要多个元素，可在 `}` 之后依次追加新的 `{` → `tid` → `uint` → `}` 片段，最后用 `]` 收束结构。

**可选数值 + 默认字符串**

| 行 \ 列 | A | B | C |
| --- | --- | --- | --- |
| 标记行 | `@` | `string` | `uint?` |
| 描述行 | `tid` | `title` | `limit` |
| 示例 1 | `5001` | `Daily Reward` | `3` |
| 示例 2 | `5002` | `Limited Offer` | *(空)* |

以上小例与上方综合表相互参考：常见的 `enum<Rarity>`、`tid`、`uint` 等可以直接写在同一格中；数组 / 对象控制符（`$strict`、`{`、`}`、`[`、`]` 等）仍需“一列一个 Token”。字符串可留空，数值若需缺省需写成 `uint?` 或置于 `$ghost { ... }` 结构内。表格中的 `*(空)*` 表示该单元格在 Excel 中保持空白。

### 枚举与上下文配置快速指南

1. **准备 `context.enums*.json`**：在输入目录（或自定义上下文目录）放置 `context.enums.json`，内容示例：
   ```json
   {
     "Rarity": {
       "COMMON": 1,
       "RARE": 2,
       "EPIC": 3,
       "LEGENDARY": 4
     }
   }
   ```
   也可以拆分为 `context.enums.rarity.json`、`context.enums.element.json` 等多个文件，`loadContext` 会自动合并。
2. **声明导出元信息**：在同一路径下创建 `context.meta.json`，指定哪些枚举需要被序列化器输出：
   ```json
   {
     "meta": {
       "exports": {
         "enum": ["enums"]
       }
     }
   }
   ```
   其中 `"enums"` 对应上一步 JSON 的键名；可写成数组导出多个命名空间。
3. **在脚本中加载上下文**：CLI 默认不会读取上下文，推荐在自定义脚本中调用 `loadContext`：
   ```ts
   const { loadContext, serialize, tsInterfaceSerializer } = require('@khgame/tables');
   const ctx = loadContext('./example');
   serialize('./example/items.xlsx', './out', {
     'Items.ts': tsInterfaceSerializer
   }, ctx);
   ```
   `loadContext(dir)` 会自动读取 `dir` 下符合 `context.*.json` 的文件，并在序列化阶段提供 `context.enums.*`、`context.meta.*` 等信息。
4. **表头写成 `enum<Rarity>`**：当标记行使用 `enum<Rarity>`（或 `enum<Rarity|Fallback>`）时，`tableSchema`/`tableConvert` 会校验单元格值是否存在于上下文枚举中；TS/Go/C# 序列化器则会在产物中生成 `TableContext.Rarity` 引用。

### alias 列（别名映射）

> alias 机制的设计思想:
> - 在很多项目里头, 有实际用 TID 很麻烦的情况, 比如某个武器有特殊效果. 武器的数据要填充在表格里, 但实际是很难泛化, 代码中不可避免的要感知具体的行
> - 直接的问题是很难做到 SSOT，通常来说，做的好一些的会用胶水层，比如自己封装一个其他的 id, 或者定义枚举、方法，加校验器。避免对字面量的依赖
> - 用 tables 的 enum 机制模拟是个做法，而 tables 的 index 则可以支持任意字段的 O(1) 查询
> - 用 alias 机制应该能避免劣化, 因为在编译时就会失败, 有不需要额外定义一份 enum 表

`tables` 支持在任意表中声明“别名 -> TID”的唯一映射，只需在标记行写上 `alias` 或 `alias?`（唯一列，不可多列）：

| 行 \ 列 | A | B | C |
| --- | --- | --- | --- |
| 标记行 | `@` | `@` | `alias` |
| 描述行 | `type` | `serial` | `nameAlias` |
| 示例 1 | `500` | `001` | `school` |
| 示例 2 | `500` | `002` | `hospital` |
| 示例 3 | `500` | `003` | *(空)* |

- 标记为 `alias` 的列必须在描述行提供字段名（如 `nameAlias`），且整张表只能出现一次。
- 数据行中的空值会被忽略；重复别名会触发错误并列出所有冲突项。
- 导出结果会附带：
  - `convert.aliases.<field>`：别名到 TID 的 map，例如 `{ school: '500001', hospital: '500002' }`
  - `convert.indexes.alias.<field>`：用于快速查找的映射，同步进 `meta.alias` 的枚举列表
  - TS/TS-Interface 序列化器会额外生成 `AliasProtocol` 常量 / 类型及 `getAliasByProtocol` 辅助函数，便于按别名读取结构化数据。
- `alias?` 与 `alias` 行为一致，只是显式提醒该列允许空白。

更多细节与示例可参考 `docs-site/guide/concepts.md` 的“alias 列”章节。

示例数据（`example/example.xlsx` 中 `convert.result` 的前两项，已按常用字段裁剪）：

```json
{
  "2000000": {
    "_tid": "2000000",
    "ctype": 20,
    "building": 0,
    "level": 0,
    "name": "farm",
    "upgrage": { "to": 2000001, "dependency": [] },
    "product": [{ "tid": 1000001, "num": 1 }],
    "cost": [{ "key": "oil", "val": 388 }, { "key": "ore1", "val": 1551 }],
    "arr": [1, 2, 3],
    "pair": { "key": "tag", "val": 0 },
    "map": [{ "key": "tag", "val": "0" }],
    "nest": [[1, 2, 3], [[true]]],
    "stars": [111],
    "nestedArray": [{ "data": 111 }, null, [1]],
    "ax": 1
  },
  "2000001": {
    "_tid": "2000001",
    "ctype": 20,
    "building": 0,
    "level": 1,
    "name": "farm",
    "upgrage": { "to": 2000002, "dependency": [2000001] },
    "product": [{ "tid": 1000001, "num": 2 }],
    "cost": [
      { "key": "oil", "val": 416 },
      { "key": "ore1", "val": 1663 },
      { "key": "ore1", "val": 1663 }
    ],
    "arr": [1, 2, 4],
    "pair": { "key": "tag", "val": 1 },
    "map": [{ "key": "tag", "val": "s1" }],
    "nest": [[1, 2], [[]]],
    "stars": [222],
    "nestedArray": [{ "data": 111 }, { "data": 222 }, [2, { "1": "2" }]],
    "ax": 2
  }
}
```

上述结构同时演示了：多段 TID 拼接、`enum`/`tid` 类型、`$strict` 和 `$ghost` 的组合、嵌套数组 / 对象等复杂场景。

### 自定义索引（Label -> TID 等）

若需要在导出结果中增加额外的查找表（例如 `Label -> tid` 或 `skillId -> tid[]`），可以在上下文目录的 `context.meta.json`（或根级 `context.indexes`）中声明索引配置，`tableConvert` 会自动根据 `convert.result` 构建索引并写入 `convert.indexes`：

```json
{
  "meta": {
    "indexes": {
      "Example": [
        "Label",
        { "name": "skill", "path": "rule.skillId", "mode": "multi" }
      ]
    }
  }
}
```

- `Example` 可以是 Excel 文件名、其驼峰名或生成的接口名；也可使用 `"*"` 作为通配配置
- 字符串表示简单列路径（点号访问嵌套字段），对象则可指定 `mode: "multi"`、`caseInsensitive`、`allowEmpty` 等行为
- 生成的结构会出现在 `table.convert.indexes` 中，同时在 `table.convert.meta.indexes` 留下构建信息与冲突列表，方便排查重复 key

### Data Structure

默认的 table 结构
```js
table = {
  getValue: function(table_, row_, col_){},
  cols: [
    "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"
  ],
  data: {
    "4": {
      "C": {
        "t": "s",
        "v": "@",
        "w": "@"
      },
      "D": {
        "t": "n",
        "v": 3,
        "w": "3"
      },
      "E": {
        "t": "s",
        "v": "@khgame/table",
        "w": "@khgame/table"
      },
      ...
    },
    ...
  }  
}
```

- cols: 数据中出现过的所有列的列名, 以 EXCEL 的列名规则排序
- data: 以 row 为键, row 对应的数据以 col 为键, 值为 SheetJS (`xlsx`) 的 value 数据结构
- getValue: 获取 table 内指定行列的数据的方法, 使用方法如下 (以上数据为例)

```js
const { getValue } = table
let v1 = getValue(table, 4, "C") // v1 === "@"
let v2 = getValue(table, 4, "D") // v2 === 3
let v3 = getValue(table, 4, "E") // v3 === "@khgame/table"
```

> 建议使用 getValue 方法而非直接访问数据结构  
> 原因是有一些插件可以改变 data 数据结构, 以适应不同场合下的表格使用需求  
> 所以只建议在清楚自己所使用的插件的情况下直接访问 data 数据结构  

### Supported Data Types

- String: `string`, `str`
- Float: `double`, `single`, `float`, `num`, `number`
- UFloat: `ufloat`, `count`
- Int: `int`, `int8`, `int16`, `int32`, `int64`, `long`
- UInt: `uint`, `uint8`, `uint16`, `uint32`, `uint64`, `ulong`, `tid`, `@`
- Boolean: `bool`, `onoff`
- Enum: `enum<EnumName>`（从上下文目录加载枚举定义，支持 `enum<EnumName|fallback>`）
- Nested Array: 以 `[` 开始, 以 `]` 结束
- Nested Object: 以 `{` 开始, 以 `}` 结束
- Any: `dynamic`, `object`, `obj`, `any`
- Array: `Array<T>`
- Pair: `Pair<T>`

> 枚举值由上下文目录加载：将 `context.enums*.json` 放在输入目录旁，并在 `context.meta.json` 的 `meta.exports.enum` 中声明导出的枚举包
> string 不允许空串
> 定义类型的情况下, 类型转换失败将抛出异常, 形如:  
    `
    TypeError: Convert Error for col(U) map:Map<uint> // 此处 Map 已经不在类型定义中
    undefined type detected, for value : tag-0
    `   
> Array, Pair 原则上不建议使用, 而建议使用 Nested Array 和 Nested Object  
> Array 和 Pair 不指定类型时相当于 Array<any> 和 Pair<any>  
> 使用 Any 可能导致逻辑内出现未定义情况, 请注意 

- 多个类型或, 可以简单用竖线'|'连接表示多个类型的或如: uint|float

> 由于类型或为最大可用的方式, 如果前一个类型能解析则会直接解析成该类型, 如 string|float 一定会解析成 float

- 模糊类型, 对于可能为空的mark, 只需要在类型 mark最后加上问号'?', 如 uint? (相当于 uint|undefined)

> 类型解析错误不会被认为是模糊类型

#### Decorators

Decorators 是用于描述 Nested 结构的特殊标记
使用方法是在 Nested 结构的起始标记前(同 cell 内) 书写 Decorator 标记
多个 Decorator 标记可用竖线 '|' 分隔, 同时作用

目前支持的 Decorators 有:

##### Nested Array

- $ghost: 标记该结构为 ghost 结构, 当结构中的所有值都为空值时, 认为整个结构不存在
- $strict: 标记该数组为 strict 数组, 数组中每一项都必须有值

##### Nested Object 

- $ghost: 标记该结构为 ghost 结构, 当结构中的所有值都为空值时, 认为整个结构不存在

#### Constant types

### plugins

基本用法

`const { PLUGIN_NAME } = require('@khgame/tables')`

#### 索引类

##### tableRows
   - usage
   ```js
   let ret = readAndTranslate(`your_awesome_excel.xlsx`, { plugins: [ tableRows ] })
   ```
   - result  
   > table 中将增加有序的索引 rows, 依序标注所有使用到的行号
   ```js
   table = {
     rows : [ 4, 5, 6, 7, 10, 12 ... ],
     ...
   }
   ```
   
##### tableEnsureRows 
- usage
```js
let ret = readAndTranslate(`your_awesome_excel.xlsx`, { plugins: [ tableEnsureRows ] })
```
- result  
> table 中将增加有序的索引 rows, 依序标注所有使用到的行号, 元素全为空的行将不会包含在内
```js
table = {
  erows : [ 6, 7, 10, 12 ... ],
  ...
}
```
    
##### tableColMap
- usage
```js
let ret = readAndTranslate(`your_awesome_excel.xlsx`, { plugins: [ tableColMap ] })
```
- result
> 在 table 中增加列名到列 ind 的索引
```js
table = {
  colMap : { "A" : 1, "B" : 2, "D" : 3, "AA" : 4 ... }
  ...   
}
```

##### tableMark
- usage
```js
let ret = readAndTranslate(`your_awesome_excel.xlsx`, { plugins: [ tableMark ] })
```
- result  
> table 中将增加开始标记 tableMark, 标记表格中第一个 '@' 符号出现的位置 (详见 [ID 规划](###ID规划) )
```js
table = {
  tableMark : [ row: 4, col: 'C' ] 
  rows : [ 4, 5, 6, 7, 10, 12 ... ],
  ...
}
```

#### 数据结构类

##### tablePlain
- usage
```js
let ret = readAndTranslate(`your_awesome_excel.xlsx`, { plugins: [ tablePlain ] })
```
- result
> data 将被改为 plan 模式, 简化 value 结构到只保留有效值
```js
table = {
  data : {
    "4": {  
      "C": "@",
      "D": 3,
      "E": "@khgame/table",
      ...
    },
  },
  ...
}
```

##### tableExpand
- usage
```js
let ret = readAndTranslate(`your_awesome_excel.xlsx`, { plugins: [ tableExpand ] })
```
- result
> data 将被改为 expand 模式, 按照 col 的可能情况扩展成列表并保证有序
```js
table = {
  data : {
    "4": [ "@", 3, "@khgame/table", undefined, undefined, ...],
    "5": [ "@", 3, "@khgame/table", 33.5, "@khgame/tconv", ...],
  },
  ...
}
```   

#### 数据结构类

##### 描述生成插件 tableSchema

- usage
```js
let ret = readAndTranslate(`your_awesome_excel.xlsx`, { plugins: [ tableSchema ] })
```
- result
```js
table = {
  ...
  markList: ['uint','uint','uint','string','{','uint','[','uint',']','}','[' ... ]
  schema: {
    "ctype": "UInt",
    "building": "UInt",
    "level": "UInt",
    "name": "String",
    "upgrage": {
      "to": "UInt",
      "dependency": [
        "UInt"
      ]
    },
    "product": [
      {
        "tid": "UInt",
        "num": "Float"
      }
    ],
    "arr": "Array<Float>",
    "map": "Pair<UInt>",
    "nest": [
      [
        "Int",
        "Int",
        "Int"
      ],
      [
        [
          "Boolean"
        ]
      ]
    ]
  },
  ...
}
```

##### 标准导表插件 tableConvert
- usage
```js
let ret = readAndTranslate(`your_awesome_excel.xlsx`, { plugins: [ tableConvert ] })
```
- markLine rules
```bash
Mark => [Decorators] TypeSegment
Decorators => Decorator[<'|'>Decorators]
TypeSegment => [TypeGroup][<'?'>]
TypeGroup => Type[<'|'>TypeGroup]
Type => TypeName[<'<'>TypeGroup<'>'>]
Decorator => <'$'>Identity
Type => Identity
```
- result
> 将 raw 数据导出成程序易读的数据格式  
> 其中 tids 表示原本的 row 与 id 的对应关系  
> result 为转换后的数据, 以 id 为 key, 内部是表内数据的嵌套结构
> 表格规则循序 @khgame/tid 规范, 详见 (详见 [ID 规划](###ID规划) )  
> 或使用命令 `node ./example/ex.convert.js` 尝试 ./example 下的示例   
```js
table = {
  ...
  convert : {
    tids: {
      "6": "2000000",
      "7": "2000001",
      "8": "2000002",
      "9": "2000003",
      "10": "2000004"
    },
    result: {
      "2000000": {
        "building_type": 200000,
        "level": 0,
        "name": "farm",
        "upgrage": {
          "to": 2000001,
          "dependency": []
        },
        "product": {
          "tid": 1000001,
          "num": 1
        }
      },
      "2000001": {
        "building_type": 200000,
        "level": 1,
        "name": "farm",
        "upgrage": {
          "to": 2000002,
          "dependency": []
        },
        "product": {
          "tid": 1000001,
          "num": 2
        }
      }
      ...
    }
  }

}
```   

### Serializer

同时, 可以使用预制的Serializer来生成文件

#### jsonxSerializer（协议头导出）

- 在标准 JSON 外层增加 `protocol` 与 `source` 字段（详见 [`docs-site/reference/protocol.md`](./docs-site/reference/protocol.md)）
- CLI：`tables -i ./example -o ./out -f jsonx`
- 适合需要远端校验版本 / 追踪来源的场景；`convert.collisions` 等元数据也会保留

产物示例：

```json
{
  "protocol": { "name": "khgame.tables", "version": 1 },
  "source": { "fileName": "Example", "sheetName": "__data" },
  "convert": {
    "tids": ["2000000"],
    "result": { "2000000": { "name": "farm", "level": 0, "...": "..." } },
    "collisions": []
  }
}
```

#### jsonSerializer
example:
```js
const { serialize, jsonSerializer } = require('@khgame/tables')

serialize(`${__dirname}/your_awesome_excel.xlsx`, __dirname,
  {
    'your_awesome_excel.json': jsonSerializer
  }
)
```

#### tsInterfaceSerializer

tsInterfaceSerializer 可以用于生成 ts 的 interface 文件:

example:
```js
const { serialize, jsonSerializer, tsInterfaceSerializer } = require('@khgame/tables')

serialize(`${__dirname}/your_awsome_excel.xlsx`, __dirname,
  {
    'your_awesome_data.json': jsonSerializer,
    'your_awesome_ts_interface.ts': tsInterfaceSerializer
  }
)
```

#### jsSerializer

jsSerializer 可以用于生成可直接引入的 js 代码:

example:
```js
const { serialize, jsSerializer } = require('@khgame/tables')

serialize(`${__dirname}/your_awsome_excel.xlsx`, __dirname,
  {
    'your_awesome_data.js': jsSerializer,
  }
)
```

#### tsSerializer

jsSerializer 可以用于生成可直接引入的 ts 代码:

example:
```js
const { serialize, tsSerializer } = require('@khgame/tables')

serialize(`${__dirname}/your_awsome_excel.xlsx`, __dirname,
  {
    'your_awesome_data.js': tsSerializer,
  }
)
```
    
### ID规划

请移步 [https://github.com/khgame/tid-rules](https://github.com/khgame/tid-rules)

### todo

- [x] DECORATORS: Base
- [x] DECORATORS: ARR: 
    - *(deprecated) $oneof*
    - [x] $strict 
    - [x] $ghost
- [x] DECORATORS: OBJ
    - [x] $ghost
- [x] SCHEMA: [@khgame/schema](https://github.com/khgame/schema)
- [x] PLAIN OR
- [ ] CONSTANT TYPE
- [ ] ID RULES
- [ ] RELATED ID RULES
- [x] INTERFACE EXPORTOR: JS
- [x] INTERFACE EXPORTOR: TS
- [x] INTERFACE EXPORTOR: TSINTERFACE
- [ ] INTERFACE EXPORTOR: GO
- [ ] INTERFACE EXPORTOR: JAVA
- [ ] INTERFACE EXPORTOR: C#

### Troubleshooting
