#!/usr/bin/env node
import * as Yargs from 'yargs'
import { FileWalker } from 'kht'
import * as Path from 'path'
import * as fs from 'fs-extra'
import {
  serialize,
  getSerializerFormat,
  listSerializerFormats
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

const formatObj = getSerializerFormat(format)
if (!formatObj) {
  throw new Error(`Unsupported format '${format}'. Available formats: ${listSerializerFormats().join(', ')}`)
}

function pathAvailable(path: string): boolean {
  return !path.match(/\..*\.swp/) && !path.startsWith('~') &&
    /\.(xls|xlsx|csv)$/i.test(path)
}

const context: any = { policy: {} }
if ((argv as any).strict) {
  context.policy.tidConflict = 'error'
}
const stat = fs.statSync(iPath)
if (stat.isDirectory()) {
  FileWalker.forEachSync(
    iPath,
    (fileObj: any) => {
      if (!process.env.TABLES_SILENT) console.log('generate : ', fileObj.path)
      serialize(fileObj.path, oPath, { [`${makeCamelName(fileObj.parsed.name)}.${formatObj.suffix}`]: formatObj.serializer }, context)
    },
    false,
    (file: string) => pathAvailable(file)
  )
} else if (pathAvailable(iPath)) {
  if (!process.env.TABLES_SILENT) console.log('generate : ', iPath)
  serialize(iPath, oPath, { [`${makeCamelName(Path.parse(iPath).name)}.${formatObj.suffix}`]: formatObj.serializer }, context)
} else {
  if (!process.env.TABLES_SILENT) console.log('file format error:', iPath)
}
