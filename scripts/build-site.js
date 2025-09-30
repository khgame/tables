#!/usr/bin/env node

const Path = require('path')
const fs = require('fs-extra')
const { spawnSync } = require('child_process')

const rootDir = Path.resolve(__dirname, '..')
const siteDir = Path.resolve(rootDir, 'site')

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

function ensureSiteDir() {
  fs.removeSync(siteDir)
  fs.ensureDirSync(siteDir)
  fs.ensureDirSync(Path.join(siteDir, 'examples'))
  // prevent GitHub Pages from running Jekyll on the output
  fs.writeFileSync(Path.join(siteDir, '.nojekyll'), '')
}

function buildExamples() {
  // Build library first so examples can import compiled code
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

    const targetDir = Path.join(siteDir, 'examples', demo.slug)
    fs.ensureDirSync(targetDir)
    fs.copySync(outDir, targetDir, { overwrite: true })
    published.push(demo)
  })

  return published
}

function copyDocs() {
  const docsDir = Path.resolve(rootDir, 'docs')
  if (fs.existsSync(docsDir)) {
    fs.copySync(docsDir, Path.join(siteDir, 'docs'))
  }

  const readmePath = Path.resolve(rootDir, 'README.md')
  if (fs.existsSync(readmePath)) {
    fs.copyFileSync(readmePath, Path.join(siteDir, 'README.md'))
  }
}

function writeIndexPage(publishedDemos) {
  const lines = []
  lines.push('<!DOCTYPE html>')
  lines.push('<html lang="zh-CN">')
  lines.push('<head>')
  lines.push('  <meta charset="UTF-8" />')
  lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1" />')
  lines.push('  <title>@khgame/tables demos</title>')
  lines.push('  <style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;margin:40px auto;max-width:960px;padding:0 20px;line-height:1.6;}h1{margin-bottom:24px;}section{margin-bottom:32px;}ul{padding-left:20px;}li{margin-bottom:12px;}code{background:#f5f5f5;padding:2px 4px;border-radius:4px;}</style>')
  lines.push('</head>')
  lines.push('<body>')
  lines.push('  <h1>@khgame/tables 静态示例</h1>')
  lines.push('  <p>以下资源由 <code>scripts/build-site.js</code> 自动生成，部署于 GitHub Pages，便于直接体验导表产物与示例项目。</p>')

  if (publishedDemos.length > 0) {
    lines.push('  <section>')
    lines.push('    <h2>示例 Demo</h2>')
    lines.push('    <ul>')
    publishedDemos.forEach(demo => {
      lines.push(`      <li><a href="./examples/${demo.slug}/index.html" target="_blank" rel="noopener">${demo.title}</a> — ${demo.description}</li>`)
    })
    lines.push('    </ul>')
    lines.push('  </section>')
  }

  lines.push('  <section>')
  lines.push('    <h2>文档</h2>')
  lines.push('    <ul>')
  lines.push('      <li><a href="./README.md">项目 README</a></li>')
  lines.push('      <li><a href="./docs/concepts.md">概念与约定</a></li>')
  lines.push('      <li><a href="./docs/plugins.md">插件与扩展点</a>（若存在）</li>')
  lines.push('      <li><a href="./docs/serializers.md">序列化器与上下文</a>（若存在）</li>')
  lines.push('    </ul>')
  lines.push('  </section>')

  lines.push('  <section>')
  lines.push('    <h2>源码</h2>')
  lines.push('    <p><a href="https://github.com/khgame/tables" target="_blank" rel="noopener">GitHub 仓库</a></p>')
  lines.push('  </section>')

  lines.push('</body>')
  lines.push('</html>')

  fs.writeFileSync(Path.join(siteDir, 'index.html'), lines.join('\n'), 'utf8')
}

function main() {
  ensureSiteDir()
  const publishedDemos = buildExamples()
  copyDocs()
  writeIndexPage(publishedDemos)
  console.log(`[site] build completed -> ${siteDir}`)
}

main()
