/** this file is auto generated */
import * as TableContext from "./context";

export type CharactersTID = TableContext.KHTableID;
export const toCharactersTID = (value: string): CharactersTID => value as CharactersTID;

export interface ICharacters {
  _tid: CharactersTID;
  tid: number;
  roleType: TableContext.RoleType;
  name: string;
  entryEffect: string;
  exitEffect: string|undefined;
  enablesCards: "uint[]"|undefined;
  tags: string|undefined;
  defeatCondition: string|undefined;
  notes: string|undefined;
  quote: string;
  artwork: string;
}

export type CharactersRaw = {
  tids: string[]
  result: Record<string, ICharacters>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class CharactersRepo {
  static fromRaw(data: CharactersRaw): CharactersRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toCharactersTID(tid), value as ICharacters])) as Record<CharactersTID, ICharacters>
    return new CharactersRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<CharactersTID, ICharacters>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: CharactersTID): ICharacters {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[CharactersRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): ICharacters[] {
    return Object.values(this.records) as ICharacters[]
  }

  entries(): Array<[CharactersTID, ICharacters]> {
    return Object.entries(this.records).map(([tid, value]) => [toCharactersTID(tid as string), value as ICharacters])
  }
  getByByRole(key: string): ICharacters {
    const index = this.indexes["byRole"] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) {
      throw new Error(
        `[CharactersRepo] no entry for byRole '${String(key)}'`
      )
    }
    const tid = Array.isArray(bucket) ? bucket[0] : bucket
    return this.get(toCharactersTID(tid as string))
  }

  getByByName(key: string): ICharacters {
    const index = this.indexes["byName"] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) {
      throw new Error(
        `[CharactersRepo] no entry for byName '${String(key)}'`
      )
    }
    const tid = Array.isArray(bucket) ? bucket[0] : bucket
    return this.get(toCharactersTID(tid as string))
  }

  getAllByByTags(key: string): ICharacters[] {
    const index = this.indexes["byTags"] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) return []
    const tids = Array.isArray(bucket) ? bucket : [bucket as string]
    return tids.map(tid => this.get(toCharactersTID(tid as string)))
  }
}

