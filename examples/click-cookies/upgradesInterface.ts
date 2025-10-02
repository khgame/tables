/** this file is auto generated */
import * as TableContext from "./context";
        
export type UpgradesTID = string & { readonly __UpgradesTID: unique symbol };

export interface IUpgrades {
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
