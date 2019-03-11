const {
  serialize,
  jsonSerializer,
  tsSerializer,
  tsInterfaceSerializer
} = require('..')

serialize(`${__dirname}/nft.building.xlsx`, __dirname,
  {
    'nft.building.json': jsonSerializer,
    'i_nft.building.ts': tsInterfaceSerializer,
    'nft.building.ts': tsSerializer
  }
)

// Serializer.serialize(`${__dirname}/global_config.xlsx`, __dirname,
//   {
//     'global_config.json': Serializer.jsonSerializer,
//     'global_config.ts': Serializer.tsInterfaceSerializer
//   }
// )
