/** this file is auto generated */
import * as TableContext from "./context";
        
export type FacilitiesTID = string & { readonly __FacilitiesTID: unique symbol };

export interface IFacilities {
  familyCode: number;
  facilityCode: number;
  levelCode: number;
  variantCode: number;
  sequence: number;
  name: string;
  type: "FacilityType";
  level: number;
  unlockResource: "ResourceType";
  unlockAmount: number;
  effectSummary: string;
  unlockRequirement: string|undefined;
}
