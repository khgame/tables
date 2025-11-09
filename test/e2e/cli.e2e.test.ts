import * as cp from 'child_process'
import * as fs from 'fs-extra'
import * as Path from 'path'

const nodeBin = process.execPath

function runCli(args: string[], cwd: string): { code: number; stdout: string; stderr: string } {
  const ret = cp.spawnSync(nodeBin, ['lib/exec.js', ...args], { cwd, encoding: 'utf8' })
  return { code: ret.status ?? 0, stdout: ret.stdout || '', stderr: ret.stderr || '' }
}

function writeCsv(file: string, rows: string[][]): void {
  fs.outputFileSync(file, rows.map(row => row.join(',')).join('\n'))
}

describe('CLI (tables)', () => {
  const repoRoot = Path.resolve(__dirname, '../../')
  const tmp = Path.resolve(repoRoot, 'test/tmp-cli')

  beforeAll(() => {
    fs.removeSync(tmp)
    fs.ensureDirSync(tmp)
  })

  afterAll(() => {
    fs.removeSync(tmp)
  })

  it('generates JSON from a single file', () => {
    const excel = Path.resolve(repoRoot, 'example/example.xlsx')
    const res = runCli(['-i', excel, '-o', tmp, '-f', 'json', '--silent'], repoRoot)
    expect(res.code).toBe(0)
    const out = Path.resolve(tmp, 'Example.json')
    expect(fs.existsSync(out)).toBe(true)
    const json = fs.readJsonSync(out)
    expect(json && json.result && Object.keys(json.result).length).toBeGreaterThan(0)
  })

  it('generates JS for a directory input', () => {
    const res = runCli(['-i', 'example', '-o', tmp, '-f', 'js', '--silent'], repoRoot)
    expect(res.code).toBe(0)
    // should include at least one file like Example.js
    const files = fs.readdirSync(tmp)
    expect(files.some(f => f.toLowerCase().endsWith('.js'))).toBe(true)
  })

  it('loads context json files by default for directory input', () => {
    const input = Path.resolve(tmp, 'context-dir-input')
    const out = Path.resolve(tmp, 'context-dir-out')
    fs.removeSync(input)
    fs.removeSync(out)
    fs.ensureDirSync(input)
    fs.writeJsonSync(Path.join(input, 'context.enums.json'), {
      Rarity: {
        Common: 1,
        Rare: 2
      }
    })
    writeCsv(Path.join(input, 'items.csv'), [
      ['@', 'enum<Rarity>'],
      ['id', 'rarity'],
      ['item_001', 'Rare']
    ])

    const res = runCli(['-i', input, '-o', out, '-f', 'ts-interface', '--silent'], repoRoot)
    expect(res.code).toBe(0)
    const generated = fs.readFileSync(Path.join(out, 'Items.ts'), 'utf8')
    expect(generated).toContain('rarity: TableContext.Rarity')
  })

  it('loads explicit --context for single file input', () => {
    const input = Path.resolve(tmp, 'context-file-input')
    const ctx = Path.resolve(tmp, 'context-file-ctx')
    const out = Path.resolve(tmp, 'context-file-out')
    fs.removeSync(input)
    fs.removeSync(ctx)
    fs.removeSync(out)
    fs.ensureDirSync(input)
    fs.ensureDirSync(ctx)
    fs.writeJsonSync(Path.join(ctx, 'context.enums.json'), {
      Rarity: {
        Common: 1,
        Rare: 2
      }
    })
    writeCsv(Path.join(input, 'items.csv'), [
      ['@', 'enum<Rarity>'],
      ['id', 'rarity'],
      ['item_001', 'Rare']
    ])

    const res = runCli(['-i', Path.join(input, 'items.csv'), '-o', out, '-f', 'ts-interface', '--silent', '--context', ctx], repoRoot)
    expect(res.code).toBe(0)
    const generated = fs.readFileSync(Path.join(out, 'Items.ts'), 'utf8')
    expect(generated).toContain('rarity: TableContext.Rarity')
  })

  it('loads explicit --context from a context json file', () => {
    const input = Path.resolve(tmp, 'context-json-file-input')
    const out = Path.resolve(tmp, 'context-json-file-out')
    fs.removeSync(input)
    fs.removeSync(out)
    fs.ensureDirSync(input)
    const contextFile = Path.join(input, 'context.enums.json')
    fs.writeJsonSync(contextFile, {
      Rarity: {
        Common: 1,
        Rare: 2
      }
    })
    writeCsv(Path.join(input, 'items.csv'), [
      ['@', 'enum<Rarity>'],
      ['id', 'rarity'],
      ['item_001', 'Rare']
    ])

    const res = runCli(['-i', Path.join(input, 'items.csv'), '-o', out, '-f', 'ts-interface', '--silent', '--context', contextFile], repoRoot)
    expect(res.code).toBe(0)
    const generated = fs.readFileSync(Path.join(out, 'Items.ts'), 'utf8')
    expect(generated).toContain('rarity: TableContext.Rarity')
  })

  it('prints inspect diagnostics for a single input file', () => {
    const input = Path.resolve(tmp, 'inspect-input')
    fs.removeSync(input)
    fs.ensureDirSync(input)
    const csv = Path.join(input, 'items.csv')
    writeCsv(csv, [
      ['@', 'string'],
      ['id', 'name'],
      ['item_001', 'Potion']
    ])

    const res = runCli(['-i', csv, '--inspect'], repoRoot)
    expect(res.code).toBe(0)
    const diagnostics = JSON.parse(res.stdout)
    expect(diagnostics).toMatchObject({
      fileName: 'items',
      sheetName: 'Sheet1',
      marks: { row: 1, col: 'A' },
      markCols: ['A', 'B'],
      convert: {
        present: true,
        tidCount: 1,
        resultCount: 1
      }
    })
  })

  it('keeps inspect stdout parseable with verbose context loading', () => {
    const input = Path.resolve(tmp, 'inspect-verbose-input')
    const ctx = Path.resolve(tmp, 'inspect-verbose-ctx')
    fs.removeSync(input)
    fs.removeSync(ctx)
    fs.ensureDirSync(input)
    fs.ensureDirSync(ctx)
    const csv = Path.join(input, 'items.csv')
    writeCsv(csv, [
      ['@', 'enum<Rarity>'],
      ['id', 'rarity'],
      ['item_001', 'Rare']
    ])
    fs.writeJsonSync(Path.join(ctx, 'context.enums.json'), {
      Rarity: {
        Common: 1,
        Rare: 2
      }
    })

    const res = runCli(['-i', csv, '--inspect', '--verbose', '--context', ctx], repoRoot)
    expect(res.code).toBe(0)
    const diagnostics = JSON.parse(res.stdout)
    expect(diagnostics.convert.present).toBe(true)
    expect(diagnostics.convert.tidCount).toBe(1)
    expect(res.stderr).toContain('context loaded:')
  })

  it('prints validation JSON for a single input file', () => {
    const input = Path.resolve(tmp, 'validate-input')
    fs.removeSync(input)
    fs.ensureDirSync(input)
    const csv = Path.join(input, 'items.csv')
    writeCsv(csv, [
      ['@', 'string'],
      ['id', 'name'],
      ['item_001', 'Potion']
    ])

    const res = runCli(['-i', csv, '--validate', '--json'], repoRoot)
    expect(res.code).toBe(0)
    const result = JSON.parse(res.stdout)
    expect(result).toMatchObject({
      success: true,
      fileName: 'items',
      sheetName: 'Sheet1',
      errors: [],
      warnings: [],
      diagnostics: {
        convert: {
          present: true,
          tidCount: 1,
          resultCount: 1
        }
      }
    })
  })

  it('keeps validation JSON mode parseable with verbose context loading', () => {
    const input = Path.resolve(tmp, 'validate-verbose-input')
    const ctx = Path.resolve(tmp, 'validate-verbose-ctx')
    fs.removeSync(input)
    fs.removeSync(ctx)
    fs.ensureDirSync(input)
    fs.ensureDirSync(ctx)
    const csv = Path.join(input, 'items.csv')
    writeCsv(csv, [
      ['@', 'enum<Rarity>'],
      ['id', 'rarity'],
      ['item_001', 'Rare']
    ])
    fs.writeJsonSync(Path.join(ctx, 'context.enums.json'), {
      Rarity: {
        Common: 1,
        Rare: 2
      }
    })

    const res = runCli(['-i', csv, '--validate', '--json', '--verbose', '--context', ctx], repoRoot)
    expect(res.code).toBe(0)
    const result = JSON.parse(res.stdout)
    expect(result.success).toBe(true)
    expect(result.diagnostics.convert.tidCount).toBe(1)
    expect(res.stderr).not.toContain('context loaded:')
  })

  it('reports duplicate TID as validation JSON tid_collision', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const XLSX = require('xlsx')
    const aoa = [
      ['@', 'string'],
      ['id', 'name'],
      ['001', 'foo'],
      ['001', 'bar']
    ]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '__data')
    const excel = Path.resolve(tmp, 'validate-dup.xlsx')
    XLSX.writeFile(wb, excel)

    const res = runCli(['-i', excel, '--validate', '--json'], repoRoot)
    expect(res.code).not.toBe(0)
    const result = JSON.parse(res.stdout)
    expect(result.success).toBe(false)
    expect(result.errors).toEqual([expect.objectContaining({
      code: 'tid_collision',
      diagnosticPath: 'convert.error',
      location: { sheetName: '__data' },
      details: expect.objectContaining({
        tid: '001',
        policyPath: 'context.policy.tidConflict',
        allowedPolicies: ['overwrite', 'ignore', 'merge']
      })
    })])
  })

  it('prints validation JSON when the input path is missing', () => {
    const missing = Path.resolve(tmp, 'missing.csv')
    fs.removeSync(missing)

    const res = runCli(['-i', missing, '--validate', '--json'], repoRoot)
    expect(res.code).not.toBe(0)
    expect(res.stderr).toBe('')
    expect(res.stdout).not.toContain(repoRoot)
    const result = JSON.parse(res.stdout)
    expect(result).toMatchObject({
      success: false,
      fileName: 'missing',
      errors: [{
        severity: 'error',
        code: 'invalid_input'
      }],
      warnings: []
    })
  })

  it('sanitizes context resolver paths in validation JSON preflight errors', () => {
    const input = Path.resolve(tmp, 'validate-context-path-input')
    const ctx = Path.resolve(tmp, 'validate-context-path-ctx')
    fs.removeSync(input)
    fs.removeSync(ctx)
    fs.ensureDirSync(input)
    fs.ensureDirSync(ctx)
    const csv = Path.join(input, 'items.csv')
    writeCsv(csv, [
      ['@', 'enum<Rarity>'],
      ['id', 'rarity'],
      ['item_001', 'Rare']
    ])
    const contextFile = Path.join(ctx, 'context.enums.json')
    fs.writeJsonSync(contextFile, {
      Rarity: {
        __refs: [{ ref: 'missing_table.csv#alias' }]
      }
    })

    const res = runCli(['-i', csv, '--validate', '--json', '--context', contextFile], repoRoot)
    expect(res.code).not.toBe(0)
    expect(res.stderr).toBe('')
    expect(res.stdout).not.toContain(repoRoot)
    expect(res.stdout).not.toContain(ctx)
    expect(res.stdout).not.toContain(contextFile)
    const result = JSON.parse(res.stdout)
    expect(result).toMatchObject({
      success: false,
      fileName: 'items',
      errors: [{
        severity: 'error',
        code: 'context_ref_error',
        diagnosticPath: 'context.enums.Rarity.__refs[0]',
        details: {
          enumName: 'Rarity',
          table: 'missing_table.csv',
          field: 'alias'
        }
      }],
      warnings: []
    })
  })

  it('reports non-alias context refs as validation JSON', () => {
    const input = Path.resolve(tmp, 'validate-context-non-alias-input')
    const ctx = Path.resolve(tmp, 'validate-context-non-alias-ctx')
    fs.removeSync(input)
    fs.removeSync(ctx)
    fs.ensureDirSync(input)
    fs.ensureDirSync(ctx)
    writeCsv(Path.join(input, 'items.csv'), [
      ['@', 'enum<Rarity>'],
      ['id', 'rarity'],
      ['item_001', 'Rare']
    ])
    writeCsv(Path.join(ctx, 'labels.csv'), [
      ['@', 'string'],
      ['id', 'label'],
      ['rare', 'Rare']
    ])
    fs.writeJsonSync(Path.join(ctx, 'context.enums.json'), {
      Rarity: [
        { ref: { table: 'labels.csv', field: 'label' } }
      ]
    })

    const res = runCli(['-i', Path.join(input, 'items.csv'), '--validate', '--json', '--context', ctx], repoRoot)
    expect(res.code).not.toBe(0)
    expect(res.stderr).toBe('')
    expect(res.stdout).not.toContain(repoRoot)
    expect(res.stdout).not.toContain(ctx)
    const result = JSON.parse(res.stdout)
    expect(result).toMatchObject({
      success: false,
      fileName: 'items',
      errors: [{
        severity: 'error',
        code: 'context_ref_error',
        diagnosticPath: 'context.enums.Rarity[0]',
        details: {
          enumName: 'Rarity',
          table: 'labels.csv',
          field: 'label',
          expected: 'alias_column'
        }
      }],
      warnings: []
    })
  })

  it('does not validate context refs in inspect mode', () => {
    const input = Path.resolve(tmp, 'inspect-context-ref-input')
    const ctx = Path.resolve(tmp, 'inspect-context-ref-ctx')
    fs.removeSync(input)
    fs.removeSync(ctx)
    fs.ensureDirSync(input)
    fs.ensureDirSync(ctx)
    writeCsv(Path.join(input, 'items.csv'), [
      ['@', 'string'],
      ['id', 'name'],
      ['item_001', 'Potion']
    ])
    fs.writeJsonSync(Path.join(ctx, 'context.enums.json'), {
      Rarity: [
        { ref: { table: 'missing_table.csv', field: 'alias' } }
      ]
    })

    const res = runCli(['-i', Path.join(input, 'items.csv'), '--inspect', '--json', '--context', ctx], repoRoot)
    expect(res.code).toBe(0)
    const diagnostics = JSON.parse(res.stdout)
    expect(diagnostics.convert.present).toBe(true)
    expect(diagnostics.convert.tidCount).toBe(1)
  })

  it('sanitizes absolute table refs in validation JSON details', () => {
    const input = Path.resolve(tmp, 'validate-absolute-ref-input')
    const ctx = Path.resolve(tmp, 'validate-absolute-ref-ctx')
    const missing = Path.join(ctx, 'missing_abs.csv')
    fs.removeSync(input)
    fs.removeSync(ctx)
    fs.ensureDirSync(input)
    fs.ensureDirSync(ctx)
    writeCsv(Path.join(input, 'items.csv'), [
      ['@', 'enum<Rarity>'],
      ['id', 'rarity'],
      ['item_001', 'Rare']
    ])
    fs.writeJsonSync(Path.join(ctx, 'context.enums.json'), {
      Rarity: [
        { ref: { table: missing, field: 'alias' } }
      ]
    })

    const res = runCli(['-i', Path.join(input, 'items.csv'), '--validate', '--json', '--context', ctx], repoRoot)
    expect(res.code).not.toBe(0)
    expect(res.stderr).toBe('')
    expect(res.stdout).not.toContain(repoRoot)
    expect(res.stdout).not.toContain(ctx)
    expect(res.stdout).not.toContain(missing)
    const result = JSON.parse(res.stdout)
    expect(result.errors[0]).toMatchObject({
      severity: 'error',
      code: 'context_ref_error',
      details: {
        enumName: 'Rarity',
        table: 'missing_abs.csv',
        field: 'alias'
      }
    })
  })

  it('suppresses verbose console warnings in validation JSON mode', () => {
    const input = Path.resolve(tmp, 'validate-json-warn-input')
    const ctx = Path.resolve(tmp, 'validate-json-warn-ctx')
    fs.removeSync(input)
    fs.removeSync(ctx)
    fs.ensureDirSync(input)
    fs.ensureDirSync(ctx)
    const csv = Path.join(input, 'items.csv')
    writeCsv(csv, [
      ['@', 'string'],
      ['id', 'name'],
      ['001', 'first'],
      ['001', 'second']
    ])
    fs.writeJsonSync(Path.join(ctx, 'context.policy.json'), {
      tidConflict: 'ignore'
    })

    const res = runCli(['-i', csv, '--validate', '--json', '--verbose', '--context', ctx], repoRoot)
    expect(res.code).not.toBe(0)
    expect(res.stderr).toBe('')
    const result = JSON.parse(res.stdout)
    expect(result.success).toBe(false)
    expect(result.diagnostics.convert.collisionCount).toBe(1)
  })

  it('classifies schema parse failures as validation schema_error', () => {
    const input = Path.resolve(tmp, 'validate-schema-error-input')
    fs.removeSync(input)
    fs.ensureDirSync(input)
    const csv = Path.join(input, 'broken.csv')
    writeCsv(csv, [
      ['@', 'bad<bad'],
      ['id', 'value'],
      ['001', 'x']
    ])

    const res = runCli(['-i', csv, '--validate', '--json'], repoRoot)
    expect(res.code).not.toBe(0)
    const result = JSON.parse(res.stdout)
    expect(result).toMatchObject({
      success: false,
      fileName: 'broken',
      sheetName: 'Sheet1',
      errors: [expect.objectContaining({
        severity: 'error',
        code: 'schema_error',
        diagnosticPath: 'schema.error',
        location: { sheetName: 'Sheet1' }
      })]
    })
  })

  it('exits non-zero and prints validation JSON for invalid input', () => {
    const input = Path.resolve(tmp, 'validate-invalid-input')
    fs.removeSync(input)
    fs.ensureDirSync(input)
    const csv = Path.join(input, 'broken.csv')
    fs.outputFileSync(csv, 'not,a,valid,tables,csv\n')

    const res = runCli(['-i', csv, '--validate', '--json'], repoRoot)
    expect(res.code).not.toBe(0)
    const result = JSON.parse(res.stdout)
    expect(result).toMatchObject({
      success: false,
      fileName: 'broken',
      errors: [{
        severity: 'error',
        code: 'schema_error'
      }],
      warnings: []
    })
  })

  it('prints validation JSON for preflight failures', () => {
    const input = Path.resolve(tmp, 'validate-directory-input')
    fs.removeSync(input)
    fs.ensureDirSync(input)

    const res = runCli(['-i', input, '--validate', '--json'], repoRoot)
    expect(res.code).not.toBe(0)
    const result = JSON.parse(res.stdout)
    expect(result).toMatchObject({
      success: false,
      errors: [{
        severity: 'error',
        code: 'invalid_input'
      }],
      warnings: []
    })
  })

  it('exits non-zero on TID collisions under --strict', () => {
    // Build a small workbook with duplicate ID rows
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const XLSX = require('xlsx')
    const aoa = [
      ['@', ''],      // mark line: only column A contributes to TID
      ['id', 'name'], // desc line
      ['001', 'foo'], // data row
      ['001', 'bar']  // duplicate id -> collision
    ]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '__data')
    const excel = Path.resolve(tmp, 'dup.xlsx')
    XLSX.writeFile(wb, excel)

    const out = Path.resolve(tmp, 'strict-out')
    fs.ensureDirSync(out)
    const res = runCli(['-i', excel, '-o', out, '-f', 'json', '--silent', '--strict'], repoRoot)
    expect(res.code).not.toBe(0)
  })
})
