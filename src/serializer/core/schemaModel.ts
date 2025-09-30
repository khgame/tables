import deepEqual from 'deep-equal'
import { MarkType, SDMType, SupportedTypes } from '@khgame/schema'

export type PrimitiveName = 'string' | 'number' | 'boolean' | 'any' | 'undefined'

export type TypeNode =
  | PrimitiveType
  | LiteralType
  | EnumReferenceType
  | ObjectType
  | ArrayType
  | TupleType
  | UnionType

export interface PrimitiveType {
  kind: 'primitive';
  name: PrimitiveName;
}

export interface LiteralType {
  kind: 'literal';
  value: string | number | boolean;
}

export interface EnumValue {
  name: string;
  value: string | number;
  description?: string;
}

export interface EnumReferenceType {
  kind: 'enum';
  name: string;
  values: EnumValue[];
  ref: string;
}

export interface ObjectField {
  name: string;
  type: TypeNode;
}

export interface ObjectType {
  kind: 'object';
  fields: ObjectField[];
  style?: 'inline' | 'block';
}

export interface ArrayType {
  kind: 'array';
  element?: TypeNode;
  empty?: boolean;
  origin?: 'sdm' | 'tnode';
  representation?: 'generic' | 'shorthand';
  childCount?: number;
}

export interface TupleType {
  kind: 'tuple';
  elements: TypeNode[];
}

export interface UnionType {
  kind: 'union';
  variants: TypeNode[];
}

export type SchemaModel = TypeNode

interface NamedType {
  name?: string;
  type: TypeNode;
}

const STRICT_MARK = '$strict'
const GHOST_MARK = '$ghost'

export function buildSchemaModel(schema: any, descLine: any, markCols: any[], context: any): SchemaModel {
  const descs = markCols.map((c: string) => (descLine || {})[c])
  const { type } = convertSDM(schema, descs, context, 0)
  return type
}

function convertSDM(sdm: any, descs: any[], context: any, depth: number): NamedType {
  const name = typeof sdm.markInd === 'number' ? descs[sdm.markInd - 1] : undefined
  const strict = Array.isArray(sdm.mds) && sdm.mds.includes(STRICT_MARK)
  const ghost = Array.isArray(sdm.mds) && sdm.mds.includes(GHOST_MARK)

  const children: NamedType[] = (sdm.marks || []).map((mark: any) => {
    if (mark.markType === MarkType.SDM) {
      return convertSDM(mark, descs, context, depth + 1)
    }
    if (mark.markType === MarkType.TDM) {
      return convertTDM(mark, descs, context)
    }
    return { type: createPrimitive('any') }
  })

  switch (sdm.sdmType) {
    case SDMType.Arr: {
      if (strict) {
        const tupleElements = uniqueTypes(children.map(c => c.type))
        let tuple: TypeNode = { kind: 'tuple', elements: tupleElements }
        if (ghost) {
          tuple = addUndefined(tuple)
        }
        return { name, type: tuple }
      }
      const normalized = children
        .map(child => removeUndefined(child.type))
        .filter((entry): entry is { type: TypeNode; removed: boolean } => !!entry.type)
      const elementType = combineUnion(normalized.map(item => item.type))
      let arrayType: ArrayType
      if (!elementType) {
        arrayType = { kind: 'array', empty: true, origin: 'sdm', childCount: 0 }
      } else {
        arrayType = {
          kind: 'array',
          element: elementType,
          origin: 'sdm',
          childCount: normalized.length
        }
      }
      if (ghost) {
        arrayType = addUndefined(arrayType)
      }
      return { name, type: arrayType }
    }
    case SDMType.Obj: {
      const fields = children
        .filter(child => child.name)
        .map(child => ({ name: String(child.name), type: child.type }))
      let objectType: ObjectType = { kind: 'object', fields, style: 'block' }
      if (ghost) {
        objectType = addUndefined(objectType)
      }
      return { name, type: objectType }
    }
    default:
      return { name, type: createPrimitive('any') }
  }
}

function convertTDM(tdm: any, descs: any[], context: any): NamedType {
  const name = descs[tdm.markInd]
  const variants: TypeNode[] = []
  for (let i = 0; i < tdm.innerCount; i++) {
    const inner = tdm.inner(i)
    variants.push(convertTNode(inner, context))
  }
  const type = combineUnion(variants)
  return { name, type: type || createPrimitive('any') }
}

function convertTNode(node: any, context: any): TypeNode {
  switch (node.tName) {
    case SupportedTypes.String:
      return createPrimitive('string')
    case SupportedTypes.Float:
    case SupportedTypes.UFloat:
    case SupportedTypes.Int:
    case SupportedTypes.UInt:
      return createPrimitive('number')
    case SupportedTypes.Boolean:
      return createPrimitive('boolean')
    case SupportedTypes.Undefined:
      return createPrimitive('undefined')
    case SupportedTypes.Any:
      return createPrimitive('any')
    case SupportedTypes.Array: {
      const elementTypes = (node.tSeg?.nodes || []).map((n: any) => convertTNode(n, context))
      const elementType = combineUnion(elementTypes)
      return {
        kind: 'array',
        element: elementType || createPrimitive('any'),
        origin: 'tnode',
        representation: node.innerCount > 1 ? 'generic' : 'shorthand'
      }
    }
    case SupportedTypes.Pair: {
      const valueTypes = (node.tSeg?.nodes || []).map((n: any) => convertTNode(n, context))
      const valueType = combineUnion(valueTypes) || createPrimitive('any')
      return {
        kind: 'object',
        fields: [
          { name: 'key', type: createPrimitive('string') },
          { name: 'val', type: valueType }
        ],
        style: 'inline'
      }
    }
    case SupportedTypes.Enum: {
      const variants = (node.tSeg?.nodes || []).map((n: any) => convertEnumVariant(n, context))
      return combineUnion(variants) || createPrimitive('string')
    }
    default:
      if (typeof node.rawName === 'string') {
        return { kind: 'literal', value: node.rawName }
      }
      return createPrimitive('any')
  }
}

function convertEnumVariant(node: any, context: any): TypeNode {
  const rawName = node.rawName
  if (rawName && context && context.enums && context.enums[rawName]) {
    const enumBlob = context.enums[rawName]
    const values = Object.keys(enumBlob || {}).map((key: string) => {
      const rawValue = enumBlob[key]
      if (Array.isArray(rawValue)) {
        return { name: key, value: rawValue[0], description: rawValue[1] ? String(rawValue[1]) : undefined }
      }
      return { name: key, value: rawValue }
    })
    return {
      kind: 'enum',
      name: rawName,
      ref: `TableContext.${rawName}`,
      values
    }
  }
  if (rawName !== undefined) {
    return { kind: 'literal', value: rawName }
  }
  return createPrimitive('any')
}

function createPrimitive(name: PrimitiveName): PrimitiveType {
  return { kind: 'primitive', name }
}

function combineUnion(types: TypeNode[]): TypeNode | null {
  const flattened: TypeNode[] = []
  types.forEach(type => {
    if (!type) return
    if (type.kind === 'union') {
      flattened.push(...type.variants)
      return
    }
    flattened.push(type)
  })
  const unique = uniqueTypes(flattened)
  if (unique.length === 0) return null
  if (unique.length === 1) return unique[0]
  return { kind: 'union', variants: unique }
}

function uniqueTypes(types: TypeNode[]): TypeNode[] {
  const ret: TypeNode[] = []
  types.forEach(type => {
    if (!ret.some(existing => deepEqual(existing, type))) {
      ret.push(type)
    }
  })
  return ret
}

function addUndefined(type: TypeNode): TypeNode {
  if (isUndefinedType(type)) return type
  if (type.kind === 'union') {
    if (type.variants.some(isUndefinedType)) {
      return type
    }
    return { kind: 'union', variants: [...type.variants, createPrimitive('undefined')] }
  }
  return { kind: 'union', variants: [type, createPrimitive('undefined')] }
}

function removeUndefined(type: TypeNode): { type: TypeNode | null; removed: boolean } {
  if (isUndefinedType(type)) {
    return { type: null, removed: true }
  }
  if (type.kind === 'union') {
    const filtered = type.variants.filter(variant => !isUndefinedType(variant))
    if (filtered.length === 0) {
      return { type: null, removed: true }
    }
    if (filtered.length === 1) {
      return { type: filtered[0], removed: filtered.length !== type.variants.length }
    }
    return { type: { kind: 'union', variants: filtered }, removed: filtered.length !== type.variants.length }
  }
  return { type, removed: false }
}

function isUndefinedType(type: TypeNode): boolean {
  return type.kind === 'primitive' && type.name === 'undefined'
}

export function isEmptyArray(node: TypeNode): node is ArrayType {
  return node.kind === 'array' && node.empty === true
}

export function isUnion(node: TypeNode): node is UnionType {
  return node.kind === 'union'
}

export function isTuple(node: TypeNode): node is TupleType {
  return node.kind === 'tuple'
}

export function isEnum(node: TypeNode): node is EnumReferenceType {
  return node.kind === 'enum'
}
