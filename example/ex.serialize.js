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
//     'example.ts': tsSerializer,
//     'exampleInterface.ts': tsInterfaceSerializer
//   }
// )
const context = loadContext(__dirname);
const serializers = {
    'example.json': jsonSerializer,
    'example.ts': tsSerializer,
    'exampleInterface.ts': tsInterfaceSerializer
};
serializeContext(__dirname, serializers, context);
serialize(`${__dirname}/hero_advance.xlsx`, __dirname, serializers
    , context
);

// Serializer.serialize(`${__dirname}/global_config.xlsx`, __dirname,
//   {
//     'global_config.json': Serializer.jsonSerializer,
//     'global_config.ts': Serializer.tsInterfaceSerializer
//   }
// )
