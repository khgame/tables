import { culturelize, makeCamelName, makeInterfaceName } from '../../src/utils/names'

describe('utils/names', () => {
  it('culturelize handles empty strings gracefully', () => {
    expect(culturelize('')).toBe('')
  })

  it('culturelize capitalises first letter and lowers rest', () => {
    expect(culturelize('hELLO')).toBe('Hello')
  })

  it('makeCamelName splits on separators', () => {
    expect(makeCamelName('foo_bar-baz.qux')).toBe('FooBarBazQux')
  })

  it('makeInterfaceName prefixes with I', () => {
    expect(makeInterfaceName('sample name')).toBe('ISampleName')
  })
})
