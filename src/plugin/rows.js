/**
 * get all available row indexes of table
 * @param table
 * @return {*}
 */
export function tableRows (table) {
    const {data} = table;
    let rows = Object.keys(data).map(ind => parseInt(ind)).sort((a, b) => a - b);
    Object.assign(table, {rows});
    return table
}
