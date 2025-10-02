/** this file is auto generated */
import * as TableContext from "./context";
        
export type WeaponsTID = string & { readonly __WeaponsTID: unique symbol };

export interface IWeapons {
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
