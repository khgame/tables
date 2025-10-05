import { readAndTranslate } from '../../src/utils/read'
import { tableConvert } from '../../src/plugin/convert'
import { tsSerializer, tsInterfaceSerializer } from '../../src/serializer'
import * as Path from 'path'

describe('alias-aware serializers', () => {
  it('emits protocol constants and repo helpers in the type definition', () => {
    const csv = Path.resolve(__dirname, '../excel/alias.csv')
    const table = readAndTranslate(csv, { plugins: [tableConvert] })
    const typings = tsInterfaceSerializer.file(table as any, 'alias', '', {})
    expect(typings).toContain('export const AliasProtocol = [')
    expect(typings).toContain('export type AliasProtocol = typeof AliasProtocol[number];')
    expect(typings).toContain('export class AliasRepo')
    expect(typings).toContain('static fromRaw(data: AliasRaw): AliasRepo')
  })

  it('re-exports protocol and instantiates repo in the solution file', () => {
    const csv = Path.resolve(__dirname, '../excel/alias.csv')
    const table = readAndTranslate(csv, { plugins: [tableConvert] })
    const solution = tsSerializer.file(table as any, 'alias', '', {})
    expect(solution).toContain('import { IAlias, AliasTID, toAliasTID, AliasProtocol, AliasRepo } from "./alias";')
    expect(solution).toContain('export { AliasProtocol } from "./alias";')
    expect(solution).toContain('export const aliasRepo = AliasRepo.fromRaw(raw);')
  })
})
