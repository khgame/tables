import {readAndTranslate} from '../utils/read'
import * as Path from 'path'
import * as fs from 'fs-extra'
import {tsSerializer} from "./tsSerializer";

const {FileWalker} = require('kht');

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
        let fileContent = serializers[outName].file(ret, Path.parse(pathIn).name, 'import * from "./context"', context);
        fs.outputFileSync(Path.resolve(dirOut, outName), fileContent)
    }
}

export function loadContext(dirIn) {
    const context = {};
    FileWalker.forEachSync(dirIn, fileObj => {
            context[Path.basename(fileObj.path).replace(/\.context\.json$/, '')] = fs.readJsonSync(fileObj.path);
        }, false, file => file.match(/.*\.context\.json/) && !file.startsWith('~')
    );
    console.log('context loaded:', dirIn, context);
    return context;
}

export function serializeContext(dirOut, serializers, context) {
    let contextDealers = Object.values(serializers).reduce(
        (prev, cur) => (cur.contextDealer && prev.indexOf(cur) < 0) ? prev.concat(cur.contextDealer) : prev,
        []
    );

    let strs = "";
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
