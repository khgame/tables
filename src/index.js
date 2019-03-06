const { readWorkBook, translateWorkBook, readAndTranslate } = require('./read')
const Plugins = require('./plugin/index')
const Serializer = require('./serializer/index')

module.exports = {
  readWorkBook,
  translateWorkBook,
  readAndTranslate,
  Plugins,
  Serializer
}
