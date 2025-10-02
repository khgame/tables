/** this file is auto generated */
import * as TableContext from "./context";
        
export type EquipmentTID = string & { readonly __EquipmentTID: unique symbol };

export interface IEquipment {
  familyCode: number;
  itemCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  name: string;
  slot: "EquipmentSlot";
  rarity: number;
  craftCost: number;
  craftResource: "ResourceType";
  upgradeLevel: number;
  upgradeBonus: string;
  linkedRelic: number|undefined;
}
