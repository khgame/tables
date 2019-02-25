const _ = require('lodash')
const { supportedTypes, getTypeName } = require('./schemaConvertor')

const format = v => _.isString(v) ? v.toLowerCase().trim() : v

const str = v => _.toString(v)

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
  [supportedTypes.Undefined]: v => console.log('conv skip :', v),
  [supportedTypes.Array]: (v, args) => {
    if (!_.isString(v)) return v
    if (v.indexOf('|') < 0) return v.trim()
    let items = v.split('|').map(s => s.trim())
    if (args.length > 0) {
      let entryConvertor = getConvertor(args[0])
      // console.log('array convertor ', args[0], v)
      items = items.map(s => entryConvertor(s))
    }
    return items.length > 1 ? items : items[0]
  },
  [supportedTypes.Map]: (v, args) => {
    if (!_.isString(v)) {
      return v
    }
    if (v.indexOf('-') < 0) {
      return v.trim()
    }
    const split = v.split('-').map(s => s.trim())
    const kv = {
      key: split[0],
      val: split[1]
    }
    if (args.length > 0) {
      let entryConvertor = getConvertor(args[0])
      // console.log('map convertor ', args[0], v)
      kv.val = entryConvertor(kv.val)
    }
    return kv
  }
}

function getConvertor (typeName) {
  let typeObject = getTypeName(typeName)
  return v => typeConvertorMap[typeObject.type](v, typeObject.args)
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
