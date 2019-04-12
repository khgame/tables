const {
  readAndTranslate,
  tableConvert
} = require('..')

const fs = require('fs-extra')

let ret = readAndTranslate(`${__dirname}/excel/missionTask.xlsx`, {
  plugins: [tableConvert]
})
console.log(JSON.stringify(ret))

fs.writeJsonSync(`${__dirname}/sss.json`, ret)
