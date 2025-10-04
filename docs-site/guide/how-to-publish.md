# 发布与部署

`tables` 的文档与 Demo 站点基于 VitePress 构建，产物位于 `docs-site/.vitepress/dist`。以下提供常见的发布流程。

## 本地预览

```bash
npm run docs:dev
```

- 默认在 `http://localhost:5173/tables/` 提供热更新预览。
- 支持传入 VitePress 参数，例如 `npm run docs:dev -- --open` 自动打开浏览器。

## 构建静态产物

```bash
npm run docs:build
```

- 构建完成后，静态文件位于 `docs-site/.vitepress/dist`。
- 可使用任意静态服务器（`npx serve docs-site/.vitepress/dist`）在本地验收。

## 发布到 GitHub Pages

1. 在仓库 `Settings → Pages` 中选择 **GitHub Actions** 作为部署来源。
2. 使用官方 VitePress Action 或添加一个简单的 workflow：

```yaml
name: Deploy Docs

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm run docs:build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: {{ secrets.GITHUB_TOKEN }}
          publish_dir: docs-site/.vitepress/dist
```

3. Workflow 成功后，站点会部署在 `https://<account>.github.io/<repo>/`（若仓库名为 `tables` 则路径为 `/tables/`）。

> 如果偏好直接从分支发布，也可以在 Settings → Pages 中选择 `gh-pages` 分支并手动推送 `docs-site/.vitepress/dist` 的内容。

## 同步导表产物

如需在文档站点同时展示最新的导表结果（例如 `docs/generated`），可在构建前运行导表脚本：

```bash
npm run build
node lib/exec.js -i ./example -o ./docs-site/public/generated -f ts --silent
npm run docs:build
```

这样 Demo 或指南页即可直接引用最新的 JSON/TS/协议产物。
