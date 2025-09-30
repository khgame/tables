import { dealSchema } from '../../src/serializer'
import { MarkType, SDMType, SupportedTypes } from '@khgame/schema'

function tdmOf(name: string, tNode: any) {
  return {
    markType: MarkType.TDM,
    markInd: 0,
    innerCount: 1,
    inner: (_i: number) => tNode
  }
}

describe('tsInterfaceSerializer.dealSchema type mapping', () => {
  it('maps primitives and arrays (non-strict vs strict)', () => {
    const tString = { tName: SupportedTypes.String, rawName: 'string' }
    const tNumber = { tName: SupportedTypes.Int, rawName: 'int' }

    // Non-strict array of string => string[]
    const sdmArrNonStrict = {
      sdmType: SDMType.Arr,
      marks: [tdmOf('v', tString)],
      mds: [],
      markInd: 1
    }
    const descLine = { A: 'v' }
    const markCols = ['A']
    const r1 = dealSchema(sdmArrNonStrict as any, descLine, markCols, {})
    expect(r1.replace(/\s/g, '')).toBe('string[]'.replace(/\s/g, ''))

    // Non-strict array with union => Array<string|number>
    const tdmStr = tdmOf('v', tString)
    const tdmNum = tdmOf('v', tNumber)
    const sdmArrUnion = {
      sdmType: SDMType.Arr,
      marks: [
        tdmStr,
        tdmNum
      ],
      mds: [],
      markInd: 1
    }
    const r2 = dealSchema(sdmArrUnion as any, descLine, markCols, {})
    expect(r2).toContain('Array<string|number>')

    // Strict array => tuple-like string with brackets
    const sdmArrStrict = { ...sdmArrUnion, mds: ['$strict'] }
    const r3 = dealSchema(sdmArrStrict as any, descLine, markCols, {})
    expect(r3).toMatch(/\[(.|\n)*\]/)
  })

  it('maps object with ghost (optional) and enum via context', () => {
    const tEnum = { tName: SupportedTypes.Enum, rawName: 'Enum', tSeg: { nodes: [{ rawName: 'Colors' }] } }
    const tBool = { tName: SupportedTypes.Boolean, rawName: 'bool' }

    const sdmObj = {
      sdmType: SDMType.Obj,
      marks: [
        { markType: MarkType.TDM, markInd: 0, innerCount: 1, inner: () => tEnum },
        { markType: MarkType.TDM, markInd: 1, innerCount: 1, inner: () => tBool }
      ],
      mds: ['$ghost'],
      markInd: 1
    }
    const descLine = { A: 'color', B: 'flag' }
    const markCols = ['A', 'B']
    const ctx = { enums: { Colors: { Red: 1 } } }
    const r = dealSchema(sdmObj as any, descLine, markCols, ctx)
    expect(r).toContain('color: TableContext.Colors')
    expect(r).toContain('flag: boolean')
    expect(r).toContain('|undefined')
  })
})
