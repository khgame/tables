#!/usr/bin/env node

const Path = require('path')
const fs = require('fs-extra')
const { spawnSync } = require('child_process')

const rootDir = Path.resolve(__dirname, '..')
const docsRoot = Path.resolve(rootDir, 'docs-site')
const distDir = Path.resolve(docsRoot, '.vitepress', 'dist')

const demos = [
  {
    id: 'game_01_minirpg',
    slug: 'minirpg',
    title: 'Mini RPG',
    description: '多表 RPG 示例，含英雄/技能/物品/敌人/关卡/配置及 React Web Demo'
  },
  {
    id: 'game_02_click_cookies',
    slug: 'click-cookies',
    title: 'Click Cookies',
    description: '增量点击示例，涵盖生产建筑、升级、成就及静态 Demo'
  },
  {
    id: 'game_03_a_dark_room',
    slug: 'a-dark-room',
    title: 'A Dark Room',
    description: '经典增量游戏改编示例，完整序列化与前端 UI'
  }
]

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options
  })
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`)
  }
}

function buildExamples() {
  run('npm', ['run', 'build'])

  const published = []

  demos.forEach(demo => {
    const scriptPath = Path.resolve(rootDir, 'example', demo.id, 'serialize.js')
    const outDir = Path.resolve(rootDir, 'example', demo.id, 'out')

    if (!fs.existsSync(scriptPath)) {
      console.warn(`[site] skip ${demo.id}: serialize.js not found`)
      return
    }

    run('node', [scriptPath])

    if (!fs.existsSync(outDir)) {
      console.warn(`[site] skip ${demo.id}: out directory not generated`)
      return
    }

    published.push({ ...demo, outDir })
  })

  return published
}

function copyExamplesIntoDist(published) {
  const targetBase = Path.join(distDir, 'examples')
  fs.ensureDirSync(targetBase)
  published.forEach(({ slug, outDir }) => {
    const targetDir = Path.join(targetBase, slug)
    fs.removeSync(targetDir)
    fs.copySync(outDir, targetDir, { overwrite: true })
  })
}

function main() {
  const published = buildExamples()

  fs.removeSync(distDir)

  run('npm', ['run', 'docs:build'])

  copyExamplesIntoDist(published)

  fs.writeFileSync(Path.join(distDir, '.nojekyll'), '')

  console.log(`[site] build completed -> ${distDir}`)
}

main()
