import { tableConvert } from '../plugin'

export const jsSerializer = {
  plugins: [tableConvert],
  file: data => `module.exports = ${JSON.stringify(data.convert, null, 2)}`
}
