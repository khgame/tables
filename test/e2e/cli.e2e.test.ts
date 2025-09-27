import * as cp from 'child_process'
import * as fs from 'fs-extra'
import * as Path from 'path'

const nodeBin = process.execPath

function runCli(args: string[], cwd: string): { code: number; stdout: string; stderr: string } {
  const ret = cp.spawnSync(nodeBin, ['lib/exec.js', ...args], { cwd, encoding: 'utf8' })
  return { code: ret.status ?? 0, stdout: ret.stdout || '', stderr: ret.stderr || '' }
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
