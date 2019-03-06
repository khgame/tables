#!/usr/bin/env node

import * as Yargs from 'yargs'
import { FileWalker } from 'kht'
import * as Path from 'path'
import * as fs from 'fs-extra'
import * as Serializer from './serializer'
import { makeCamelName } from './utils/names'

const packageObj = require('../package.json')
const argv = Yargs
  .usage('Usage: tables [-i INPUT_DIR] [-o OUTPUT_DIR] [-f FORMAT]')
  .option('input', {
    alias: 'i',
    default: '.',
    describe: 'the input directory or fileName'
  })
  .option('output', {
    alias: 'o',
    default: '.',
    describe: 'the output directory'
  })
  .option('format', {
    alias: 'f',
    describe: 'export format',
    choices: ['json', 'js', 'ts', 'ts-interface'],
    default: 'json'
  })
  .help('h')
  .alias('h', 'help')
  .version(packageObj.version)
  .argv

const { input, output, format } = argv
const EXECUTE_PATH = process.cwd()
const oPath = (output && output.startsWith('/')) ? output : Path.resolve(EXECUTE_PATH, output)
const iPath = (input && input.startsWith('/')) ? input : Path.resolve(EXECUTE_PATH, input)

const formats = {
  'json': { suffix: 'json', serializer: Serializer.jsonSerializer },
  'js': { suffix: 'js', serializer: Serializer.jsSerializer },
  'ts': { suffix: 'ts', serializer: Serializer.tsSerializer },
  'ts-interface': { suffix: 'ts', serializer: Serializer.tsInterfaceSerializer }
}
const formatObj = formats[format]

const stat = fs.statSync(iPath)
if (stat.isDirectory()) {
  FileWalker.forEachSync(
    iPath,
    fileObj => {
      console.log('generate : ', fileObj.path)
      Serializer.serialize(fileObj.path, oPath, {
        [`${makeCamelName(fileObj.parsed.name)}.${formatObj.suffix}`]: formatObj.serializer
      })
    }, false, file => !file.match(/\..*\.swp/) && !file.startsWith('~') && file.endsWith('xlsx')
  )
} else if (!iPath.match(/\..*\.swp/) && !iPath.startsWith('~') && iPath.endsWith('xlsx')) {
  console.log('generate : ', iPath)
  Serializer.serialize(iPath, oPath, {
    [`${makeCamelName(Path.parse(iPath).name)}.${formatObj.suffix}`]: formatObj.serializer
  })
} else {
  console.log('file format error:', iPath)
}
