/** this file is auto generated */
import * as TableContext from "./context";

export type WeaponsTID = TableContext.KHTableID;
export const toWeaponsTID = (value: string): WeaponsTID => value as WeaponsTID;

export interface IWeapons {
  _tid: WeaponsTID;
  sector: number;
  category: number;
  serial: number;
  name: string;
  categoryName: "WeaponCategory";
  attackStyle: "AttackStyle";
  damage: number;
  damageType: "DamageType";
  fireRate: number;
  reload: number;
  magazine: number;
  spread: number;
  projectileSpeed: number;
  maxRange: number;
  projectileLifetime: number;
  travelSprite: string;
  impactSprite: string;
  muzzleSprite: string;
  notes: string;
  fireSfx: string;
  impactSfx: string;
  projectileScale: number;
  impactScale: number;
}

export type WeaponsRaw = {
  tids: string[]
  result: Record<string, IWeapons>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class WeaponsRepo {
  static fromRaw(data: WeaponsRaw): WeaponsRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toWeaponsTID(tid), value as IWeapons])) as Record<WeaponsTID, IWeapons>
    return new WeaponsRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<WeaponsTID, IWeapons>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: WeaponsTID): IWeapons {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[WeaponsRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IWeapons[] {
    return Object.values(this.records) as IWeapons[]
  }

  entries(): Array<[WeaponsTID, IWeapons]> {
    return Object.entries(this.records).map(([tid, value]) => [toWeaponsTID(tid as string), value as IWeapons])
  }
}

