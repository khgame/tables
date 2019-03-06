export function culturelize (s) {
  s = s.toLowerCase()
  if (s.length <= 0) return ''
  let ret = s.substr(0, 1).toUpperCase() + s.substr(1)
  // console.log(ret)
  return ret
}

export function makeCamelName (fileName) {
  return fileName.split(/[\s._-]/).reduce((p, c) => p + culturelize(c), '')
}

export function makeInterfaceName (fileName) {
  return 'I' + makeCamelName(fileName)
}
