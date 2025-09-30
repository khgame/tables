import { readAndTranslate } from '../../src/utils/read'
import { tableSchema, tableConvert } from '../../src/plugin'
import { goSerializer } from '../../src/serializer'
import * as Path from 'path'

describe('go serializer snapshot (example.xlsx)', () => {
  it('matches Go struct snapshot', () => {
    const excel = Path.resolve(__dirname, '../../example/example.xlsx')
    const data = readAndTranslate(excel, { plugins: [tableSchema, tableConvert] })
    const code = goSerializer.file(data as any, 'example', '', {})
    expect(code).toMatchSnapshot()
  })
})
