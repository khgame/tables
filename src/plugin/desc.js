import {tableMark} from './mark'
import assert from 'assert'
import * as _ from 'lodash'

export function tableDesc(table) {
    if (!table.marks) {
        table = tableMark(table)
    }
    const {data, marks, getValue, cols} = table;
    const markRow = marks.row;
    const markCol = marks.col;
    const markLineData = data[markRow];
    assert(markLineData, 'markLine not exist');
    assert(getValue(table, markRow, markCol) === '@', `mark info error ${markLineData[markCol]}`);

    let markLine = {};
    let markCols = [];
    let descLine = {};
    for (let i in cols) {
        let col = cols[i];

        let markSlot = getValue(table, marks.row, col);
        let descSlot = getValue(table, marks.row + 1, col);
        if (markSlot) {
            markCols.push(col);
            markLine[col] = markSlot.trim();
        }
        if (undefined !== descSlot) descLine[col] = _.toString(descSlot).trim();
    }

    Object.assign(table,
        {
            markCols, // 用到的列
            markLine, // 类型
            descLine // 名称
        }
    );
    return table;
}
