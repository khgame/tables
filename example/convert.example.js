const {
  readAndTranslate,
  Plugins
} = require('..')

let ret = readAndTranslate(`${__dirname}/nft.building.xlsx`, {
  plugins: [ Plugins.convert ]
})
console.log(JSON.stringify(ret, null, 2))
