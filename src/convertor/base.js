export class Convertor {
  convert (v) {
    const validateRet = this.validate(v)
    if (validateRet[0]) throw TypeError(`TypeError: type error ${v} => ${validateRet}`)
    return validateRet[1]
  }
}
