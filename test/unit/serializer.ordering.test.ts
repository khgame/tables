import { jsonSerializer } from '../../src/serializer/jsonSerializer'
import { jsSerializer } from '../../src/serializer/jsSerializer'

describe('serializer stable ordering', () => {
  const sample = {
    convert: {
      tids: ['b', 'a'],
      result: { b: { id: 2 }, a: { id: 1 } }
    }
  } as any

  function parseJSONFromJSExport(s: string): any {
    return JSON.parse(s.replace(/^module\.exports = /, ''))
  }

  it('jsonSerializer sorts result keys asc', () => {
    const s = jsonSerializer.file(sample, 'x', '')
    const obj = JSON.parse(s)
    expect(Object.keys(obj.result)).toEqual(['a', 'b'])
  })

  it('jsSerializer sorts result keys asc', () => {
    const s = jsSerializer.file(sample, 'x', '')
    const obj = parseJSONFromJSExport(s)
    expect(Object.keys(obj.result)).toEqual(['a', 'b'])
  })
})

