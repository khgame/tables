import {FileWalker} from "kht"
import {tsSerializer} from "../serializer/tsSerializer";
import {serialize, loadContext, serializeContext} from "../serializer";
import {makeInterfaceName} from "../utils/names";
import * as fs from "fs-extra";
import * as Path from "path";

function culture(s) {
    s = s.toLowerCase();
    if (s.length <= 0) return '';
    let ret = s.substr(0, 1).toUpperCase() + s.substr(1).toLowerCase();
    return ret
}

export function exportTablesToTs(dirIn, dirOut) {
    const exportLst = [];
    const testLst = [];

    const context = loadContext(dirIn);
    fs.ensureDirSync(dirOut);
    serializeContext(dirOut, [tsSerializer], context);

    FileWalker.forEachSync(
        dirIn,
        fileObj => {
            console.log("> Try generate table : [[", fileObj.path, "]]");
            const fileName = fileObj.parsed.name.split("_").filter(x => x).map(culture).reduce((prev, cur) => prev + cur, "i");

            exportLst.push(fileName);
            testLst.push(fileObj.parsed.name);

            serialize(fileObj.path, dirOut, {
                [`${fileName}.ts`]: tsSerializer
            }, context);
        }, false, file => !file.match(/\..*\.swp/) && file.match(/.*\.xlsx/) && !file.startsWith('~')
    );

    let importInterfaceStr = '';
    let exportInterfaceStr = '';
    let interfaceStr = "export interface IConfig {\n";
    let fieldsStr = "";
    testLst.forEach((cur, i) => {
        const unixName = cur;
        const interfaceName = makeInterfaceName(cur);
        const fieldName = interfaceName.substr(1, 1).toLowerCase() + interfaceName.substr(2);
        exportInterfaceStr += `export {${interfaceName}, ${fieldName}} from "./${exportLst[i]}";\n`;
        importInterfaceStr += `import {${interfaceName}, ${fieldName}} from "./${exportLst[i]}";\n`;
        interfaceStr += `    ${cur}: { [key: string]: ${interfaceName}};\n`;
        fieldsStr += `    ${fieldName},\n`;
        if (unixName !== fieldName) {
            fieldsStr += `    ${unixName}: ${fieldName},\n`;
        }
    });
    interfaceStr += "    [tableName: string]: any;\n}\n";

    fs.writeFileSync(Path.resolve(dirOut, "index.ts"), `/** this file is auto generated */    
${importInterfaceStr}

${exportInterfaceStr}

export * from "./context";

/** 
 * all in one file of all configs
 */
${interfaceStr}

export const __t: IConfig = {
${fieldsStr}
} as IConfig;
    
    `);
}
