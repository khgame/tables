import {readAndTranslate} from '../utils/read'
import * as Path from 'path'
import * as fs from 'fs-extra'

/**
 * serialize files with selected serializers
 * @param {string} pathIn - input file path
 * @param {string} dirOut - output dir
 * @param {context} the context to build schema
 * @param {Object.<string,Serializer>} serializers
 */
export function serialize(pathIn, dirOut, serializers, context) {
    let plugins = Object.values(serializers).reduce((prev, cur) => cur.plugins ? prev.concat(cur.plugins) : prev, []);

    let contextHandelers = Object.values(serializers).reduce((prev, cur) => cur.context ? prev.concat(cur.context) : prev, []);
    // console.log('plugins', plugins)
    // console.dir(Object.values(serializers))

    let ret = readAndTranslate(pathIn, {
        plugins
    }, context);

    for (let outName in serializers) {
        let fileContent = serializers[outName].file(ret, Path.parse(pathIn).name, '', context);
        fs.outputFileSync(Path.resolve(dirOut, outName), fileContent)
    }
}

export * from './jsonSerializer'
export * from './jsSerializer'
export * from './tsSerializer'
export * from './tsInterfaceSerializer'
