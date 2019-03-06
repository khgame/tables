const {
  dealSchema,
  makeInterfaceName
} = require('./tsInterfaceSerializer')
const Plugins = require('../plugin')

const tsSerializer = {
  plugins: [Plugins.schema, Plugins.convert],
  file: (data, fileName) => {
    // console.log(data.schema)
    let interfaceName = makeInterfaceName(fileName)
    return `export interface ${interfaceName}{
${dealSchema(data.schema)}
}

const data = ${JSON.stringify(data.convert, null, 2)}

export const ${interfaceName.substr(1, 1).toLowerCase() + interfaceName.substr(2)}: { [tid: string] : ${interfaceName} } = data.result ;
`
  }
}

module.exports = {
  tsSerializer
}
