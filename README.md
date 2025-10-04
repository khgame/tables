# tables

轻量级跨平台Excel导表工具 ( `Excel` ==> `json`/`js`/`ts`/`ts-interface` )

## 在线体验

- GitHub Pages: https://khgame.github.io/tables/
- 站点包含各示例（Mini RPG / Click Cookies / A Dark Room）的静态 Demo，可直接打开 `examples/<name>/index.html` 体验导表结果。
- 文档（`docs/`）及 `README` 会同步发布，方便快速查阅概念约定与插件说明。

## 功能

- 支持将 Excel 转换为 json/js/ts/ts-interface 等多种序列化格式，可按需扩展新的目标
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

### API

- Out-of-box API : `readAndTranslate(filepath [,option])`
    > 这种用法下, 只会读出这个文件中的一张 sheet, sheet 名规则如下  
    > - 如果在 option 中填写了 sheetName 字段, 则读出该指定的 sheet  
    > - 如果没有指定, 读出名字为 `__data` 的 sheet
    > - 如果没有该 sheet, 则读出表内第一张 sheet
- 读出 `raw js-xlsx` 结构: `workbook = readWorkBook(filePath)`
    > 包含所有的 sheet, 具体数据结构请参照 [js-xlsx 文档](https://www.npmjs.com/package/js-xlsx)
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

如果需要扩展导出格式，可参考 [`docs/serializer-registry.md`](./docs/serializer-registry.md) 了解注册自定义格式的方法。

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

- `@`：拼接主键，多个 `@` 列会合并成最终 TID
- `type?`：在类型末尾加 `?` 表示可选；留空但未加 `?` 会在转换时抛错
- `enum(Name)`：引用上下文中的枚举，供 Schema 与序列化使用
- `[` / `{` 等括号：必须拆分到独立单元格，和 `$ghost`、`$strict` 等装饰器组合使用

`tableConvert` 内部会调用 `@khgame/schema` 的 `exportJson`：若标记列未写 `?` 且数据为空，将立即抛出缺失值错误；整段 `$ghost { ... }` 则允许全部字段为空时整体缺省。结合 `tableEnsureRows` 可以过滤全空行。

以下示例直接取自 `example/example.xlsx`，展示了 `tableConvert` 解析的关键列。所有 token、描述均由脚本读取原始工作表并核对：

| 列 | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 标记行 | `@` | `@` | `@` | `string` | `{` | `tid` | `[` | `tid` | `]` | `}` | `[` | `{` | `tid` | `number` | `}` | `]` |
| 描述行 | `ctype` | `building` | `level` | `name` | `upgrage` | `to` | `dependency` |  |  |  | `product` |  | `tid` | `num` |  |  |
| 备注 | TID 段 1 | TID 段 2 | TID 段 3 | 字段 `name` | 对象开始 | 字段 `to` | 开始数组 | 元素类型 | 数组结束 | 对象结束 | 开始数组 | 元素对象 | 字段 `tid` | 字段 `num` | 对象结束 | 数组结束 |

| 列 | T | U | V | W | X | Y | Z | AA | AB | AC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 标记行 | `[` | `Pair<uint>` | `Pair<uint>` | `Pair<uint>` | `]` | `Array<float>` | `Pair<uint>` | `Array<Pair>` | `[` | `[` |
| 描述行 | `cost` |  |  |  |  | `arr` | `pair` | `map` | `nest` |  |
| 备注 | 成本数组 | 键值条目 1 | 键值条目 2 | 键值条目 3 | 数组结束 | 数字列表 | 单 Pair 字段 | Pair 数组 | 嵌套数组开始 | 嵌套下一层 |

| 列 | AD | AE | AF | AG | AH | AI | AJ | AK | AL | AM |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 标记行 | `int` | `int` | `int` | `]` | `[` | `[` | `bool` | `]` | `]` | `]` |
| 描述行 |  |  |  |  |  |  |  |  |  |  |
| 备注 | 嵌套元素 1 | 嵌套元素 2 | 嵌套元素 3 | 嵌套结束 | 嵌套层 2 | 更深数组 | 嵌套布尔 | 结束 | 结束 | 结束 |

| 列 | AN | AO | AP | AQ | AR | AS | AT | AU | AV | AW | AX | AY |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 标记行 | `$oneof [` | `tid` | `bool` | `Pair<uint>` | `]` | `$strict [` | `{` | `uint` | `}` | `$ghost {` | `uint` | `}` |
| 描述行 | `stars` |  |  |  |  | `nestedArray` |  | `data` |  |  | `data` |  |
| 备注 | one-of 数组 | 枚举项引用 | 枚举辅助字段 | one-of 附带数据 | 数组结束 | 强制非空数组 | 数组元素对象 | 对象字段 | 对象闭合 | ghost 装饰 | 子项字段 | Ghost 结束 |

| 列 | AZ | BA | BB | BC | BD | BE | BF | BG |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 标记行 | `[` | `ufloat` | `$ghost{` | `string` | `}` | `]` | `]` | `uint|string` |
| 描述行 |  |  |  | `1` |  |  |  | `ax` |
| 备注 | 追加数组 | 浮点值 | ghost 装饰 | 枚举标签名 | ghost 结束 | 数组结束 | 顶层结束 | 可选类型联合 |

空白单元格即为 Excel 中保持空白的描述行／标记行；表头按照上述拆分方式才能被 `@khgame/schema` 正确解析。

数据行示例（标记行所在行为第 5 行，以下取第 7、8 行的实际单元格值；空单元格以 `''` 表示）：

| 行 \ 列 | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 7 (`mark.row + 2`) | `20` | `000` | `00` | `farm` | `''` | `2000001` | `''` | `''` | `''` | `''` | `''` | `''` | `1000001` | `1` | `''` | `''` |
| 8 (`mark.row + 3`) | `20` | `000` | `01` | `farm` | `''` | `2000002` | `''` | `2000001` | `''` | `''` | `''` | `''` | `1000001` | `2` | `''` | `''` |

| 行 \ 列 | T | U | V | W | X | Y | Z | AA | AB | AC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | `''` | `oil:388` | `ore1:1551` | `''` | `''` | `1|2|3` | `tag:0` | `tag:0` | `''` | `''` |
| 8 | `''` | `oil:416` | `ore1:1663` | `ore1:1663` | `''` | `1|2|4` | `tag:1` | `tag:s1` | `''` | `''` |

| 行 \ 列 | AD | AE | AF | AG | AH | AI | AJ | AK | AL | AM | AN | AO | AP | AQ | AR | AS | AT | AU | AV | AW | AX | AY | AZ | BA | BB | BC | BD | BE | BF | BG |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | `1` | `2` | `3` | `''` | `''` | `''` | `Y` | `''` | `''` | `''` | `''` | `111` | `''` | `''` | `''` | `''` | `''` | `111` | `''` | `''` | `''` | `''` | `''` | `1` | `''` | `''` | `''` | `''` | `''` | `1` |
| 8 | `1` | `2` | `''` | `''` | `''` | `''` | `''` | `''` | `''` | `''` | `''` | `222` | `''` | `''` | `''` | `''` | `''` | `111` | `''` | `''` | `222` | `''` | `''` | `2` | `''` | `2` | `''` | `''` | `''` | `2` |

> `Y` 在布尔列会被解析成 `true`；留空的单元格在未标记 `?` 时会触发 `exportJson` 的缺失值报错，只有放在 `$ghost { ... }` 或显式 `?` 时才允许整体缺省。

示例数据（`example/example.xlsx` 中 `convert.result` 的前两项，已按常用字段裁剪）：

```json
{
  "2000000": {
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
- data: 以 row 为键, row 对应的数据以 col 为键, 值为 js-xlsx 的 value 数据结构
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
- Enum: `enum(Name)`（从上下文目录加载枚举定义）
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

- 在标准 JSON 外层增加 `protocol` 与 `source` 字段（详见 [`docs/protocol.md`](./docs/protocol.md)）
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
