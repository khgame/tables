export interface INftBuilding {
  ctype: number;
  building: number;
  level: number;
  name: string;
  upgrage: {
    to: number;
    dependency: number[];
  };
  product: Array<{
      tid: number;
      num: number;
    }>;
  cost: Array<{key: string, val: number}>;
  arr: number[];
  pair: {key: string, val: number};
  map: Array<{key: string, val: any}>;
  nest: Array<number[]|boolean[][]>;
  stars: Array<number|boolean|{key: string, val: number}>;
  nestedArray: Array<{data: number}|({data: number}|undefined)>;
  ax: number|string;
}


const data = {
  "tids": [
    "2000000",
    "2000001",
    "2000002",
    "2000003"
  ],
  "result": {
    "2000000": {
      "ctype": 20,
      "building": 0,
      "level": 0,
      "name": "farm",
      "upgrage": {
        "to": 2000001,
        "dependency": []
      },
      "product": [
        {
          "tid": 1000001,
          "num": 1
        }
      ],
      "cost": [
        {
          "key": "oil",
          "val": 388
        },
        {
          "key": "ore1",
          "val": 1551
        }
      ],
      "arr": [
        1,
        2,
        3
      ],
      "pair": {
        "key": "tag",
        "val": 0
      },
      "map": [
        {
          "key": "tag",
          "val": "0"
        }
      ],
      "nest": [
        [
          1,
          2,
          3
        ],
        [
          [
            true
          ]
        ]
      ],
      "stars": [
        111
      ],
      "nestedArray": [
        {
          "data": 111
        }
      ],
      "ax": 1
    },
    "2000001": {
      "ctype": 20,
      "building": 0,
      "level": 1,
      "name": "farm",
      "upgrage": {
        "to": 2000002,
        "dependency": [
          2000001
        ]
      },
      "product": [
        {
          "tid": 1000001,
          "num": 2
        }
      ],
      "cost": [
        {
          "key": "oil",
          "val": 416
        },
        {
          "key": "ore1",
          "val": 1663
        },
        {
          "key": "ore1",
          "val": 1663
        }
      ],
      "arr": [
        1,
        2,
        4
      ],
      "pair": {
        "key": "tag",
        "val": 1
      },
      "map": [
        {
          "key": "tag",
          "val": "s1"
        }
      ],
      "nest": [
        [
          1,
          2
        ],
        [
          []
        ]
      ],
      "stars": [
        222
      ],
      "nestedArray": [
        {
          "data": 111
        },
        {
          "data": 222
        }
      ],
      "ax": 2
    },
    "2000002": {
      "ctype": 20,
      "building": 0,
      "level": 2,
      "name": "farm",
      "upgrage": {
        "to": 2000003,
        "dependency": [
          2000001
        ]
      },
      "product": [
        {
          "tid": 1000001,
          "num": 3
        }
      ],
      "cost": [],
      "arr": [
        1,
        2,
        5
      ],
      "pair": {
        "key": "tag",
        "val": 2
      },
      "map": [
        {
          "key": "tag",
          "val": "s2"
        }
      ],
      "nest": [
        [
          1,
          2
        ],
        [
          []
        ]
      ],
      "stars": [
        true
      ],
      "nestedArray": [
        {
          "data": 111
        },
        {
          "data": 222
        }
      ],
      "ax": 2
    },
    "2000003": {
      "ctype": 20,
      "building": 0,
      "level": 3,
      "name": "farm",
      "upgrage": {
        "to": 2000004,
        "dependency": [
          2000001
        ]
      },
      "product": [
        {
          "tid": 1000001,
          "num": 4
        }
      ],
      "cost": [],
      "arr": [
        1,
        2,
        6
      ],
      "pair": {
        "key": "tag",
        "val": 3
      },
      "map": [
        {
          "key": "tag",
          "val": "s3"
        }
      ],
      "nest": [
        [
          1,
          2
        ],
        [
          []
        ]
      ],
      "stars": [
        {
          "key": "sfajdf",
          "val": 123
        }
      ],
      "nestedArray": [
        {
          "data": 111
        },
        {
          "data": 222
        }
      ],
      "ax": 2
    }
  }
}

export const nftBuilding: { [tid: string] : INftBuilding } = data.result ;
