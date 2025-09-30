import { registerSerializerFormat } from './core/registry'
import type { Serializer } from '../types'
import { jsonSerializer } from './formats/json'
import { jsSerializer } from './formats/js'
import { tsSerializer } from './formats/ts'
import { tsInterfaceSerializer } from './formats/tsInterface'
import { jsonxSerializer } from './formats/jsonx'
import { goSerializer } from './formats/go'
import { csharpSerializer } from './formats/csharp'

const defaultFormats: Array<[string, { suffix: string; serializer: Serializer }]> = [
  ['json', { suffix: 'json', serializer: jsonSerializer }],
  ['js', { suffix: 'js', serializer: jsSerializer }],
  ['ts', { suffix: 'ts', serializer: tsSerializer }],
  ['ts-interface', { suffix: 'ts', serializer: tsInterfaceSerializer }],
  ['jsonx', { suffix: 'json', serializer: jsonxSerializer }],
  ['go', { suffix: 'go', serializer: goSerializer }],
  ['csharp', { suffix: 'cs', serializer: csharpSerializer }]
]

for (const [name, entry] of defaultFormats) {
  registerSerializerFormat(name, entry)
}

export * from './core'
export * from './formats/json'
export * from './formats/js'
export * from './formats/ts'
export * from './formats/tsInterface'
export * from './formats/jsonx'
export * from './formats/go'
export * from './formats/csharp'
export {
  registerSerializerFormat,
  getSerializerFormat,
  listSerializerFormats,
  removeSerializerFormat
} from './core/registry'
