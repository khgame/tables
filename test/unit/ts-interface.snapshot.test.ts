import { readAndTranslate } from '../../src/utils/read'
import { tableSchema, tableConvert } from '../../src/plugin'
import { tsInterfaceSerializer } from '../../src/serializer'
import * as Path from 'path'

describe('ts-interface serializer snapshot (example.xlsx)', () => {
  it('matches interface shape snapshot', () => {
    const excel = Path.resolve(__dirname, '../../example/example.xlsx')
    const data = readAndTranslate(excel, { plugins: [tableSchema, tableConvert] })
    const code = tsInterfaceSerializer.file(data as any, 'example', '//imports', {})
    expect(code).toMatchSnapshot()
  })
})
