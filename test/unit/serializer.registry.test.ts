import {
  registerSerializerFormat,
  getSerializerFormat,
  listSerializerFormats,
  removeSerializerFormat
} from '../../src/serializer'
import type { Serializer } from '../../src/types'

const dummySerializer: Serializer = {
  file: () => '',
  plugins: []
}

describe('serializer format registry', () => {
  const formatName = 'custom-test'

  afterEach(() => {
    removeSerializerFormat(formatName)
  })

  it('registers and retrieves custom formats', () => {
    registerSerializerFormat(formatName, { suffix: 'txt', serializer: dummySerializer })
    const entry = getSerializerFormat(formatName)
    expect(entry).toBeDefined()
    expect(entry?.suffix).toBe('txt')
    expect(listSerializerFormats()).toEqual(expect.arrayContaining([formatName, 'json']))
  })

  it('prevents conflicting registrations without override', () => {
    registerSerializerFormat(formatName, { suffix: 'a', serializer: dummySerializer })
    expect(() =>
      registerSerializerFormat(formatName, { suffix: 'b', serializer: dummySerializer })
    ).toThrow(/already registered/i)
  })

  it('allows overriding existing registrations when requested', () => {
    registerSerializerFormat(formatName, { suffix: 'a', serializer: dummySerializer })
    registerSerializerFormat(formatName, { suffix: 'b', serializer: dummySerializer }, { override: true })
    const entry = getSerializerFormat(formatName)
    expect(entry?.suffix).toBe('b')
  })
})
