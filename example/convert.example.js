const {
  readAndTranslate,
  Plugins
} = require('..')

let ret = readAndTranslate(`${__dirname}/nft.building.xlsx`, {
  plugins: [ Plugins.schema, Plugins.convert ]
})
console.log('SCHEMA =>', JSON.stringify(ret.schema, null, 2))
console.log('Convert =>', JSON.stringify(Plugins.convert, null, 2))
//
// ret = readAndTranslate(`${__dirname}/token.point.xlsx`, {
//   plugins: [ Plugins.convert ]
// })
// console.log(JSON.stringify(ret.convert, null, 2))
//
// ret = readAndTranslate(`${__dirname}/token.res.xlsx`, {
//   plugins: [ Plugins.convert ]
// })
// console.log(JSON.stringify(ret.convert, null, 2))
