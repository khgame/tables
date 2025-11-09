import { readAndTranslate } from '../../utils/read'
import * as Path from 'path'
import * as fs from 'fs-extra'
import { FileWalker } from 'kht'
import type { Context, Serializer } from '../../types'
import type { ConvertErrorMetadata } from '../../plugin/validationError'
import { makeCamelName, makeInterfaceName } from '../../utils/names'
import { resolveContextEnums } from '../../context/enumResolver'
import { tableSchema } from '../../plugin/schema'
import { tableConvert } from '../../plugin/convert'
import { getConvertErrorMetadata } from '../../plugin/validationError'
import { buildSchemaModel } from './schemaModel'
import { parseValidationErrorContext } from './validationErrorContext'

export { buildStableConvertPayload } from './convertPayload'
export { parseValidationErrorContext } from './validationErrorContext'

export type InspectDiagnostics = {
  fileName: string;
  sheetName?: string;
  marks?: any;
  markCols: string[];
  descLine: Record<string, string>;
  schema: {
    present: boolean;
    model?: any;
    error?: string;
  };
  convert: {
    present: boolean;
    tidCount: number;
    resultCount: number;
    collisionCount: number;
    indexCount: number;
    aliasCount: number;
    meta?: any;
    error?: string;
    errorMeta?: ConvertErrorMetadata;
  };
}

export type ValidationMessage = {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  location?: {
    sheetName?: string;
    row?: number;
    column?: string;
    fieldPath?: string;
  };
  diagnosticPath?: string;
  details?: Record<string, unknown>;
}

export type ValidationResult = {
  success: boolean;
  fileName: string;
  sheetName?: string;
  diagnostics?: InspectDiagnostics;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
}

/**
 * serialize files with selected serializers
 */
export function serialize(pathIn: string, dirOut: string, serializers: Record<string, Serializer>, context?: Context) {
  const plugins = Array.from(new Set(
    Object.values(serializers).reduce((prev: any[], cur) => (cur.plugins ? prev.concat(cur.plugins) : prev), [])
  ))

  const fileName = Path.parse(pathIn).name
  const scopedContext: any = context || {}
  const previousTableMeta = scopedContext.__table
  scopedContext.__table = {
    fileName,
    camelName: makeCamelName(fileName),
    interfaceName: makeInterfaceName(fileName)
  }

  try {
    const ret = readAndTranslate(pathIn, { plugins }, scopedContext)

    for (const outName in serializers) {
      const fileContent = serializers[outName].file(ret as any, fileName, 'import * as TableContext from "./context";', scopedContext)
      fs.outputFileSync(Path.resolve(dirOut, outName), fileContent)
    }
  } finally {
    if (previousTableMeta === undefined) {
      delete scopedContext.__table
    } else {
      scopedContext.__table = previousTableMeta
    }
  }
}

export function validateTableFile(pathIn: string, options: { sheetName?: string } = {}, context?: Context): ValidationResult {
  const fileName = Path.parse(pathIn).name

  try {
    const diagnostics = inspectTableFile(pathIn, options, context)
    const errors: ValidationMessage[] = []
    const warnings: ValidationMessage[] = []

    if (diagnostics.schema.error) {
      errors.push(makeValidationMessage(diagnostics, 'schema_error', diagnostics.schema.error, 'schema.error'))
    }
    if (diagnostics.convert.error) {
      errors.push(makeValidationMessage(
        diagnostics,
        getConvertErrorCode(diagnostics.convert.error, diagnostics.convert.errorMeta),
        diagnostics.convert.error,
        'convert.error'
      ))
    }
    if (diagnostics.convert.collisionCount > 0) {
      errors.push(makeValidationMessage(
        diagnostics,
        'tid_collision',
        `Detected ${diagnostics.convert.collisionCount} TID collision(s).`,
        'convert.collisionCount',
        { collisionCount: diagnostics.convert.collisionCount }
      ))
    }

    return {
      success: errors.length === 0,
      fileName,
      sheetName: diagnostics.sheetName,
      diagnostics,
      errors,
      warnings
    }
  } catch (error: any) {
    return {
      success: false,
      fileName,
      errors: [{
        severity: 'error',
        code: 'inspect_error',
        message: error && error.message ? error.message : String(error)
      }],
      warnings: []
    }
  }
}

function getConvertErrorCode(message: string, metadata?: ConvertErrorMetadata): string {
  return metadata?.code === 'tid_collision' || message.toLowerCase().includes('tid collision')
    ? 'tid_collision'
    : 'convert_error'
}

function makeValidationMessage(
  diagnostics: InspectDiagnostics,
  code: string,
  message: string,
  diagnosticPath: string,
  details?: Record<string, unknown>
): ValidationMessage {
  const errorMeta = diagnosticPath === 'convert.error' && diagnostics.convert.error === message
    ? diagnostics.convert.errorMeta
    : undefined
  const parsed = parseValidationErrorContext(message, diagnostics, errorMeta)
  const ret: ValidationMessage = {
    severity: 'error',
    code,
    message,
    diagnosticPath
  }
  if (parsed.location) ret.location = parsed.location
  const mergedDetails = mergeDetails(parsed.details, details)
  if (mergedDetails) ret.details = mergedDetails
  return ret
}

function mergeDetails(...entries: Array<Record<string, unknown> | undefined>): Record<string, unknown> | undefined {
  const merged: Record<string, unknown> = {}
  entries.forEach(entry => {
    if (entry) Object.assign(merged, entry)
  })
  return Object.keys(merged).length > 0 ? merged : undefined
}

export function inspectTableFile(pathIn: string, options: { sheetName?: string } = {}, context?: Context): InspectDiagnostics {
  const fileName = Path.parse(pathIn).name
  const scopedContext: any = context || {}
  const previousTableMeta = scopedContext.__table
  scopedContext.__table = {
    fileName,
    camelName: makeCamelName(fileName),
    interfaceName: makeInterfaceName(fileName)
  }

  try {
    let schemaError: string | undefined
    const schemaPlugin = (tableForSchema: any, pluginContext: any) => {
      try {
        return tableSchema(tableForSchema, pluginContext)
      } catch (error: any) {
        schemaError = error && error.message ? error.message : String(error)
        return tableForSchema
      }
    }
    let table = readAndTranslate(pathIn, {
      sheetName: options.sheetName,
      plugins: [schemaPlugin]
    }, scopedContext)
    let convertError: string | undefined
    let convertErrorMeta: ConvertErrorMetadata | undefined

    if (!schemaError) {
      try {
        table = tableConvert(table, scopedContext)
      } catch (error: any) {
        convertError = error && error.message ? error.message : String(error)
        convertErrorMeta = getConvertErrorMetadata(error)
      }
    }

    const convert = (table as any).convert || {}
    const indexes = convert.indexes || {}
    const aliases = convert.aliases || {}
    const schemaInfo: InspectDiagnostics['schema'] = {
      present: !!(table as any).schema
    }

    if (schemaError) {
      schemaInfo.error = schemaError
    }
    if (schemaInfo.present) {
      try {
        schemaInfo.model = buildSchemaModel((table as any).schema, (table as any).descLine || {}, (table as any).markCols || [], scopedContext)
      } catch (error: any) {
        schemaInfo.error = error && error.message ? error.message : String(error)
      }
    }

    return {
      fileName,
      sheetName: (table as any).sheetName || options.sheetName,
      marks: (table as any).marks,
      markCols: (table as any).markCols || [],
      descLine: (table as any).descLine || {},
      schema: schemaInfo,
      convert: {
        present: !!(table as any).convert,
        tidCount: Array.isArray(convert.tids) ? convert.tids.length : 0,
        resultCount: convert.result ? Object.keys(convert.result).length : 0,
        collisionCount: Array.isArray(convert.collisions) ? convert.collisions.length : 0,
        indexCount: Object.keys(indexes).length,
        aliasCount: Object.keys(aliases).length,
        meta: convert.meta,
        error: convertError,
        errorMeta: convertErrorMeta
      }
    }
  } finally {
    if (previousTableMeta === undefined) {
      delete scopedContext.__table
    } else {
      scopedContext.__table = previousTableMeta
    }
  }
}

export function loadContext(dirIn: string) {
  const context: any = {}
  FileWalker.forEachSync(dirIn, (fileObj: any) => {
    const fileName = fileObj.parsed.base.replace(/^context\./i, '').replace(/\.json$/i, '')
    const metas = fileName.split('.')
    if (metas.length < 0 || !metas[0]) {
      console.error(`load file ${fileName} failed: format error`)
      return
    }

    const blobName = metas[0]
    if (context[blobName]) {
      const appendBlob = fs.readJsonSync(fileObj.path)
      for (const key in appendBlob) {
        if (context[blobName][key]) {
          console.error(`load context ${key} of blob ${blobName} failed: blobs with same name is already exist`)
        }
        context[blobName][key] = appendBlob[key]
      }
    } else {
      context[blobName] = fs.readJsonSync(fileObj.path)
    }
  }, false, (file: string) => /^context\..*\.json/i.test(file) && !file.startsWith('~'))
  resolveContextEnums(context, dirIn)
  if (process.env.TABLES_VERBOSE === '1') {
    console.log('context loaded:', dirIn, Object.keys(context))
  }
  return context
}

export function loadContextPath(pathIn: string) {
  const stat = fs.statSync(pathIn)
  if (stat.isDirectory()) {
    return loadContext(pathIn)
  }

  const blobName = getContextBlobName(pathIn)
  const json = fs.readJsonSync(pathIn)
  const context = blobName ? { [blobName]: json } : json
  resolveContextEnums(context, Path.dirname(pathIn))
  return context
}

function getContextBlobName(pathIn: string): string | null {
  const baseName = Path.basename(pathIn)
  const match = new RegExp('^context\\.([^.]+)(?:\\..*)?\\.json$', 'i').exec(baseName)
  return match ? match[1] : null
}

export function serializeContext(dirOut: string, serializers: Serializer[], context: any) {
  const contextDealers = Object.values(serializers).reduce(
    (prev: any[], cur: any) => (cur.contextDealer && prev.indexOf(cur.contextDealer) < 0) ? prev.concat(cur.contextDealer) : prev,
    [] as any[]
  )

  let strs = 'export type KHTableID = string & { readonly __KHTableID: unique symbol }; \n'
  strs += 'export const TABLE_CONTEXT_VERSION = 0; \n'
  for (const i in contextDealers) {
    const contextDealer = (contextDealers as any)[i]
    strs += contextDealer(context) + '\n'
  }
  fs.writeFileSync(Path.resolve(dirOut, 'context.ts'), strs)
}
