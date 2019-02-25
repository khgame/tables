const _ = require('lodash')
const { supportedTypes, getTypeName } = require('./schemaConvertor')

const format = v => _.isString(v) ? v.toLowerCase().trim() : v

const str = v => _.toString(format(v))

const float = v => {
  let ret = _.toNumber(format(v))
  if (_.isNaN(ret)) throw TypeError(`NAN : type error ${v} => ${ret}`)
  return ret
}
const ufloat = v => {
  let ret = float(format(v))
  if (ret < 0) throw TypeError(`must be ufloat value ${v} => ${ret}`)
  return ret
}
const int = v => {
  let ret = float(format(v))
  if (!_.isInteger(ret)) throw TypeError(`must be int value ${v} => ${ret}`)
  return ret
}
const uint = v => {
  let ret = int(format(v))
  if (ret < 0) throw TypeError(`must be uint value ${v} => ${ret}`)
  return ret
}
const bool = v => {
  let ret = format(v)
  return ret === true ||
        (_.isNumber(ret) && ret > 0) ||
        (_.isString(ret) && ((ret === 'true') || (ret === 't') || (ret === 'y')))
}

const typeConvertorMap = {
  [supportedTypes.String]: str,
  [supportedTypes.Float]: float,
  [supportedTypes.UFloat]: ufloat,
  [supportedTypes.Int]: int,
  [supportedTypes.UInt]: uint,
  [supportedTypes.Boolean]: bool,
  [supportedTypes.Undefined]: v => console.log('conv skip :', v)
}

function getConvertor (typeName) {
  return typeConvertorMap[getTypeName(typeName)]
}

module.exports = {
  str,
  float,
  ufloat,
  int,
  uint,
  bool,
  getConvertor
}
