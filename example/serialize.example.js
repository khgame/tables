const {
  Serializer
} = require('..')

Serializer.serialize(`${__dirname}/nft.building.xlsx`, __dirname,
  {
    'nft.building.json': Serializer.jsonSerializer,
    'nft.building.ts': Serializer.tsInterfaceSerializer
  }
)

Serializer.serialize(`${__dirname}/global_config.xlsx`, __dirname,
  {
    'global_config.json': Serializer.jsonSerializer,
    'global_config.ts': Serializer.tsInterfaceSerializer
  }
)
