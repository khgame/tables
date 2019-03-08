import * as _ from 'lodash'
import { Convertor } from './base'
import { getPlainConvertor } from './plainConvertor'
import { supportedTypes } from '../constant'

export class TemplateConvertor extends Convertor {
  constructor (typeObject) {
    super()
    this.innerConvertor = getConvertor(typeObject.args)
  }

  validate (v) {
    if (this.typeObject.type === supportedTypes.Array) {
      let items = !v ? [] : ((!_.isString(v) || v.indexOf('|') < 0) ? [v] : v.split('|').map(s => s.trim()))
      const result = items.map(item => this.innerConvertor.validate(item)).reduce((prev, item) => {
        prev[0] = prev[0] && item[0]
        prev[1].push(item[1])
      }, [true, []])
      return result
    } else {
      if (this.typeObject.type === supportedTypes.Pair) {
        if (!_.isString(v)) {
          throw TypeError(`must be string value ${v} of pair that match the schema 'key:val'`)
        }
        if (v.indexOf(':') < 0) {
          throw TypeError(`must be ${v} of pair that match the schema 'key:val'`)
        }
        const split = v.split(':').map(s => s.trim())
        const kv = {
          key: split[0],
          val: split[1]
        }
        const pre = this.innerConvertor.validate(kv.val)
        kv.val = pre[1]
        return [pre[0], kv]
      }
    }
  }
}

export class TypeConvertor extends Convertor {
  constructor (typeObject) {
    super()
    this.typeObject = typeObject
    this.useConvertor = this.typeObject.args.length <= 0 ? getPlainConvertor(this.typeObject.type) : new TemplateConvertor(typeObject)
  }

  validate (v) {
    return this.useConvertor.convert(v)
  }
}

export class GroupConvertor extends Convertor {
  constructor (typeObjects) {
    super()
    this.convertors = typeObjects.map(tObj => new TypeConvertor(tObj))
  }

  validate (v) {
    for (const i in this.convertors) {
      const ret = this.convertors[i].validate(v)
      if (ret[0]) return ret
    }
    return [false, undefined]
  }
}

export function getConvertor (typeObjects) {
  // const typeObjects = analyzeTypeSegment(typeSegment)
  if (typeObjects.length <= 0) {
    throw new Error('type missed')
  } else if (typeObjects.length === 1) {
    return new TypeConvertor(typeObjects[0])
  } else {
    return new GroupConvertor(typeObjects)
  }
}
