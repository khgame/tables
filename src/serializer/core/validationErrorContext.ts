type ValidationLocation = {
  sheetName?: string;
  row?: number;
  column?: string;
  fieldPath?: string;
}

export type ParsedValidationErrorContext = {
  location?: ValidationLocation;
  details?: Record<string, unknown>;
}

type DiagnosticsForValidationError = {
  sheetName?: string;
  descLine?: Record<string, string>;
}

type ConvertPathParts = {
  tableName?: string;
  row?: number;
  fieldPath?: string;
}

const tidPolicyOptions = ['overwrite', 'ignore', 'merge']

const patterns = {
  missingMarker: new RegExp("表 (.+?) 缺少 '(@)' 标记列，无法生成 TID"),
  missingTidSegment: new RegExp("表 (.+?) 在第 ([0-9]+) 行的 '([^']+)' 段缺少 TID 数据"),
  missingTidRow: new RegExp('表 (.+?) 在第 ([0-9]+) 行缺少 TID'),
  tidCollision: new RegExp('TID collision detected for id (.+?)(?:\\. Configure|\\.$)'),
  bigintExpected: new RegExp('^\\[tables\\] expected (.+?)(?: \\(alias: ([^)]+)\\))? to be a numeric string for BigInt preservation, received ([A-Za-z0-9_$-]+)'),
  numericOverflow: new RegExp('^\\[tables\\] numeric value (.+?) at (.+?)(?: \\(alias: ([^)]+)\\))? exceeds Number\\.MAX_SAFE_INTEGER\\(([0-9]+)\\)\\. Consider using ([^.]+)\\.'),
  multipleAliasColumns: new RegExp('表 (.+?) 暂不支持多个 alias 列'),
  missingAliasDescriptor: new RegExp('alias 列对应的描述行为空，请为列 ([^ ]+) 设置字段名'),
  duplicateAlias: new RegExp("表 (.+?) 的 alias 列 '([^']+)' 存在重复别名：(.+)"),
  convertPath: new RegExp('^(.+)\\[row ([0-9]+)\\](?:\\.(.+))?$')
}

export function parseValidationErrorContext(message: string, diagnostics?: DiagnosticsForValidationError): ParsedValidationErrorContext {
  const location = baseLocation(diagnostics)

  let match = patterns.missingMarker.exec(message)
  if (match) {
    return pack(location, {
      tableName: match[1],
      requiredMarker: match[2]
    })
  }

  match = patterns.missingTidSegment.exec(message)
  if (match) {
    return pack({
      ...location,
      row: toNumber(match[2]),
      column: match[3]
    }, {
      tableName: match[1]
    })
  }

  match = patterns.missingTidRow.exec(message)
  if (match) {
    return pack({
      ...location,
      row: toNumber(match[2])
    }, {
      tableName: match[1]
    })
  }

  match = patterns.tidCollision.exec(message)
  if (match) {
    return pack(location, {
      tid: match[1],
      policyPath: 'context.policy.tidConflict',
      allowedPolicies: tidPolicyOptions.slice()
    })
  }

  match = patterns.bigintExpected.exec(message)
  if (match) {
    const details: Record<string, unknown> = {
      convertPath: match[1],
      expected: 'numeric_string',
      receivedType: match[3]
    }
    if (match[2]) details.sourceAlias = match[2]
    return packPathContext(location, details, match[1], diagnostics)
  }

  match = patterns.numericOverflow.exec(message)
  if (match) {
    const details: Record<string, unknown> = {
      rawValue: match[1],
      convertPath: match[2],
      maxSafeInteger: toNumber(match[4]),
      suggestedType: match[5]
    }
    if (match[3]) details.sourceAlias = match[3]
    return packPathContext(location, details, match[2], diagnostics)
  }

  match = patterns.multipleAliasColumns.exec(message)
  if (match) {
    return pack(location, {
      tableName: match[1]
    })
  }

  match = patterns.missingAliasDescriptor.exec(message)
  if (match) {
    return pack({
      ...location,
      column: match[1]
    })
  }

  match = patterns.duplicateAlias.exec(message)
  if (match) {
    const fieldPath = match[2]
    const column = resolveColumnForFieldPath(fieldPath, diagnostics)
    return pack({
      ...location,
      fieldPath,
      ...(column ? { column } : {})
    }, {
      tableName: match[1],
      duplicateAliases: splitAliases(match[3])
    })
  }

  return pack(location)
}

function packPathContext(
  location: ValidationLocation,
  details: Record<string, unknown>,
  convertPath: string,
  diagnostics?: DiagnosticsForValidationError
): ParsedValidationErrorContext {
  const pathParts = parseConvertPath(convertPath)
  if (pathParts.tableName) details.tableName = pathParts.tableName

  const nextLocation: ValidationLocation = {
    ...location,
    ...(pathParts.row !== undefined ? { row: pathParts.row } : {}),
    ...(pathParts.fieldPath ? { fieldPath: pathParts.fieldPath } : {})
  }
  const column = resolveColumnForFieldPath(pathParts.fieldPath, diagnostics)
  if (column) nextLocation.column = column

  return pack(nextLocation, details)
}

function parseConvertPath(path: string): ConvertPathParts {
  const match = patterns.convertPath.exec(path)
  if (!match) return {}
  return {
    tableName: match[1],
    row: toNumber(match[2]),
    fieldPath: match[3]
  }
}

function resolveColumnForFieldPath(fieldPath?: string, diagnostics?: DiagnosticsForValidationError): string | undefined {
  if (!fieldPath || !diagnostics || !diagnostics.descLine) return undefined

  const entries = Object.keys(diagnostics.descLine).map(column => ({
    column,
    field: diagnostics.descLine ? diagnostics.descLine[column] : undefined
  }))
  const exact = entries.filter(entry => entry.field === fieldPath)
  if (exact.length === 1) return exact[0].column

  const topField = getTopField(fieldPath)
  if (!topField || topField === fieldPath) return undefined

  const top = entries.filter(entry => entry.field === topField)
  return top.length === 1 ? top[0].column : undefined
}

function getTopField(fieldPath: string): string {
  const dotIndex = fieldPath.indexOf('.')
  const bracketIndex = fieldPath.indexOf('[')
  const indexes = [dotIndex, bracketIndex].filter(index => index >= 0)
  if (indexes.length === 0) return fieldPath
  return fieldPath.slice(0, Math.min(...indexes))
}

function baseLocation(diagnostics?: DiagnosticsForValidationError): ValidationLocation {
  return diagnostics && diagnostics.sheetName ? { sheetName: diagnostics.sheetName } : {}
}

function pack(location: ValidationLocation, details?: Record<string, unknown>): ParsedValidationErrorContext {
  const ret: ParsedValidationErrorContext = {}
  if (Object.keys(location).length > 0) ret.location = location
  if (details && Object.keys(details).length > 0) ret.details = details
  return ret
}

function splitAliases(raw: string): string[] {
  return raw.split(',').map(alias => alias.trim()).filter(Boolean)
}

function toNumber(raw: string): number {
  return Number(raw)
}
