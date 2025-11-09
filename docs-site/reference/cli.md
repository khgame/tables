# CLI

```bash
Usage: tables [-i INPUT_DIR] [-o OUTPUT_DIR] [-f FORMAT]

Options:
  --input, -i   input 目录或文件（.xlsx）            [default: "."]
  --output, -o  输出目录                            [default: "."]
  --format, -f  导出格式                           [choices: json|js|ts|ts-interface|jsonx|go|csharp]
  --silent, -s  静默模式                            [boolean]
  --verbose, -v 详细日志                            [boolean]
  --fail-fast   尝试在首次致命错误即停止（尽力）      [boolean]
  --strict      将警告视为错误（TID 冲突报错）        [boolean]
  --context, -c context 目录或 context.*.json 文件
  --inspect     单文件机器可读诊断输出                [boolean]
  --validate    单文件机器可读校验输出                [boolean]
  --json        inspect/validate 抑制附带日志           [boolean]
  -h, --help    帮助
  --version     版本
```

示例：
- 整目录导出为 TS：
```bash
tables -i ./example -o ./out-ts -f ts
```
> `-f ts` 会生成 `<Table>.ts`（类型 + Repo 定义）与 `<Table>Solution.ts`（携带数据与默认实例）。
- 单文件导出为 JSON（静默）：
```bash
tables -i ./example/example.xlsx -o ./out -f json --silent
```
- 使用显式上下文目录：
```bash
tables -i ./example/items.csv -o ./out -f ts-interface --context ./example
```
- 输出单文件诊断 JSON：
```bash
tables -i ./example/items.csv --inspect
```
- 输出单文件校验 JSON：
```bash
tables -i ./example/items.csv --validate
```
- 严格模式（TID 冲突非 0 退出）：
```bash
tables -i ./example -o ./out -f json --strict
```

上下文加载：
- 目录输入默认加载该目录下的 `context.*.json`。
- 文件输入默认不猜测上下文；需要枚举、索引或 meta 时使用 `--context`。
- `--context` 可指向目录，也可指向单个 `context.<blob>.json` 文件。

`--inspect` 只支持单文件输入，并向 stdout 输出 JSON，适合脚本或 AI agent 读取。诊断包括实际 sheet 名、mark/desc 信息、schema model、convert 计数、索引与 alias 计数以及转换错误信息。

## Validate JSON

`--validate` 复用单文件解析与转换诊断，输出更稳定的校验报告，方便 AI agent 和 CI 直接消费：

```bash
tables -i ./example/items.csv --validate
```

- 仅支持单文件输入。
- stdout 输出 JSON；失败时退出码为非 `0`。
- `errors[].code` 当前包括 `schema_error`、`convert_error`、`tid_collision`、`inspect_error`、`invalid_input`、`unsupported_file`、`preflight_error`。
- `diagnostics` 保留 `--inspect` 的完整诊断结果，便于定位 sheet、mark/desc、schema 和 convert 信息。
- 可与 `--context ./dir` 或 `--context ./context.enums.json` 组合使用。
- `--inspect` / `--validate` 始终向 stdout 输出 JSON；使用 `--json` 时，附带日志不会写入 stderr。

JSON 形状：

```json
{
  "success": true,
  "fileName": "items",
  "sheetName": "Sheet1",
  "diagnostics": {
    "fileName": "items",
    "sheetName": "Sheet1",
    "convert": {
      "present": true,
      "tidCount": 1,
      "resultCount": 1
    }
  },
  "errors": [],
  "warnings": []
}
```

建议测试用例：
- 有效 CSV：`stdout` 可被 `JSON.parse` 解析，`success === true`，退出码为 `0`。
- 必填字段缺失或 schema/convert 失败：`success === false`，`errors[0]` 带 `severity/code/message`，退出码非 `0`。
- TID 冲突：`errors[].code` 包含 `tid_collision`，并带 `diagnosticPath`。
- `--verbose --context --json`：stdout 仍是纯 JSON，附带日志不污染输出通道。

命名规则：输出文件名自动按输入名驼峰化（如 `example.xlsx` -> `Example.json`）。

推荐输出目录：
```bash
tables -i ./example -o ./example/out -f json --silent
```
