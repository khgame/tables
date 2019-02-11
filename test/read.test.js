const {
  readAndTranslate,
  Plugins
} = require('..')

let ret = readAndTranslate(`${__dirname}/../excel/nft.building.xlsx`, {
  plugins: [ Plugins.convert ]
})
console.log(JSON.stringify(ret.convert, null, 2))
