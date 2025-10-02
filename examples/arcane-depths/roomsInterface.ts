/** this file is auto generated */
import * as TableContext from "./context";
        
export type RoomsTID = string & { readonly __RoomsTID: unique symbol };

export interface IRooms {
  familyCode: number;
  roomTypeCode: number;
  roomCode: number;
  variantCode: number;
  sequence: number;
  roomType: "RoomType";
  name: string;
  chapterId: number|undefined;
  description: string;
  enemyId: number|undefined;
  eventId: number|undefined;
  rewardType: "RewardType";
  rewardValue: string;
  specialRule: string|undefined;
}
