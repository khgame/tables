import { readAndTranslate } from '../../src/utils/read'
import { tableConvert } from '../../src/plugin/convert'
import { tsSerializer } from '../../src/serializer'
import * as Path from 'path'

describe('ts serializer alias helpers', () => {
  it('emits protocol constants and repo helpers for alias columns', () => {
    const csv = Path.resolve(__dirname, '../excel/alias.csv')
    const table = readAndTranslate(csv, { plugins: [tableConvert] })
    const output = tsSerializer.file(table as any, 'alias', '', {})
    expect(output).toContain('export const AliasProtocol = [')
    expect(output).toContain('export type AliasProtocol = typeof AliasProtocol[number];')
    expect(output).toContain('export class AliasRepo')
    expect(output).toContain('getByNameAlias(key: AliasProtocol)')
    expect(output).toContain('return this.get(toAliasTID(tid as string))')
  })
})
