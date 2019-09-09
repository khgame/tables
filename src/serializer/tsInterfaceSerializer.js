import {makeInterfaceName} from '../utils/names'
import {tableSchema, tableConvert} from '../plugin'
import deepEqual from 'deep-equal'

import {MarkType, SDMType, SupportedTypes} from '@khgame/schema'
import {cyan} from 'chalk'

const _ = require('lodash');

function tNodeToType(node, context) {
    switch (node.tName) {
        case SupportedTypes.String:
            return 'string';
        case SupportedTypes.Float:
            return 'number';
        case SupportedTypes.UFloat:
            return 'number';
        case SupportedTypes.Int:
            return 'number';
        case SupportedTypes.UInt:
            return 'number';
        case SupportedTypes.Boolean:
            return 'boolean';
        case SupportedTypes.Undefined:
            return 'undefined';
        case SupportedTypes.Any:
            return 'any';
        case SupportedTypes.Array:
            return node.innerCount > 1 ? `Array<${tSegToType(node.tSeg, context) || 'any'}>` : `${tSegToType(node.tSeg, context) || 'any'}[]`;
        case SupportedTypes.Pair:
            return `{key: string, val: ${tSegToType(node.tSeg, context) || 'any'}}`;
        case SupportedTypes.Enum:
            return `${enumTSegToType(node.tSeg, context)}`;
        default:
            return `"${node.rawName}"`;
    }
}

function enumTSegToType(tSeg, context) {
    if (tSeg.nodes.length <= 0) { // no template
        return '';
    }
    return tSeg.nodes.reduce((prev, cur) => prev + '|' +
        ((context.enums || {})[cur.rawName] ? "TableContext." + cur.rawName : `${tNodeToType(cur, context)}`), '').substr(1);
}

function tSegToType(tSeg, context) {
    if (tSeg.nodes.length <= 0) { // no template
        return '';
    }
    const types = tSeg.nodes.map(n => tNodeToType(n, context));
    if (types.length <= 0) {
        throw new Error(`error: tdm ${JSON.stringify(tSeg)} are empty`);
    }
    return types.reduce((prev, cur) => prev + '|' + cur, '').substr(1);
}

function tdmToType(tdm, descs, context) {
    const types = [];
    for (let i = 0; i < tdm.innerCount; i++) {
        types.push(tNodeToType(tdm.inner(i), context))
    }
    return [descs[tdm.markInd], types.reduce((prev, cur) => prev + '|' + cur, '').substr(1)]
}

function mergeSdmArr(result, splitor, inNoStrictArray) {
    // console.log('result', result)
    if (inNoStrictArray) {
        result = result.map(s => [s[0], s[1].replace(/\|undefined$/, '')]).filter(s => s[1] !== 'undefined')
    }

    result = result.filter((item, index, array) => {
        return index === array.findIndex(v => {
            // console.log('deepEqual', item, v, deepEqual(item[1], v[1]))
            return deepEqual(item[1], v[1])
        })
    });
    let ret = result.reduce((prev, cur) => prev + splitor + cur[1], '').substr(splitor.length)
    // console.log('ret', ret)
    return ret
}

function sdmToType(sdm, descs, depth = 0, context = {}) {
    let result = [];
    sdm.marks.forEach(dm => {
        switch (dm.markType) {
            case MarkType.SDM:
                result.push(sdmToType(dm, descs, depth + 1, context));
                break;
            case MarkType.TDM:
                result.push(tdmToType(dm, descs, context));
                break;
        }
    });

    let ret = '';
    let space = '  '.repeat(depth + 1);
    let spaceOut = '  '.repeat(depth);
    switch (sdm.sdmType) {
        case SDMType.Arr:
            if (sdm.mds.findIndex(str => str === '$strict') >= 0) {
                ret = result.length <= 0
                    ? '[]'
                    : (result.length > 1
                            ? '[\n' + space + mergeSdmArr(result, ',\n' + space) + '\n' + spaceOut + ']'
                            : '[' + result[0][1] + ']'
                    )
            } else {
                ret = result.length <= 0
                    ? '[]'
                    : (result.length > 1 || result[0][1].length > 9
                            ? 'Array<' + mergeSdmArr(result, '|', true) + '>'
                            : result[0][1] + '[]'
                    )
            }
            if (sdm.mds.findIndex(str => str === '$ghost') >= 0) {
                ret += '|undefined'
            }
            break;
        case SDMType.Obj:
            ret = result.length <= 0
                ? '{}'
                : '{' +
                (result.length > 1
                        ? result.reduce((prev, cur) => prev + '\n' + space + cur[0] + ': ' + cur[1] + ';', '') + '\n' + spaceOut + '}'
                        : result[0][0] + ': ' + result[0][1] + '}'
                );
            if (sdm.mds.findIndex(str => str === '$ghost') >= 0) {
                ret += '|undefined'
            }
            break
    }
    return [descs[sdm.markInd - 1], ret]
    // deal string
}

export function dealSchema(schema, descLine, markCols, context) {
    const descs = markCols.map(c => descLine[c]);
    const ret = sdmToType(schema, descs, 0, context);
    console.log(cyan('tsInterface serializer dealSchema success'), JSON.stringify(ret[1], null, 2));
    return ret[1]
}

export function dealContext(context) {
    let enumExportsNames = [];
    if (context.meta && context.meta.exports && context.meta.exports.enum) {
        enumExportsNames = context.meta.exports.enum;
    }

    let str = '';
    for (const i in enumExportsNames) {
        const contextKeyName = enumExportsNames[i];
        const contextBlob = context[contextKeyName];
        if (!contextBlob) {
            throw new Error(`export enum failed: check if ${contextKeyName} are existed in your context`);
        }
        for (const enumName in contextBlob) {
            str += `/** These codes are auto generated :context.${contextKeyName}.${enumName} */
export enum ${enumName} {\n`;
            for (const keyName in contextBlob[enumName]) {
                let v = contextBlob[enumName][keyName];

                if (_.isArray(v)) {
                    if (v.length >= 2) {
                        str += `    /** ${v[1].replace(/\n/g, "; ")} */\n`;
                    }
                    v = v[0];
                }
                str += '    ' + keyName + ' = ' + (typeof v === "number" ? v : `"${v}"`) + ',\n';

            }
            str += '}\n\n'
        }
    }

    return str;
}

export const tsInterfaceSerializer = {
    plugins: [tableSchema, tableConvert],
    file: (data, fileName, imports, context) => {
        // console.log(data.schema)
        return `/** this file is auto generated */
${imports}
        
export interface ${makeInterfaceName(fileName)} ${dealSchema(data.schema, data.descLine, data.markCols, context)}
`;
    },
    contextDealer: dealContext
}
