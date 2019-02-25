const {
  Serializer
} = require('..')

Serializer.serialize(`${__dirname}/nft.building.xlsx`, __dirname,
  {
    'nft.building.json': Serializer.jsonSerializer,
    'nft.building.ts': Serializer.tsInterfaceSerializer
  }
)
