import * as fs from 'fs'
import * as os from 'os'
import * as Path from 'path'
import * as XLSX from 'xlsx'
import { readAndTranslate } from '../../src/utils/read'
import { tableSchema } from '../../src/plugin'
import { dealSchema } from '../../src/serializer/formats/tsInterface'

describe('enum tokens in mark row', () => {
  function render(markToken: string) {
    const dir = fs.mkdtempSync(Path.join(os.tmpdir(), 'tables-enum-'))
    const file = Path.join(dir, 'enum.xlsx')
    try {
      const sheet = XLSX.utils.aoa_to_sheet([
        ['@', markToken],
        ['tid', 'rarity'],
        ['10', 'COMMON']
      ])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, sheet, '__data')
      XLSX.writeFile(wb, file)

      const context = { enums: { Rarity: { COMMON: 1, RARE: 2 } } }
      const table = readAndTranslate(file, { plugins: [tableSchema] }, context)
      return dealSchema(table.schema, table.descLine, table.markCols, context)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  }

  it('enum<EnumName> renders TableContext reference', () => {
    const rendered = render('enum<Rarity>')
    expect(rendered).toContain('rarity: TableContext.Rarity;')
  })

  it('bare tokens stay literal strings', () => {
    const rendered = render('Rarity')
    expect(rendered).toContain('rarity: "Rarity";')
  })
})
