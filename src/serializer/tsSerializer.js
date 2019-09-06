import { tableConvert, tableSchema } from '../plugin'

import { dealSchema, dealContext } from './tsInterfaceSerializer'

import { makeInterfaceName } from '../utils/names'

export const tsSerializer = {
    plugins: [tableSchema, tableConvert],
    file: (data, fileName, imports, context) => {
    // console.log(data.schema)
        let interfaceName = makeInterfaceName(fileName)
        return `/** this file is auto generated */
${imports}
        
export interface ${interfaceName} ${dealSchema(data.schema, data.descLine, data.markCols, context)}

const data = ${JSON.stringify(data.convert, null, 2)}

export const ${interfaceName.substr(1, 1).toLowerCase() + interfaceName.substr(2)}: { [tid: string] : ${interfaceName} } = data.result as any ;
`
    },
    contextDealer: dealContext
}
