export const supportedTypes = {
  None: 'none',
  String: 'string',
  Float: 'float',
  UFloat: 'ufloat',
  Int: 'int',
  UInt: 'uint',
  Boolean: 'boolean',
  Undefined: 'undefined',
  Any: 'any', // not recommend
  Pair: 'pair', // not recommend
  Array: 'array' // not recommend
}

export const aliasTable = {
  [supportedTypes.String]: [supportedTypes.String, 'str'],
  [supportedTypes.Float]: [supportedTypes.Float, 'double', 'single', 'num', 'number'],
  [supportedTypes.UFloat]: [supportedTypes.UFloat, 'count'],
  [supportedTypes.Int]: [supportedTypes.Int, 'int', 'int8', 'int16', 'int32', 'int64', 'long'],
  [supportedTypes.UInt]: [supportedTypes.UInt, 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'ulong', 'tid', '@'],
  [supportedTypes.Boolean]: [supportedTypes.Boolean, 'bool', 'onoff'],
  [supportedTypes.Undefined]: [supportedTypes.Undefined],
  [supportedTypes.Any]: [supportedTypes.Any, 'dynamic', 'object', 'obj', 'any'],
  [supportedTypes.Pair]: [supportedTypes.Pair],
  [supportedTypes.Array]: [supportedTypes.Array]
}
