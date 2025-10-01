#!/usr/bin/env node

const { spawn } = require('child_process')
const fs = require('fs')
const Path = require('path')

const rootDir = Path.resolve(__dirname, '..')
const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const entryFile = Path.resolve(rootDir, 'node_modules', 'hserve', 'bin', 'hserve.js')
const args = fs.existsSync(entryFile)
  ? ['node', entryFile, ...process.argv.slice(2)]
  : ['hserve', ...process.argv.slice(2)]

let printedLink = false

const child = spawn(npxBin, args, {
  cwd: rootDir,
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: false
})

child.stdout.on('data', chunk => {
  process.stdout.write(chunk)

  if (printedLink) {
    return
  }

  const text = chunk.toString('utf8')
  const urls = text.match(/https?:\/\/[^\s)]+/g)

  if (!urls) {
    return
  }

  const target = urls.find(url => url.includes('localhost')) || urls[0]

  if (!target) {
    return
  }

  const hyperlink = `\u001B]8;;${target}\u001B\\首页\u001B]8;;\u001B\\`
  process.stdout.write(`\n打开 ${hyperlink} 访问示例。\n\n`)
  printedLink = true
})

child.stderr.on('data', chunk => {
  process.stderr.write(chunk)
})

child.on('exit', code => {
  process.exit(code ?? 0)
})

child.on('error', error => {
  console.error(error)
  process.exit(1)
})
