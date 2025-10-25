/** this file is auto generated */
import * as TableContext from "./context";

export type UpgradesTID = TableContext.KHTableID;
export const toUpgradesTID = (value: string): UpgradesTID => value as UpgradesTID;

export interface IUpgrades {
  _tid: UpgradesTID;
  categoryCode: number;
  subtypeCode: number;
  sequenceCode: number;
  sequence: number;
  name: string;
  target: number;
  upgradeType: "UpgradeType";
  value: number;
  cost: number;
  desc: string;
  icon: string;
  unlockCookies: number;
}

export type UpgradesRaw = {
  tids: string[]
  result: Record<string, IUpgrades>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class UpgradesRepo {
  static fromRaw(data: UpgradesRaw): UpgradesRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toUpgradesTID(tid), value as IUpgrades])) as Record<UpgradesTID, IUpgrades>
    return new UpgradesRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<UpgradesTID, IUpgrades>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: UpgradesTID): IUpgrades {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[UpgradesRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IUpgrades[] {
    return Object.values(this.records) as IUpgrades[]
  }

  entries(): Array<[UpgradesTID, IUpgrades]> {
    return Object.entries(this.records).map(([tid, value]) => [toUpgradesTID(tid as string), value as IUpgrades])
  }
}

