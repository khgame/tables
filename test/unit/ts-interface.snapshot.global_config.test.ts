import { readAndTranslate } from '../../src/utils/read'
import { tableSchema, tableConvert } from '../../src/plugin'
import { tsInterfaceSerializer } from '../../src/serializer'
import * as Path from 'path'

describe('ts-interface snapshot (global_config.xlsx)', () => {
  it('emits repo helpers for global_config table', () => {
    const excel = Path.resolve(__dirname, '../../example/global_config.xlsx')
    const data = readAndTranslate(excel, { plugins: [tableSchema, tableConvert] })
    const code = tsInterfaceSerializer.file(data as any, 'global_config', '//imports', {})
    expect(code).toContain('export interface IGlobalConfig')
    expect(code).toContain('export class GlobalConfigRepo')
    expect(code).toContain('static fromRaw(data: GlobalConfigRaw): GlobalConfigRepo')
  })
})
