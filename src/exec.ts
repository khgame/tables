#!/usr/bin/env node
import * as Yargs from 'yargs'
import { FileWalker } from 'kht'
import * as Path from 'path'
import * as fs from 'fs-extra'
import {
  serialize,
  getSerializerFormat,
  listSerializerFormats,
  inspectTableFile,
  validateTableFile,
  validateContextReferences,
  loadContext,
  loadContextPath,
  tsSerializer,
  tsInterfaceSerializer
} from './serializer'
import { resolveContextEnums } from './context/enumResolver'
import { makeCamelName } from './utils/names'
import type { ValidationMessage } from './types'

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
  .option('context', { alias: 'c', describe: 'context directory, context.*.json file, or full context JSON file' })
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

function loadCliContext(inputPath: string, inputStat: fs.Stats): any {
  if (cPath) {
    return loadContextPath(cPath)
  }
  return inputStat.isDirectory() ? loadContext(inputPath) : {}
}

const inspectMode = !!(argv as any).inspect
const validateMode = !!(argv as any).validate
const jsonMode = !!(argv as any).json

type CliMachineResult = {
  success?: boolean;
  fileName: string;
  sheetName?: string;
  errors: ValidationMessage[];
  warnings: any[];
}

type CliValidationContextResult = {
  context?: any;
  error?: CliMachineResult;
}

function displayCliPath(pathIn: string): string {
  const relativePath = Path.relative(EXECUTE_PATH, pathIn)
  if (relativePath && !relativePath.startsWith('..') && !Path.isAbsolute(relativePath)) {
    return relativePath
  }
  return Path.basename(pathIn)
}

function sanitizeCliMessage(message: string): string {
  let ret = message
  const pathReplacements: Array<[string, string]> = [[iPath, displayCliPath(iPath)]]
  const inputDir = Path.dirname(iPath)
  if (inputDir && inputDir !== iPath) {
    pathReplacements.push([inputDir, displayCliPath(inputDir)])
  }
  if (cPath) {
    pathReplacements.push([cPath, displayCliPath(cPath)])
    const contextDir = Path.dirname(cPath)
    if (contextDir && contextDir !== cPath) {
      pathReplacements.push([contextDir, displayCliPath(contextDir)])
    }
  }
  pathReplacements
    .filter(([absolutePath]) => Path.isAbsolute(absolutePath) && absolutePath.length > 1)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([absolutePath, displayPath]) => {
      ret = ret.split(absolutePath).join(displayPath)
    })
  return ret
}

function buildCliError(code: string, message: string, errors?: CliMachineResult['errors']): CliMachineResult {
  return {
    success: false,
    fileName: Path.parse(iPath || '').name || '',
    errors: errors || [{
      severity: 'error',
      code,
      message: sanitizeCliMessage(message)
    }],
    warnings: []
  }
}

function withCapturedConsole<T>(action: () => T): { result: T; incidentalLogs: string[] } {
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn
  const incidentalLogs: string[] = []
  try {
    console.log = (...args: any[]) => { incidentalLogs.push(args.map(arg => String(arg)).join(' ')) }
    console.error = (...args: any[]) => { incidentalLogs.push(args.map(arg => String(arg)).join(' ')) }
    console.warn = (...args: any[]) => { incidentalLogs.push(args.map(arg => String(arg)).join(' ')) }
    return { result: action(), incidentalLogs }
  } finally {
    console.log = originalLog
    console.error = originalError
    console.warn = originalWarn
  }
}

function loadCliValidationContext(stat: fs.Stats, validateContextRefs: boolean): CliValidationContextResult {
  let context: any
  try {
    context = cPath
      ? loadContextPath(cPath, { resolveEnums: false })
      : (stat.isDirectory() ? loadContext(iPath, { resolveEnums: false }) : {})
  } catch (error: any) {
    return { error: buildCliError('preflight_error', error && error.message ? error.message : String(error)) }
  }

  const contextBaseDir = cPath
    ? (fs.statSync(cPath).isDirectory() ? cPath : Path.dirname(cPath))
    : (stat.isDirectory() ? iPath : Path.dirname(iPath))
  if (validateContextRefs) {
    const contextValidation = validateContextReferences(context, contextBaseDir)
    if (!contextValidation.success) {
      return {
        error: buildCliError(
          'context_ref_error',
          'context reference validation failed',
          contextValidation.errors.map(sanitizeValidationMessage)
        )
      }
    }
  }

  if (validateContextRefs) {
    const resolvedBaseDir = cPath
      ? contextBaseDir
      : (stat.isDirectory() ? iPath : Path.dirname(iPath))
    resolveContextEnums(context, resolvedBaseDir)
  }
  if (!context.policy) {
    context.policy = {}
  }
  if ((argv as any).strict) {
    context.policy.tidConflict = 'error'
  }
  return { context }
}

function sanitizeValidationMessage(error: ValidationMessage): ValidationMessage {
  return {
    ...error,
    message: sanitizeCliPathsInText(error.message),
    details: sanitizeDetails(error.details)
  }
}

function sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!details) return undefined
  const sanitized: Record<string, unknown> = {}
  Object.keys(details).forEach(key => {
    const value = details[key]
    sanitized[key] = typeof value === 'string' ? sanitizeCliValue(value) : value
  })
  return sanitized
}

function sanitizeCliValue(value: string): string {
  const sanitized = sanitizeCliMessage(value)
  if (!sanitized.includes('/') && !sanitized.includes('\\')) return sanitized
  return basenameForCliValue(sanitized)
}

function sanitizeCliPathsInText(value: string): string {
  return sanitizeCliMessage(value)
    .replace(new RegExp("(['\"])([^'\"]*[\\\\/][^'\"]*)\\1", 'g'), (_match, quote: string, rawPath: string) => {
      return `${quote}${basenameForCliValue(rawPath)}${quote}`
    })
    .replace(new RegExp("(?:[A-Za-z]:[\\\\/]|/)[^'\"\\s]+", 'g'), rawPath => basenameForCliValue(rawPath))
}

function basenameForCliValue(value: string): string {
  const withoutTrailingSeparator = value.replace(new RegExp('[\\\\/]+$', 'g'), '')
  const parts = withoutTrailingSeparator.split(new RegExp('[\\\\/]'))
  return parts[parts.length - 1] || value
}

if (inspectMode || validateMode) {
  let stat: fs.Stats
  try {
    stat = fs.statSync(iPath)
  } catch (error: any) {
    console.log(JSON.stringify(buildCliError('invalid_input', `input path is not accessible: ${displayCliPath(iPath)}`), null, 2))
    process.exit(1)
  }
  if (stat.isDirectory()) {
    console.log(JSON.stringify(buildCliError('invalid_input', `${inspectMode ? '--inspect' : '--validate'} requires a single input file`), null, 2))
    process.exit(1)
  }
  if (!pathAvailable(iPath)) {
    console.log(JSON.stringify(buildCliError('unsupported_file', `file format error: ${displayCliPath(iPath)}`), null, 2))
    process.exit(1)
  }
  const originalLog = console.log
  const originalError = console.error
  const captured = withCapturedConsole(() => {
    try {
      const contextResult = loadCliValidationContext(stat, validateMode)
      if (contextResult.error) return contextResult.error
      const context = contextResult.context
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
const stat = fs.statSync(iPath)
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
