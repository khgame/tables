#!/usr/bin/env node
import * as Yargs from 'yargs'
import { FileWalker } from 'kht'
import * as Path from 'path'
import * as fs from 'fs-extra'
import { resolveContextEnums } from './context/enumResolver'
import {
  serialize,
  getSerializerFormat,
  listSerializerFormats,
  inspectTableFile,
  validateTableFile,
  loadContext,
  tsSerializer,
  tsInterfaceSerializer
} from './serializer'
import { makeCamelName } from './utils/names'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageObj = require('../package.json')
const argv = (Yargs as any)
  .usage('Usage: tables [-i INPUT_DIR] [-o OUTPUT_DIR] [-f FORMAT]')
  .option('input', { alias: 'i', default: '.', describe: 'the input directory or fileName' })
  .option('output', { alias: 'o', default: '.', describe: 'the output directory' })
  .option('format', { alias: 'f', describe: 'export format', choices: listSerializerFormats(), default: 'json' })
  .option('silent', { alias: 's', type: 'boolean', default: false, describe: 'suppress logs' })
  .option('verbose', { alias: 'v', type: 'boolean', default: false, describe: 'verbose logs' })
  .option('fail-fast', { type: 'boolean', default: false, describe: 'stop on first fatal error (best-effort)' })
  .option('strict', { type: 'boolean', default: false, describe: 'treat warnings as errors (best-effort)' })
  .option('context', { alias: 'c', describe: 'context directory or context.*.json file' })
  .option('inspect', { type: 'boolean', default: false, describe: 'print machine-readable diagnostics for a single input file' })
  .option('validate', { type: 'boolean', default: false, describe: 'validate a single input file and print machine-readable result' })
  .option('json', { type: 'boolean', default: false, describe: 'print machine-readable JSON for inspect/validate output' })
  .help('h')
  .alias('h', 'help')
  .version(packageObj.version)
  .argv

const { input, output, format } = argv as any
const silent = !!(argv as any).silent
const verbose = !!(argv as any).verbose && !silent
if (silent) process.env.TABLES_SILENT = '1'
if (verbose) process.env.TABLES_VERBOSE = '1'

const EXECUTE_PATH = process.cwd()
const oPath = (output && output.startsWith('/')) ? output : Path.resolve(EXECUTE_PATH, output)
const iPath = (input && input.startsWith('/')) ? input : Path.resolve(EXECUTE_PATH, input)
const contextInput = (argv as any).context
const cPath = contextInput
  ? (contextInput.startsWith('/') ? contextInput : Path.resolve(EXECUTE_PATH, contextInput))
  : undefined

const formatObj = getSerializerFormat(format)
if (!formatObj) {
  throw new Error(`Unsupported format '${format}'. Available formats: ${listSerializerFormats().join(', ')}`)
}
const resolvedFormat = formatObj

function pathAvailable(path: string): boolean {
  return !path.match(/\..*\.swp/) && !path.startsWith('~') &&
    /\.(xls|xlsx|csv)$/i.test(path)
}

function buildOutputMap(baseName: string): Record<string, any> {
  if (format === 'ts') {
    return {
      [`${baseName}Solution.ts`]: tsSerializer,
      [`${baseName}.ts`]: tsInterfaceSerializer
    }
  }
  return {
    [`${baseName}.${resolvedFormat.suffix}`]: resolvedFormat.serializer
  }
}

function getContextBlobName(pathIn: string): string | null {
  const baseName = Path.basename(pathIn)
  const match = new RegExp('^context\\.([^.]+)(?:\\..*)?\\.json$', 'i').exec(baseName)
  return match ? match[1] : null
}

function loadContextFile(pathIn: string): any {
  const blobName = getContextBlobName(pathIn)
  const json = fs.readJsonSync(pathIn)
  const context = blobName ? { [blobName]: json } : json
  resolveContextEnums(context, Path.dirname(pathIn))
  return context
}

function loadCliContext(inputPath: string, inputStat: fs.Stats): any {
  if (cPath) {
    const contextStat = fs.statSync(cPath)
    return contextStat.isDirectory() ? loadContext(cPath) : loadContextFile(cPath)
  }
  return inputStat.isDirectory() ? loadContext(inputPath) : {}
}

const stat = fs.statSync(iPath)
const inspectMode = !!(argv as any).inspect
const validateMode = !!(argv as any).validate
const jsonMode = !!(argv as any).json

type CliMachineResult = {
  success?: boolean;
  fileName: string;
  sheetName?: string;
  errors: Array<{ severity: 'error'; code: string; message: string }>;
  warnings: any[];
}

function buildCliError(code: string, message: string): CliMachineResult {
  return {
    success: false,
    fileName: Path.parse(iPath || '').name || '',
    errors: [{
      severity: 'error',
      code,
      message
    }],
    warnings: []
  }
}

function withCapturedConsole<T>(action: () => T): { result: T; incidentalLogs: string[] } {
  const originalLog = console.log
  const originalError = console.error
  const incidentalLogs: string[] = []
  try {
    console.log = (...args: any[]) => { incidentalLogs.push(args.map(arg => String(arg)).join(' ')) }
    console.error = (...args: any[]) => { incidentalLogs.push(args.map(arg => String(arg)).join(' ')) }
    return { result: action(), incidentalLogs }
  } finally {
    console.log = originalLog
    console.error = originalError
  }
}

function loadCliValidationContext(): any {
  const context: any = loadCliContext(iPath, stat)
  if (!context.policy) {
    context.policy = {}
  }
  if ((argv as any).strict) {
    context.policy.tidConflict = 'error'
  }
  return context
}

if (inspectMode || validateMode) {
  if (stat.isDirectory()) {
    console.log(JSON.stringify(buildCliError('invalid_input', `${inspectMode ? '--inspect' : '--validate'} requires a single input file`), null, 2))
    process.exit(1)
  }
  if (!pathAvailable(iPath)) {
    console.log(JSON.stringify(buildCliError('unsupported_file', `file format error: ${iPath}`), null, 2))
    process.exit(1)
  }
  const originalLog = console.log
  const originalError = console.error
  const captured = withCapturedConsole(() => {
    try {
      const context = loadCliValidationContext()
      return validateMode ? validateTableFile(iPath, {}, context) : inspectTableFile(iPath, {}, context)
    } catch (error: any) {
      return buildCliError('preflight_error', error && error.message ? error.message : String(error))
    }
  })
  if (!silent && captured.incidentalLogs.length > 0 && !jsonMode) {
    originalError(captured.incidentalLogs.join('\n'))
  }
  originalLog(JSON.stringify(captured.result, null, 2))
  if ((captured.result as any).success === false) {
    process.exit(1)
  }
  process.exit(0)
}
const context: any = loadCliContext(iPath, stat)
if (!context.policy) {
  context.policy = {}
}
if ((argv as any).strict) {
  context.policy.tidConflict = 'error'
}
if (stat.isDirectory()) {
  FileWalker.forEachSync(
    iPath,
    (fileObj: any) => {
      if (!process.env.TABLES_SILENT) console.log('generate : ', fileObj.path)
      const baseName = makeCamelName(fileObj.parsed.name)
      serialize(fileObj.path, oPath, buildOutputMap(baseName), context)
    },
    false,
    (file: string) => pathAvailable(file)
  )
} else if (pathAvailable(iPath)) {
  if (!process.env.TABLES_SILENT) console.log('generate : ', iPath)
  const baseName = makeCamelName(Path.parse(iPath).name)
  serialize(iPath, oPath, buildOutputMap(baseName), context)
} else {
  if (!process.env.TABLES_SILENT) console.log('file format error:', iPath)
}
