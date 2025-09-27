import { readAndTranslate } from '../../src/utils/read'
import { tableSchema, tableConvert } from '../../src/plugin'
import { tsInterfaceSerializer } from '../../src/serializer/tsInterfaceSerializer'
import * as Path from 'path'

describe('ts-interface snapshot (hero_advance.xlsx)', () => {
  it('matches snapshot', () => {
    const excel = Path.resolve(__dirname, '../../example/hero_advance.xlsx')
    const data = readAndTranslate(excel, { plugins: [tableSchema, tableConvert] })
    const code = tsInterfaceSerializer.file(data as any, 'hero_advance', '//imports', {})
    expect(code).toMatchSnapshot()
  })
})

