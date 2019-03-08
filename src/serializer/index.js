const {
  readAndTranslate
} = require('../utils/read')
const Path = require('path')
const fs = require('fs-extra')

/**
 * serialize files with selected serializers
 * @param {string} pathIn - input file path
 * @param {string} dirOut - output dir
 * @param {Object.<string,Serializer>} serializers
 */
function serialize (pathIn, dirOut, serializers) {
  let plugins = Object.values(serializers).reduce((prev, cur) => prev.concat(cur.plugins), [])
  // console.log('plugins', plugins)
  // console.dir(Object.values(serializers))
  let ret = readAndTranslate(pathIn, {
    plugins
  })
  for (let outName in serializers) {
    let fileContent = serializers[outName].file(ret, Path.parse(pathIn).name)
    fs.outputFileSync(Path.resolve(dirOut, outName), fileContent)
  }
}

module.exports = {
  serialize,
  jsonSerializer: require('./jsonSerializer').jsonSerializer,
  jsSerializer: require('./jsSerializer').jsSerializer,
  tsSerializer: require('./tsSerializer').tsSerializer,
  tsInterfaceSerializer: require('./tsInterfaceSerializer').tsInterfaceSerializer
}
