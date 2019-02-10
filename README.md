# tables

轻量级跨平台Excel导表工具(Excel=>json/js)

## 功能

- 支持 Excel 文件到各种数据类型间的转换, 目前支持 json/js
- 携带插件系统, 具有高可扩展性
- 丰富的官方插件, 开箱即用的为 table 数据结构建立各种功能支持, 如各类索引, 数据结构转换, ID 规划功能等

## 基础用法

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

### plugins

基本用法

`const { plugins } = require('@khgame/tables')`

#### 索引类

- rows : 
    - usage
    ```js
    let ret = readAndTranslate(`${__dirname}/excel/your_awesome_excel.xlsx`, { plugins: [ Plugins.rows ] })
    ```
    - result  
    > table 中将增加有序的索引 rows, 依序标注所有使用到的行号
    ```js
    table = {
      rows : [ 4, 5, 6, 7, 10, 12 ... ],
      ...
    }
    ```
- mark : 
    - usage
    ```js
    let ret = readAndTranslate(`${__dirname}/excel/your_awesome_excel.xlsx`, { plugins: [ Plugins.mark ] })
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
    
### 数据结构类

- plain
    - usage
    ```js
    let ret = readAndTranslate(`${__dirname}/excel/your_awesome_excel.xlsx`, { plugins: [ Plugins.plain ] })
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

- expand 
    - usage
    ```js
    let ret = readAndTranslate(`${__dirname}/excel/your_awesome_excel.xlsx`, { plugins: [ Plugins.expand ] })
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

### ID规划

    ...
