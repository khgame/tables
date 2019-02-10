const {
  readAndTranslate,
  Plugins
} = require('..')

let ret = readAndTranslate(`${__dirname}/../excel/nft.building.xlsx`, {
  plugins: [ Plugins.expand, Plugins.desc ]
})
console.dir(ret)
