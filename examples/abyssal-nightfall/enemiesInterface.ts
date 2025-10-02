/** this file is auto generated */
import * as TableContext from "./context";
        
export type EnemiesTID = string & { readonly __EnemiesTID: unique symbol };

export interface IEnemies {
  sector: number;
  category: number;
  serial: number;
  name: string;
  family: "EnemyFamily";
  hp: number;
  damage: number;
  moveSpeed: number;
  radius: number;
  attackStyle: "AttackStyle";
  attackInterval: number;
  projectileSpeed: number;
  projectileLifetime: number;
  projectileSprite: string;
  impactSprite: string;
  weakness: "DamageType";
  resistance: "DamageType";
  lootTable: string;
  sanityDamage: number;
  combatNotes: string;
  xp: number;
  sprite: string;
  spriteScale: number;
  deathSprite: string;
  deathSfx: string;
  attackSfx: string;
}
