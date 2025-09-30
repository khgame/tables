import { readAndTranslate } from '../../src/utils/read'
import { tableSchema, tableConvert } from '../../src/plugin'
import { csharpSerializer } from '../../src/serializer'
import * as Path from 'path'

describe('csharp serializer snapshot (example.xlsx)', () => {
  it('matches C# class snapshot', () => {
    const excel = Path.resolve(__dirname, '../../example/example.xlsx')
    const data = readAndTranslate(excel, { plugins: [tableSchema, tableConvert] })
    const code = csharpSerializer.file(data as any, 'example', '', {})
    expect(code).toMatchSnapshot()
  })
})
