import * as Path from 'path'
import * as fs from 'fs-extra'
import { readAndTranslate } from '../utils/read'
import { tableSchema, tableConvert } from '../plugin'
import { makeCamelName, makeInterfaceName } from '../utils/names'

type Primitive = string | number | boolean
type FilterValue = Primitive | Primitive[]

type EnumValue = Primitive

type EnumResult = Record<string, EnumValue | [EnumValue, string]>

type EnumDefinition = Record<string, any> | EnumArrayDefinition

type EnumArrayDefinition = Array<EnumArrayEntry>

type EnumArrayEntry =
  | Primitive
  | [EnumValue, string?]
  | EnumLiteralObject
  | EnumReferenceObject

interface EnumLiteralObject {
  name?: string
  value?: EnumValue
  literal?: EnumValue
  description?: string
}

interface EnumReferenceObject {
  ref: EnumReferenceConfig | string
  nameTransform?: NameTransform
  prefix?: string
  suffix?: string
  filter?: Record<string, FilterValue>
  valueField?: string
  nameField?: string
  descriptionField?: string
}

type NameTransform = 'pascal' | 'camel' | 'upper' | 'lower' | 'raw'

interface EnumReferenceConfig {
  table: string
  field: string
  valueField?: string
  nameField?: string
  descriptionField?: string
  transform?: NameTransform
  prefix?: string
  suffix?: string
  filter?: Record<string, FilterValue>
}

interface TableConvertBundle {
  convert: any
}

interface ResolverOptions {
  baseDir: string
  context: any
}

const tableCache = new Map<string, TableConvertBundle>()

export function resolveContextEnums(context: any, baseDir: string): void {
  if (!context || typeof context !== 'object') return
  if (!context.enums || typeof context.enums !== 'object') return

  const resolverOptions: ResolverOptions = { baseDir, context }

  for (const enumName of Object.keys(context.enums)) {
    const definition = context.enums[enumName]
    const resolved = resolveEnum(enumName, definition, resolverOptions)
    context.enums[enumName] = resolved
  }
}

function resolveEnum(enumName: string, definition: EnumDefinition, options: ResolverOptions): EnumResult {
  const entries = definitionToEntries(enumName, definition, options)

  if (entries.length === 0) {
    return {}
  }

  const result: EnumResult = {}
  entries.forEach(entry => {
    const { name, value, description } = entry
    if (!name) {
      throw new Error(`[tables] context.enums.${enumName} 生成的某项缺少 name，无法构建枚举值`)
    }
    if (result[name] !== undefined) {
      throw new Error(`[tables] context.enums.${enumName} 出现重复的枚举键 '${name}'`)
    }
    result[name] = description ? [value, description] : value
  })
  return result
}

type EnumEntry = {
  name: string
  value: EnumValue
  description?: string
}

function definitionToEntries(enumName: string, definition: EnumDefinition, options: ResolverOptions): EnumEntry[] {
  if (Array.isArray(definition)) {
    return resolveArrayDefinition(enumName, definition, options)
  }
  if (definition && typeof definition === 'object') {
    return resolveObjectDefinition(enumName, definition, options)
  }
  throw new Error(`[tables] context.enums.${enumName} 必须是对象或数组`)
}

function resolveObjectDefinition(enumName: string, definition: Record<string, any>, options: ResolverOptions): EnumEntry[] {
  const entries: EnumEntry[] = []
  const refs = definition.__refs || definition.$refs
  for (const key of Object.keys(definition)) {
    if (key === '__refs' || key === '$refs') continue
    const rawValue = definition[key]
    if (rawValue === undefined || rawValue === null) continue
    if (Array.isArray(rawValue)) {
      const [value, description] = rawValue
      entries.push({ name: key, value: normalizeEnumValue(value), description: normalizeDescription(description) })
      continue
    }
    if (rawValue && typeof rawValue === 'object') {
      if ('ref' in rawValue) {
        entries.push(...resolveReferenceObject(enumName, rawValue as EnumReferenceObject, options))
        continue
      }
      const literalObj = rawValue as EnumLiteralObject
      if (literalObj.value !== undefined || literalObj.literal !== undefined) {
        const value = literalObj.value ?? literalObj.literal
        entries.push({ name: key, value: normalizeEnumValue(value), description: normalizeDescription(literalObj.description) })
        continue
      }
    }
    entries.push({ name: key, value: normalizeEnumValue(rawValue) })
  }

  if (Array.isArray(refs)) {
    refs.forEach((refObj, index) => {
      if (refObj) {
        const refEntries = resolveReferenceObject(enumName, refObj as EnumReferenceObject, options)
        entries.push(...refEntries)
      } else {
        throw new Error(`[tables] context.enums.${enumName}.__refs[${index}] 配置为空`)
      }
    })
  }

  return entries
}

function resolveArrayDefinition(enumName: string, definition: EnumArrayDefinition, options: ResolverOptions): EnumEntry[] {
  const entries: EnumEntry[] = []
  definition.forEach((item, index) => {
    if (item === undefined || item === null) return
    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
      const name = deriveLiteralName(item, index)
      entries.push({ name, value: normalizeEnumValue(item) })
      return
    }
    if (Array.isArray(item)) {
      if (item.length === 0) return
      const [value, description] = item
      const name = deriveLiteralName(value, index)
      entries.push({ name, value: normalizeEnumValue(value), description: normalizeDescription(description) })
      return
    }
    if (item && typeof item === 'object') {
      if ('ref' in item) {
        entries.push(...resolveReferenceObject(enumName, item as EnumReferenceObject, options))
        return
      }
      const literal = item as EnumLiteralObject
      const value = literal.value ?? literal.literal
      if (value === undefined) {
        throw new Error(`[tables] context.enums.${enumName}[${index}] 缺少 value 字段`)
      }
      const name = literal.name || deriveLiteralName(value, index)
      entries.push({ name, value: normalizeEnumValue(value), description: normalizeDescription(literal.description) })
      return
    }
    throw new Error(`[tables] context.enums.${enumName}[${index}] 不支持的类型`)
  })
  return entries
}

function resolveReferenceObject(enumName: string, input: EnumReferenceObject, options: ResolverOptions): EnumEntry[] {
  const config = normalizeReferenceConfig(enumName, input)
  const bundle = loadTableConvert(config.table, options)
  const convert = bundle.convert || {}

  const aliasBundle = (convert.aliases || {})[config.field]
  if (!aliasBundle) {
    throw new Error(`[tables] context.enums.${enumName} 在表 ${config.table} 上请求字段 '${config.field}'，但该字段不是 alias 列`)
  }

  const rows: Array<Record<string, any>> = Object.values(convert.result || {})
  const seenNames = new Set<string>()
  const seenValues = new Set<string>()
  const entries: EnumEntry[] = []

  rows.forEach(row => {
    if (!matchesFilter(row, config.filter)) return
    const rawValue = row[config.valueField] ?? row[config.field]
    if (rawValue === undefined || rawValue === null) return
    const normalizedValue = normalizeEnumValue(rawValue)
    if (typeof normalizedValue === 'string' && normalizedValue.trim() === '') return
    const valueKey = String(normalizedValue)
    if (seenValues.has(valueKey)) return

    const rawNameSource = row[config.nameField ?? config.field] ?? rawValue
    const descriptionSource = config.descriptionField ? row[config.descriptionField] : undefined
    const name = buildEntryName(rawNameSource, config)
    if (!name) {
      throw new Error(`[tables] context.enums.${enumName} 无法从 ${config.table}#${config.field} 生成合法名称`)
    }
    if (seenNames.has(name)) {
      throw new Error(`[tables] context.enums.${enumName} 生成的名称 '${name}' 重复，来自 ${config.table}#${config.field}`)
    }

    entries.push({
      name,
      value: normalizedValue,
      description: normalizeDescription(descriptionSource)
    })
    seenNames.add(name)
    seenValues.add(valueKey)
  })

  if (entries.length === 0) {
    throw new Error(`[tables] context.enums.${enumName} 未能从 ${config.table}#${config.field} 中解析到任何枚举项`)
  }

  return entries
}

function normalizeReferenceConfig(enumName: string, input: EnumReferenceObject): EnumReferenceConfig {
  if (!input || typeof input !== 'object') {
    throw new Error(`[tables] context.enums.${enumName} 的 ref 配置格式错误`)
  }
  let ref: EnumReferenceConfig
  if (typeof input.ref === 'string') {
    const [table, field] = input.ref.split('#')
    if (!table || !field) {
      throw new Error(`[tables] context.enums.${enumName} 的 ref '${input.ref}' 需要使用 '表名#字段名' 格式`)
    }
    ref = {
      table,
      field
    }
  } else {
    ref = { ...input.ref }
  }

  if (!ref.table || !ref.field) {
    throw new Error(`[tables] context.enums.${enumName} 的 ref 配置缺少表名或字段名`)
  }

  const transform = input.nameTransform ?? ref.transform
  if (transform) {
    ref.transform = transform
  }
  if (input.prefix) ref.prefix = input.prefix
  if (input.suffix) ref.suffix = input.suffix
  if (input.filter) ref.filter = input.filter
  if (input.valueField) ref.valueField = input.valueField
  if (input.nameField) ref.nameField = input.nameField
  if (input.descriptionField) ref.descriptionField = input.descriptionField

  return ref
}

function loadTableConvert(relativePath: string, options: ResolverOptions): TableConvertBundle {
  const absolutePath = Path.resolve(options.baseDir, relativePath)
  const cached = tableCache.get(absolutePath)
  if (cached) return cached

  if (!fs.pathExistsSync(absolutePath)) {
    throw new Error(`[tables] context 枚举引用的表 '${relativePath}' 在目录 ${options.baseDir} 下不存在`)
  }

  const parsed = Path.parse(absolutePath)
  const scopedContext = {
    ...(options.context || {}),
    __table: {
      fileName: parsed.name,
      camelName: makeCamelName(parsed.name),
      interfaceName: makeInterfaceName(parsed.name)
    }
  }

  const table = readAndTranslate(absolutePath, { plugins: [tableSchema, tableConvert] }, scopedContext)
  if (!(table as any).convert) {
    throw new Error(`[tables] 无法从 ${relativePath} 读取转换结果`)
  }
  const bundle: TableConvertBundle = { convert: (table as any).convert }
  tableCache.set(absolutePath, bundle)
  return bundle
}

function normalizeEnumValue(value: any): EnumValue {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return value
  throw new Error(`[tables] 枚举值必须是 string/number/boolean 类型，收到 ${typeof value}`)
}

function normalizeDescription(description: any): string | undefined {
  if (description === undefined || description === null) return undefined
  return String(description)
}

function deriveLiteralName(value: Primitive, index: number): string {
  if (typeof value === 'number') {
    return `Value${value}`
  }
  if (typeof value === 'boolean') {
    return value ? 'True' : 'False'
  }
  const trimmed = value.trim()
  if (isValidIdentifier(trimmed)) return trimmed
  const camel = makeCamelName(trimmed)
  if (camel) return camel
  return `Value${index}`
}

function isValidIdentifier(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value)
}

function matchesFilter(row: Record<string, any>, filter?: Record<string, FilterValue>): boolean {
  if (!filter) return true
  const entries = Object.entries(filter)
  return entries.every(([field, expected]) => {
    const actual = row ? row[field] : undefined
    if (Array.isArray(expected)) {
      return expected.some(candidate => compareLoose(actual, candidate))
    }
    return compareLoose(actual, expected)
  })
}

function compareLoose(actual: any, expected: Primitive): boolean {
  if (actual === expected) return true
  if (actual === undefined || actual === null) return expected === undefined || expected === null
  if (typeof actual === 'boolean' || typeof actual === 'number') {
    return actual === expected
  }
  const actualStr = String(actual)
  const expectedStr = String(expected)
  return actualStr === expectedStr
}

function buildEntryName(source: any, config: EnumReferenceConfig): string {
  const raw = source === undefined || source === null ? '' : String(source)
  const trimmed = raw.trim()
  const transform = config.transform || 'pascal'
  let name: string
  switch (transform) {
    case 'raw':
      name = trimmed
      break
    case 'camel':
      name = makeCamelName(trimmed)
      if (name) name = name.charAt(0).toLowerCase() + name.slice(1)
      break
    case 'upper':
      name = toSnakeCase(trimmed).toUpperCase()
      break
    case 'lower':
      name = toSnakeCase(trimmed).toLowerCase()
      break
    case 'pascal':
    default:
      name = makeCamelName(trimmed)
      break
  }

  if (!name) {
    return ''
  }

  if (config.prefix) {
    name = `${config.prefix}${name}`
  }
  if (config.suffix) {
    name = `${name}${config.suffix}`
  }

  return name
}

function toSnakeCase(value: string): string {
  if (!value) return ''
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '')
}
