# CLI

```bash
Usage: tables [-i INPUT_DIR] [-o OUTPUT_DIR] [-f FORMAT]

Options:
  --input, -i   input 目录或文件（.xlsx）            [default: "."]
  --output, -o  输出目录                            [default: "."]
  --format, -f  导出格式                           [choices: json|js|ts|ts-interface|jsonx]
  --silent, -s  静默模式                            [boolean]
  --verbose, -v 详细日志                            [boolean]
  --fail-fast   尝试在首次致命错误即停止（尽力）      [boolean]
  --strict      将警告视为错误（TID 冲突报错）        [boolean]
  -h, --help    帮助
  --version     版本
```

示例：
- 整目录导出为 TS：
```bash
tables -i ./example -o ./out-ts -f ts
```
- 单文件导出为 JSON（静默）：
```bash
tables -i ./example/example.xlsx -o ./out -f json --silent
```
- 严格模式（TID 冲突非 0 退出）：
```bash
tables -i ./example -o ./out -f json --strict
```

命名规则：输出文件名自动按输入名驼峰化（如 `example.xlsx` -> `Example.json`）。

推荐输出目录：
```bash
tables -i ./example -o ./example/out -f json --silent
```
