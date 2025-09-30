import * as Path from 'path'
import * as fs from 'fs-extra'
import * as os from 'os'

jest.mock('../../src/utils/read', () => ({
  readAndTranslate: jest.fn(() => ({
    cols: [],
    data: {},
    getValue: () => undefined
  }))
}))

import { serialize, loadContext, serializeContext } from '../../src/serializer'
import type { Serializer } from '../../src/types'

const { readAndTranslate } = require('../../src/utils/read') as { readAndTranslate: jest.Mock }

function makeTempDir(): string {
  return fs.mkdtempSync(Path.join(os.tmpdir(), 'tables-serializer-'))
}

describe('serializer core helpers', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = makeTempDir()
    readAndTranslate.mockClear()
  })

  afterEach(() => {
    fs.removeSync(tmpDir)
  })

  it('serialize delegates to readAndTranslate and writes files', () => {
    const tableStub = { cols: [], data: {}, getValue: () => undefined }
    readAndTranslate.mockReturnValueOnce(tableStub)

    const plugin = jest.fn((table: any) => table)
    const fileWriter = jest.fn(() => 'serialized-content')
    const serializer: Serializer = {
      plugins: [plugin],
      file: fileWriter
    }

    const output = Path.join(tmpDir, 'out')
    serialize(Path.join(tmpDir, 'dummy.xlsx'), output, { 'result.json': serializer }, { ctx: true } as any)

    expect(readAndTranslate).toHaveBeenCalledTimes(1)
    const [, optionsArg, contextArg] = readAndTranslate.mock.calls[0]
    expect(Array.isArray(optionsArg.plugins)).toBe(true)
    expect(optionsArg.plugins).toHaveLength(1)
    expect(optionsArg.plugins[0]).toBe(plugin)
    expect(contextArg).toEqual({ ctx: true })
    expect(fileWriter).toHaveBeenCalledWith(tableStub, 'dummy', expect.any(String), { ctx: true })

    const written = fs.readFileSync(Path.join(output, 'result.json'), 'utf8')
    expect(written).toBe('serialized-content')
  })

  it('loadContext merges blobs from context json files', () => {
    const ctxDir = Path.join(tmpDir, 'ctx')
    fs.ensureDirSync(ctxDir)
    fs.writeJsonSync(Path.join(ctxDir, 'context.enums.json'), { Colors: { Red: 1 } })
    fs.writeJsonSync(Path.join(ctxDir, 'context.enums.roles.json'), { Roles: { Tank: 2 } })

    const context = loadContext(ctxDir)
    expect(context.enums).toBeDefined()
    expect(context.enums.Colors).toEqual({ Red: 1 })
    expect(context.enums.Roles).toEqual({ Tank: 2 })
  })

  it('serializeContext writes combined context dealers', () => {
    const ctxOut = Path.join(tmpDir, 'ctx-out')
    fs.ensureDirSync(ctxOut)
    const dealer = jest.fn(() => 'export const stub = 42;')
    const serializerWithContext: Serializer = {
      file: jest.fn(() => ''),
      contextDealer: dealer
    }

    serializeContext(ctxOut, [serializerWithContext], { any: 'thing' })
    expect(dealer).toHaveBeenCalledWith({ any: 'thing' })
    const contextTs = fs.readFileSync(Path.join(ctxOut, 'context.ts'), 'utf8')
    expect(contextTs).toContain('TABLE_CONTEXT_VERSION')
    expect(contextTs).toContain('export const stub = 42;')
  })
})
