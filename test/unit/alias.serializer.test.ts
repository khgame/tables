import { readAndTranslate } from '../../src/utils/read'
import { tableConvert } from '../../src/plugin/convert'
import { tsSerializer } from '../../src/serializer'
import * as Path from 'path'

describe('ts serializer alias helpers', () => {
  it('emits protocol helpers for alias columns', () => {
    const csv = Path.resolve(__dirname, '../excel/alias.csv')
    const table = readAndTranslate(csv, { plugins: [tableConvert] })
    const output = tsSerializer.file(table as any, 'alias', '', {})
    expect(output).toContain('export const AliasProtocol = [')
    expect(output).toContain(`export type AliasProtocol = typeof AliasProtocol[number];`)
    expect(output).toContain('const aliasByProtocol = Object.fromEntries(')
    expect(output).toContain('export const getAliasByProtocol = (alias: AliasProtocol): IAlias =>')
  })
})
