/** this file is auto generated */
import * as TableContext from "./context";
        
export type ArtifactsTID = string & { readonly __ArtifactsTID: unique symbol };

export interface IArtifacts {
  categoryCode: number;
  subtypeCode: number;
  sequenceCode: number;
  sequence: number;
  name: string;
  effectType: "ArtifactEffectType";
  effectValue: number;
  costPoints: number;
  desc: string;
  icon: string;
}
