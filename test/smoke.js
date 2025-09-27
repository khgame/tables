/* Minimal smoke test: ensures build + convert work on example file */
const path = require('path')
const fs = require('fs')

const lib = require('../lib')

const excel = path.resolve(__dirname, '../example/example.xlsx')
const outDir = path.resolve(__dirname, './tmp-smoke-out')

fs.mkdirSync(outDir, { recursive: true })

const ret = lib.serialize ? null : null

const { readAndTranslate } = lib
const { tableConvert } = lib

const table = readAndTranslate(excel, { plugins: [tableConvert] })
if (!table.convert || !table.convert.result) {
  console.error('convert missing in result')
  process.exit(1)
}
console.log('smoke convert ok, tids:', Object.keys(table.convert.result).length)

