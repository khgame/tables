# tables

轻量级跨平台Excel导表工具 ( `Excel` ==> `json`/`js`/`ts` )

## 功能

- 支持 Excel 文件到各种数据类型间的转换, 目前支持 json/js
- 携带插件系统, 具有高可扩展性
- 丰富的官方插件, 开箱即用的为 table 数据结构建立各种功能支持, 如各类索引, 数据结构转换, 数据验证, ID 规划功能等

## 基础用法

### 安装

直接从 npm 安装

`npm i -g @khgame/tables`

或者从源码安装

1. clone 项目到本地
2. `npm install && npm run local-install`

### CLI

```bash
Usage: kh-table [-i INPUT_DIR] [-o OUTPUT_DIR] [-f FORMAT]

Options:
  --input, -i   the input directory                               [default: "."]
  --output, -o  the output directory                              [default: "."]
  --format, -f  export format
                 [choices: "json", "js", "ts", "ts-interface"] [default: "json"]
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
- Nested Array: 以 `[` 开始, 以 `]` 结束
- Nested Object: 以 `{` 开始, 以 `}` 结束
- Any: `dynamic`, `object`, `obj`, `any`
- Array: `Array<T>`
- Pair: `Pair<T>`

> 定义类型的情况下, 类型转换失败将抛出异常, 形如:  
    `
    TypeError: Convert Error for col(U) map:Map<uint> // 此处 Map 已经不在类型定义中
    undefined type detected, for value : tag-0
    `   
> Array, Pair 原则上不建议使用, 而建议使用 Nested Array 和 Nested Object  
> Array 和 Pair 不指定类型时相当于 Array<any> 和 Pair<any>  
> 使用 Any 可能导致逻辑内出现未定义情况, 请注意  
> 对于异构列, 建议使用 $oneof NESTED ARRAY  

#### Decorators

Decorators 是用于描述 Nested 结构的特殊标记
使用方法是在 Nested 结构的起始标记前(同 cell 内) 书写 Decorator 标记
多个 Decorator 标记可用竖线 '|' 分隔, 同时作用

目前支持的 Decorators 有:

##### Nested Array

- $oneof: 标记该数组为 oneof 数组, 获取且仅获取该数组的第一个有效值

##### Nested Object 

无

#### Constant types



### plugins

基本用法

`const { plugins } = require('@khgame/tables')`

#### 索引类

##### Plugins.rows 
   - usage
   ```js
   let ret = readAndTranslate(`your_awesome_excel.xlsx`, { plugins: [ Plugins.rows ] })
   ```
   - result  
   > table 中将增加有序的索引 rows, 依序标注所有使用到的行号
   ```js
   table = {
     rows : [ 4, 5, 6, 7, 10, 12 ... ],
     ...
   }
   ```
   
##### Plugins.erows 
- usage
```js
let ret = readAndTranslate(`your_awesome_excel.xlsx`, { plugins: [ Plugins.erows ] })
```
- result  
> table 中将增加有序的索引 rows, 依序标注所有使用到的行号, 元素全为空的行将不会包含在内
```js
table = {
  erows : [ 6, 7, 10, 12 ... ],
  ...
}
```
    
##### Plugins.colMap
- usage
```js
let ret = readAndTranslate(`your_awesome_excel.xlsx`, { plugins: [ Plugins.colMap ] })
```
- result
> 在 table 中增加列名到列 ind 的索引
```js
table = {
  colMap : { "A" : 1, "B" : 2, "D" : 3, "AA" : 4 ... }
  ...   
}
```

##### Plugins.mark
- usage
```js
let ret = readAndTranslate(`your_awesome_excel.xlsx`, { plugins: [ Plugins.mark ] })
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

##### Plugins.plain
- usage
```js
let ret = readAndTranslate(`your_awesome_excel.xlsx`, { plugins: [ Plugins.plain ] })
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

##### Plugins.expand
- usage
```js
let ret = readAndTranslate(`your_awesome_excel.xlsx`, { plugins: [ Plugins.expand ] })
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

##### 描述生成插件 Plugins.schema

- usage
```js
let ret = readAndTranslate(`your_awesome_excel.xlsx`, { plugins: [ Plugins.schema ] })
```
- result
```js
table = {
  ...
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

##### 标准导表插件 Plugins.convert
- usage
```js
let ret = readAndTranslate(`your_awesome_excel.xlsx`, { plugins: [ Plugins.convert ] })
```
- result
> 将 raw 数据导出成程序易读的数据格式  
> 其中 tids 表示原本的 row 与 id 的对应关系  
> result 为转换后的数据, 以 id 为 key, 内部是表内数据的嵌套结构
> 表格规则循序 @khgame/tid 规范, 详见 (详见 [ID 规划](###ID规划) )  
> 或使用命令 `node ./example/convert.example.js` 尝试 ./example 下的示例   
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

#### jsonSerializer
example:
```js
const { Serializer } = require('@khgame/tables')

Serializer.serialize(`${__dirname}/your_awesome_excel.xlsx`, __dirname,
  {
    'your_awesome_excel.json': Serializer.jsonSerializer
  }
)
```

#### tsInterfaceSerializer

tsInterfaceSerializer 可以用于生成 ts 的 interface 文件:

example:
```js
const { Serializer } = require('@khgame/tables')

Serializer.serialize(`${__dirname}/your_awsome_excel.xlsx`, __dirname,
  {
    'your_awesome_data.json': Serializer.jsonSerializer,
    'your_awesome_ts_interface.ts': Serializer.tsInterfaceSerializer
  }
)
```

#### jsSerializer

jsSerializer 可以用于生成可直接引入的 js 代码:

example:
```js
const { Serializer } = require('@khgame/tables')

Serializer.serialize(`${__dirname}/your_awsome_excel.xlsx`, __dirname,
  {
    'your_awesome_data.js': Serializer.jsSerializer,
  }
)
```

#### tsSerializer

jsSerializer 可以用于生成可直接引入的 ts 代码:

example:
```js
const { Serializer } = require('@khgame/tables')

Serializer.serialize(`${__dirname}/your_awsome_excel.xlsx`, __dirname,
  {
    'your_awesome_data.js': Serializer.tsSerializer,
  }
)
```
    
### ID规划

请移步 [https://github.com/khgame/tid-rules](https://github.com/khgame/tid-rules)

### todo

- [x] INTERFACE EXPORTOR: TS
- [ ] INTERFACE EXPORTOR: GO
- [ ] INTERFACE EXPORTOR: JAVA
- [ ] INTERFACE EXPORTOR: C#
- [x] DECORATORS: Base
- [x] DECORATORS: ARR: $oneof
- [ ] DECORATORS: OBJ
- [ ] PLAIN OR
- [ ] CONSTANT TYPE

### Troubleshooting

