import { readAndTranslate } from '../../src/utils/read'
import { tableConvert } from '../../src/plugin/convert'
import * as Path from 'path'

describe('convert pipeline (example.xlsx)', () => {
  it('produces tids and result map', () => {
    const excel = Path.resolve(__dirname, '../../example/example.xlsx')
    const ret = readAndTranslate(excel, { plugins: [tableConvert] })
    expect(ret.convert).toBeDefined()
    expect(Object.keys(ret.convert!.result).length).toBeGreaterThan(0)
  })
})

