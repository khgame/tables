import { tableConvert } from '../plugin'

export const jsonSerializer = {
  plugins: [tableConvert],
  file: data => `${JSON.stringify(data.convert, null, 2)}`
}
