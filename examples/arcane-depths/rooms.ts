/** this file is auto generated */
import * as TableContext from "./context";

export type RoomsTID = TableContext.KHTableID;
export const toRoomsTID = (value: string): RoomsTID => value as RoomsTID;

export interface IRooms {
  _tid: RoomsTID;
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

export type RoomsRaw = {
  tids: string[]
  result: Record<string, IRooms>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class RoomsRepo {
  static fromRaw(data: RoomsRaw): RoomsRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toRoomsTID(tid), value as IRooms])) as Record<RoomsTID, IRooms>
    return new RoomsRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<RoomsTID, IRooms>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: RoomsTID): IRooms {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[RoomsRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IRooms[] {
    return Object.values(this.records) as IRooms[]
  }

  entries(): Array<[RoomsTID, IRooms]> {
    return Object.entries(this.records).map(([tid, value]) => [toRoomsTID(tid as string), value as IRooms])
  }
}

