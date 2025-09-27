import { jsonxSerializer } from '../../src/serializer/jsonxSerializer'

describe('jsonxSerializer', () => {
  const sample = { convert: { tids: ['b', 'a'], result: { b: { id: 2 }, a: { id: 1 } }, collisions: [] } } as any
  it('wraps convert with protocol and source, sorts result keys', () => {
    const s = jsonxSerializer.file(sample as any, 'Example', '')
    const obj = JSON.parse(s)
    expect(obj && obj.protocol && obj.protocol.name).toBe('khgame.tables')
    expect(obj && obj.source && obj.source.fileName).toBe('Example')
    expect(Object.keys(obj.convert.result)).toEqual(['a', 'b'])
  })
})

