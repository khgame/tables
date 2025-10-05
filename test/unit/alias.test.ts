import { readAndTranslate } from '../../src/utils/read'
import { tableConvert } from '../../src/plugin/convert'
import * as Path from 'path'

describe('alias column support', () => {
  const csv = Path.resolve(__dirname, '../excel/alias.csv')

  it('builds alias map and index', () => {
    const table = readAndTranslate(csv, { plugins: [tableConvert] })
    const convert = table.convert
    expect(convert).toBeDefined()
    expect(convert?.aliases).toBeDefined()

    const aliasEntry = convert?.aliases?.nameAlias
    expect(aliasEntry).toBeDefined()
    expect(aliasEntry?.map.school).toBe('500001')
    expect(aliasEntry?.map.hospital).toBe('500002')
    expect(aliasEntry?.map).not.toHaveProperty('')

    expect(convert?.indexes?.nameAlias).toBeDefined()
    expect(convert?.indexes?.nameAlias?.school).toBe('500001')
    expect(convert?.indexes?.nameAlias?.hospital).toBe('500002')

    expect(convert?.meta?.alias).toMatchObject({
      field: 'nameAlias',
      values: ['hospital', 'school']
    })
  })

  it('throws when alias values collide', () => {
    const duplicated = Path.resolve(__dirname, '../excel/alias_duplicate.csv')
    expect(() => readAndTranslate(duplicated, { plugins: [tableConvert] })).toThrow(/存在重复别名/)
  })
})
