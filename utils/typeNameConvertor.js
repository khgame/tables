const _ = require('lodash')
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

function getConvertor (typeName) {
  switch (typeName) {
    case 'string':
    case 'str':
      return str
    case 'double':
    case 'single':
    case 'float':
    case 'num':
    case 'number':
      return float
    case 'count':
    case 'ufloat':
      return ufloat
    case 'int':
    case 'int8':
    case 'int16':
    case 'int32':
    case 'int64':
    case 'long':
      return int
    case 'uint':
    case 'uint8':
    case 'uint16':
    case 'uint32':
    case 'uint64':
    case 'ulong':
    case 'tid':
    case '@':
      return uint
    case 'bool':
      return bool
    default:
      return v => console.log('conv skip :', v)
  }
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
