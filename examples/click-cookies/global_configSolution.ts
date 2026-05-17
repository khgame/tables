/** this file is auto generated */
import * as TableContext from "./context";
import { IGlobalConfig, GlobalConfigTID, toGlobalConfigTID, GlobalConfigRepo } from "./global_config";
        
const raw = {
  "tids": [
    "90000001",
    "90000002",
    "90000003",
    "90000004",
    "90000005",
    "90000006",
    "90000007",
    "90000008",
    "90010001"
  ],
  "result": {
    "90000001": {
      "_tid": "90000001",
      "categoryCode": 90,
      "sectionCode": 0,
      "sequenceCode": 1,
      "sequence": 1,
      "key": "baseClick",
      "valueType": "Float",
      "value": 1,
      "description": "单次点击基础产量"
    },
    "90000002": {
      "_tid": "90000002",
      "categoryCode": 90,
      "sectionCode": 0,
      "sequenceCode": 2,
      "sequence": 2,
      "key": "tickInterval",
      "valueType": "Float",
      "value": 0.1,
      "description": "自动计算间隔（秒）"
    },
    "90000003": {
      "_tid": "90000003",
      "categoryCode": 90,
      "sectionCode": 0,
      "sequenceCode": 3,
      "sequence": 3,
      "key": "clickFloatDuration",
      "valueType": "Float",
      "value": 0.9,
      "description": "点击数字上浮动画时长（秒）"
    },
    "90000004": {
      "_tid": "90000004",
      "categoryCode": 90,
      "sectionCode": 0,
      "sequenceCode": 4,
      "sequence": 4,
      "key": "clickFloatDistance",
      "valueType": "Float",
      "value": 140,
      "description": "点击数字上浮距离（像素）"
    },
    "90000005": {
      "_tid": "90000005",
      "categoryCode": 90,
      "sectionCode": 0,
      "sequenceCode": 5,
      "sequence": 5,
      "key": "clickFloatSpread",
      "valueType": "Float",
      "value": 80,
      "description": "点击数字随机偏移范围（像素）"
    },
    "90000006": {
      "_tid": "90000006",
      "categoryCode": 90,
      "sectionCode": 0,
      "sequenceCode": 6,
      "sequence": 6,
      "key": "prestigeBase",
      "valueType": "Float",
      "value": 250000000,
      "description": "声望计算基数（总饼干 / 基数）"
    },
    "90000007": {
      "_tid": "90000007",
      "categoryCode": 90,
      "sectionCode": 0,
      "sequenceCode": 7,
      "sequence": 7,
      "key": "prestigeExponent",
      "valueType": "Float",
      "value": 0.6,
      "description": "声望计算指数"
    },
    "90000008": {
      "_tid": "90000008",
      "categoryCode": 90,
      "sectionCode": 0,
      "sequenceCode": 8,
      "sequence": 8,
      "key": "prestigeResetMultiplier",
      "valueType": "Float",
      "value": 1.08,
      "description": "每次声望提升的全局 CPS 乘数"
    },
    "90010001": {
      "_tid": "90010001",
      "categoryCode": 90,
      "sectionCode": 1,
      "sequenceCode": 1,
      "sequence": 9,
      "key": "autosaveInterval",
      "valueType": "UInt",
      "value": 30,
      "description": "自动保存秒数（演示用途）"
    }
  },
  "collisions": []
}

export const globalConfigRaw = raw;
export const globalConfigTids: GlobalConfigTID[] = raw.tids.map(toGlobalConfigTID);
export const globalConfigRecords: Record<GlobalConfigTID, IGlobalConfig> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toGlobalConfigTID(tid), value as IGlobalConfig])
);
export const globalConfig = globalConfigRecords;
export const globalConfigRepo = GlobalConfigRepo.fromRaw(raw);
