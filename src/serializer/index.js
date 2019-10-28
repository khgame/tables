import {readAndTranslate} from '../utils/read'
import * as Path from 'path'
import * as fs from 'fs-extra'

import {FileWalker} from "kht"

/**
 * serialize files with selected serializers
 * @param {string} pathIn - input file path
 * @param {string} dirOut - output dir
 * @param {context} the context to build schema
 * @param {Object.<string,Serializer>} serializers
 */
export function serialize(pathIn, dirOut, serializers, context) {
    let plugins = Object.values(serializers).reduce((prev, cur) => cur.plugins ? prev.concat(cur.plugins) : prev, []);

    let ret = readAndTranslate(pathIn, {
        plugins
    }, context);

    for (let outName in serializers) {
        let fileContent = serializers[outName].file(ret, Path.parse(pathIn).name, 'import * as TableContext from "./context";', context);
        fs.outputFileSync(Path.resolve(dirOut, outName), fileContent)
    }
}

export function loadContext(dirIn) {
    const context = {};
    FileWalker.forEachSync(dirIn, (fileObj) => {
            const fileName = fileObj.parsed.base.replace(/^context\./i, '').replace(/\.json$/i, '');
            const metas = fileName.split('.');
            if (metas.length < 0 || !metas[0]) {
                console.error(`load file ${fileName} failed: format error`);
                return;
            }

            const blobName = metas[0];
            if (context[blobName]) {
                const appendBlob = fs.readJsonSync(fileObj.path);
                for (const key in appendBlob) {
                    if (context[blobName][key]) {
                        console.error(`load context ${key} of blob ${blobName} failed: blobs with same name is already exist`);
                    }
                    context[blobName][key] = appendBlob[key];
                }
            } else {
                context[blobName] = fs.readJsonSync(fileObj.path);
            }

        }, false, file => file.match(/^context\..*\.json/i) && !file.startsWith('~')
    );
    console.log('context loaded:', dirIn, Object.keys(context));
    return context;
}

export function serializeContext(dirOut, serializers, context) {
    let contextDealers = Object.values(serializers).reduce(
        (prev, cur) => (cur.contextDealer && prev.indexOf(cur) < 0) ? prev.concat(cur.contextDealer) : prev,
        []
    );

    let strs = "export const TABLE_CONTEXT_VERSION = 0; \n";
    for (const i in contextDealers) {
        const contextDealer = contextDealers[i];
        strs += contextDealer(context) + "\n";
    }

    fs.writeFileSync(Path.resolve(dirOut, 'context.ts'), strs);
}

export * from './jsonSerializer'
export * from './jsSerializer'
export * from './tsSerializer'
export * from './tsInterfaceSerializer'
