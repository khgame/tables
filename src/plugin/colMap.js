export function tableColMap(table) {
    const {cols} = table;
    let colMap = {};
    for (let i in cols) {
        colMap[cols[i]] = i
    }
    table.colMap = colMap;
    return table
}
