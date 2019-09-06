import {parseSchema} from '@khgame/schema'
import {tableDesc} from './desc'
import {tableEnsureRows} from './erows'

export function tableSchema(table, context) {
    if (!table.tableMark || !table.markLine || !table.descLine) {
        table = tableEnsureRows(table);
        table = tableDesc(table)
    }

    const {markCols, markLine} = table;

    const markList = markCols.map(colName => markLine[colName]);

    table.schema = parseSchema(markList, context);
    console.log("table.schema", table.schema);
    table.markList = markList;
    return table
}
