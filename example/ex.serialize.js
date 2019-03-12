const {
  serialize,
  jsonSerializer,
  tsSerializer,
  tsInterfaceSerializer
} = require('..')

serialize(`${__dirname}/example.xlsx`, __dirname,
  {
    'example.json': jsonSerializer,
    'example.ts': tsInterfaceSerializer,
    'iExample.ts': tsSerializer
  }
)

// Serializer.serialize(`${__dirname}/global_config.xlsx`, __dirname,
//   {
//     'global_config.json': Serializer.jsonSerializer,
//     'global_config.ts': Serializer.tsInterfaceSerializer
//   }
// )
