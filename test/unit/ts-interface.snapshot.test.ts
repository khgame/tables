import { readAndTranslate } from '../../src/utils/read'
import { tableSchema, tableConvert } from '../../src/plugin'
import { tsInterfaceSerializer } from '../../src/serializer'
import * as Path from 'path'

describe('ts-interface serializer snapshot (example.xlsx)', () => {
  it('emits interface typedefs and repo helpers', () => {
    const excel = Path.resolve(__dirname, '../../example/example.xlsx')
    const data = readAndTranslate(excel, { plugins: [tableSchema, tableConvert] })
    const code = tsInterfaceSerializer.file(data as any, 'example', '//imports', {})
    expect(code).toContain('export interface IExample')
    expect(code).toContain('export type ExampleTID = TableContext.KHTableID;')
    expect(code).toContain('export const toExampleTID = (value: string): ExampleTID => value as ExampleTID;')
    expect(code).toContain('export class ExampleRepo')
    expect(code).toContain('static fromRaw(data: ExampleRaw): ExampleRepo')
  })
})
