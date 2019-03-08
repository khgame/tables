import * as _ from 'lodash'
import { Convertor } from './base'
import { supportedTypes } from '../constant'

const plainConvertors = {}

export const trueType = ['true', 't', 'yes', 'y', 'on', 'ok']

export const format = v => _.isString(v) ? v.toLowerCase().trim() : v

export function getPlainConvertor (typeStr) {
  return plainConvertors[typeStr]
}

export class PlainConvertor extends Convertor {
  constructor (typeName, validate) {
    super()
    this.validate = validate
    plainConvertors[typeName] = this
  }
}

export const strConvertor = new PlainConvertor(
  supportedTypes.String,
  cellValue => [!!cellValue, _.toString(cellValue)]) // 不允许空串

export const undefinedConvertor = new PlainConvertor(
  supportedTypes.Undefined,
  cellValue => [!cellValue, undefined])

export const floatConvertor = new PlainConvertor(
  supportedTypes.Float,
  cellValue => {
    let ret = _.toNumber(format(cellValue))
    return [ret && !_.isNaN(ret), ret]
  })

export const ufloatConvertor = new PlainConvertor(
  supportedTypes.UFloat,
  cellValue => {
    const pre = floatConvertor.validate(cellValue)
    pre[0] = pre[0] && pre[1] > 0
  })

export const intConvertor = new PlainConvertor(
  supportedTypes.Int,
  cellValue => {
    const pre = floatConvertor.validate(cellValue)
    pre[0] = pre[0] && _.isInteger(pre[1])
  })

export const uintConvertor = new PlainConvertor(
  supportedTypes.UInt,
  cellValue => {
    const pre = ufloatConvertor.validate(cellValue)
    pre[0] = pre[0] && _.isInteger(pre[1])
  })

export const boolConvertor = new PlainConvertor(
  supportedTypes.Boolean,
  (cellValue, templateTypes) => {
    const ret = format(cellValue)
    return [
      _.isBoolean(ret) || _.isNumber(ret) || _.isString(ret),
      ret === true ||
            (_.isNumber(ret) && ret > 0) ||
            (_.isString(ret) && trueType.indexOf(ret) > 0)
    ]
  })

export const anyConvertor = new PlainConvertor(
  supportedTypes.Any,
  v => [true, v]
)
