export interface INftBuilding{
  ctype: number;
  building: number;
  level: number;
  name: string;
  upgrage: {
    to: number;
    dependency: ((number))[];
  };
  product: (({
      tid: number;
      num: number;
    }))[];
  cost: (({key: string, val: number}))[];
  arr: number[];
  pair: {key: string, val: number};
  map: {key: string, val: any}[];
  nest: ((((number))[])|(((((boolean))[]))[]))[];
  stars: ((number)|(boolean)|({key: string, val: number}));
  nestedArray: (({
      data: number;
    }))[];
  ax: any;

}

const data = {
  "tids": {
    "7": "2000000",
    "8": "2000001",
    "9": "2000002",
    "10": "2000003"
  },
  "result": {
    "2000000": {
      "ctype": 20,
      "building": 0,
      "level": 0,
      "name": "farm",
      "upgrage": {
        "to": 2000001
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
      "stars": 111,
      "nestedArray": [
        {
          "data": 111
        },
        {
          "data": 211
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
        ]
      ],
      "stars": 222,
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
        ]
      ],
      "stars": true,
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
        ]
      ],
      "stars": {
        "key": "sfajdf",
        "val": 123
      },
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
