const {
    serialize,
    jsonSerializer,
    tsSerializer,
    tsInterfaceSerializer
} = require('..');

// serialize(`${__dirname}/example.xlsx`, __dirname,
//   {
//     'example.json': jsonSerializer,
//     'example.ts': tsSerializer,
//     'exampleInterface.ts': tsInterfaceSerializer
//   }
// )

serialize(`${__dirname}/hero_advance.xlsx`, __dirname,
    {
        'example.json': jsonSerializer,
        'example.ts': tsSerializer,
        'exampleInterface.ts': tsInterfaceSerializer
    }, {
        enums: {
            HERO_TYPE: {
                ONE: 1,
                TWO: 2,
                THREE: 'three'
            }
        }
    }
);

// Serializer.serialize(`${__dirname}/global_config.xlsx`, __dirname,
//   {
//     'global_config.json': Serializer.jsonSerializer,
//     'global_config.ts': Serializer.tsInterfaceSerializer
//   }
// )
