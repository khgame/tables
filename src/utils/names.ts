export function culturelize(s: string): string {
  s = s.toLowerCase()
  if (s.length <= 0) return ''
  const ret = s.substr(0, 1).toUpperCase() + s.substr(1)
  return ret
}

export function makeCamelName(fileName: string): string {
  return fileName.split(/[\s._-]/).reduce((p, c) => p + culturelize(c), '')
}

export function makeInterfaceName(fileName: string): string {
  return 'I' + makeCamelName(fileName)
}

