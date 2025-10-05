const Path = require('path')
const fs = require('fs-extra')
const {
  serialize,
  jsonSerializer,
  tsSerializer,
  tsInterfaceSerializer,
  loadContext,
  serializeContext
} = require('..');

// serialize(`${__dirname}/example.xlsx`, __dirname,
//   {
//     'example.json': jsonSerializer,
//     'exampleSolution.ts': tsSerializer,
//     'example.ts': tsInterfaceSerializer
//   }
// )
const context = loadContext(__dirname);
const outDir = Path.resolve(__dirname, 'out')
fs.ensureDirSync(outDir)
const serializers = {
  'example.json': jsonSerializer,
  'exampleSolution.ts': tsSerializer,
  'example.ts': tsInterfaceSerializer
};
// generate context.ts and artifacts under example/out
serializeContext(outDir, Object.values(serializers), context);
serialize(`${__dirname}/hero_advance.xlsx`, outDir, serializers, context);

// Serializer.serialize(`${__dirname}/global_config.xlsx`, __dirname,
//   {
//     'global_config.json': Serializer.jsonSerializer,
//     'global_config.ts': Serializer.tsInterfaceSerializer
//   }
// )
