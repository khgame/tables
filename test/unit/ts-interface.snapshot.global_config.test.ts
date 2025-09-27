import { readAndTranslate } from '../../src/utils/read'
import { tableSchema, tableConvert } from '../../src/plugin'
import { tsInterfaceSerializer } from '../../src/serializer/tsInterfaceSerializer'
import * as Path from 'path'

describe('ts-interface snapshot (global_config.xlsx)', () => {
  it('matches snapshot', () => {
    const excel = Path.resolve(__dirname, '../../example/global_config.xlsx')
    const data = readAndTranslate(excel, { plugins: [tableSchema, tableConvert] })
    const code = tsInterfaceSerializer.file(data as any, 'global_config', '//imports', {})
    expect(code).toMatchSnapshot()
  })
})

