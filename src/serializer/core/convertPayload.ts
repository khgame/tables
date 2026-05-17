type StableConvertPayloadOptions = {
  includeMeta?: boolean;
  omitEmptyAliases?: boolean;
  omitEmptyIndexes?: boolean;
}

function sortByKeys<T extends Record<string, any>>(obj: T): T {
  const ret: any = {}
  Object.keys(obj).sort().forEach(k => { ret[k] = obj[k] })
  return ret
}

function hasKeys(obj: any): boolean {
  return !!obj && Object.keys(obj).length > 0
}

export function buildStableConvertPayload(convert: any = {}, options: StableConvertPayloadOptions = {}) {
  const {
    includeMeta = true,
    omitEmptyAliases = false,
    omitEmptyIndexes = false
  } = options
  const source = convert || {}
  const hasMeta = Object.prototype.hasOwnProperty.call(source, 'meta')
  const hasAliases = Object.prototype.hasOwnProperty.call(source, 'aliases')
  const hasIndexes = Object.prototype.hasOwnProperty.call(source, 'indexes')
  const { meta, aliases = {}, indexes = {}, ...rest } = source
  const stable: any = {
    ...rest,
    result: sortByKeys((convert && convert.result) || {})
  }

  if (includeMeta && hasMeta) {
    stable.meta = meta
  }
  if (hasAliases && (!omitEmptyAliases || hasKeys(aliases))) {
    stable.aliases = aliases
  }
  if (hasIndexes && (!omitEmptyIndexes || hasKeys(indexes))) {
    stable.indexes = indexes
  }

  return stable
}
