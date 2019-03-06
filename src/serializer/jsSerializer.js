const Plugins = require('../plugin')

const jsSerializer = {
  plugins: [Plugins.convert],
  file: data => `module.exports = ${JSON.stringify(data.convert, null, 2)}`
}

module.exports = {
  jsSerializer
}
