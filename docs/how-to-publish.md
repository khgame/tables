# 发布到 GitHub Pages（github.io）

1) 推送仓库到 GitHub

2) 打开仓库 Settings → Pages：
- Source 选择 `Deploy from a branch`
- Branch 选择默认分支（如 `main` 或 `master`），`/docs` 目录
- 保存后等待几分钟，访问 `https://<your-account>.github.io/<repo>/`

3) 主题
- 本站使用 `jekyll-theme-cayman`，如需修改，编辑 `docs/_config.yml`

4) 本地预览（可选）
- 如果本地安装了 Ruby/Jekyll，可在 `docs/` 下运行 `bundle exec jekyll serve`
- 或直接在 GitHub 上预览 Markdown 效果

5) 自动化（可选）
- 使用 GitHub Actions 在合并时执行导表，产出到 `docs/generated/` 并随页面一起发布

示例命令：
```bash
# 将 example 下的表导出为 TS 到 docs/generated
npm run build
node lib/exec.js -i ./example -o ./docs/generated -f ts --silent
```
