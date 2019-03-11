const {
  readAndTranslate,
  tableConvert
} = require('..')

let ret
// ret = readAndTranslate(`${__dirname}/global_config.xlsx`, {
//   plugins: [Plugins.schema, Plugins.convert]
// })
// console.log('SCHEMA =>', JSON.stringify(ret.schema, null, 2))
// console.log('Convert =>', JSON.stringify(ret.convert, null, 2))

ret = readAndTranslate(`${__dirname}/nft.building.xlsx`, {
  plugins: [ tableConvert ]
})
console.log('Cols =>', JSON.stringify(ret.cols, null, 2))
console.log('SCHEMA =>', JSON.stringify(ret.schema.toSchemaJson(), null, 2))
console.log('Convert =>', JSON.stringify(ret.convert, null, 2))

// ret = readAndTranslate(`${__dirname}/token.point.xlsx`, {
//   plugins: [ Plugins.convert ]
// })
// console.log(JSON.stringify(ret.convert, null, 2))
//
// ret = readAndTranslate(`${__dirname}/token.res.xlsx`, {
//   plugins: [ Plugins.convert ]
// })
// console.log(JSON.stringify(ret.convert, null, 2))
