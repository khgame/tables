const Plugins = require('../plugin')

const jsonSerializer = {
  plugins: [Plugins.convert],
  file: data => `${module.exports = JSON.stringify(data.convert, null, 2)}`
}

module.exports = {
  jsonSerializer
}
