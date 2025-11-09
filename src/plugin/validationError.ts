import type { ValidationErrorContext } from '../types'

export type ConvertErrorCode =
  | 'missing_tid_marker'
  | 'missing_tid_segment'
  | 'missing_tid_row'
  | 'tid_collision'
  | 'bigint_expected_numeric_string'
  | 'numeric_overflow'
  | 'multiple_alias_columns'
  | 'missing_alias_descriptor'
  | 'duplicate_alias'

export type ConvertErrorMetadata = ValidationErrorContext & {
  code: ConvertErrorCode;
}

export type ConvertError = Error & {
  convertErrorMeta?: ConvertErrorMetadata;
}

export function createConvertError(message: string, metadata: ConvertErrorMetadata): ConvertError {
  const error = new Error(message) as ConvertError
  error.convertErrorMeta = metadata
  return error
}

export function getConvertErrorMetadata(error: unknown): ConvertErrorMetadata | undefined {
  if (!error || typeof error !== 'object') return undefined
  const metadata = (error as ConvertError).convertErrorMeta
  return metadata && typeof metadata.code === 'string' ? metadata : undefined
}
