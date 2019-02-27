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
  arr: number[];
  pair: {key: string, val: number};
  map: {key: string, val: any}[];
  nest: ((((number))[])|(((((boolean))[]))[]))[];

}

const data = {
  "tids": {
    "7": "2000000",
    "8": "2000001",
    "9": "2000002",
    "10": "2000003",
    "11": "2000004",
    "12": "2000005",
    "13": "2000006",
    "14": "2000007",
    "15": "2000008"
  },
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
      ]
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
      ]
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
        ],
        [
          []
        ]
      ]
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
        ],
        [
          []
        ]
      ]
    },
    "2000004": {
      "ctype": 20,
      "building": 0,
      "level": 4,
      "name": "farm",
      "upgrage": {
        "to": 2000005,
        "dependency": [
          2000001
        ]
      },
      "product": [
        {
          "tid": 1000001,
          "num": 5
        }
      ],
      "arr": [
        1,
        2,
        7
      ],
      "pair": {
        "key": "tag",
        "val": 4
      },
      "map": [
        {
          "key": "tag",
          "val": "s4"
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
      ]
    },
    "2000005": {
      "ctype": 20,
      "building": 0,
      "level": 5,
      "name": "farm",
      "upgrage": {
        "to": 2000006,
        "dependency": [
          2000001
        ]
      },
      "product": [
        {
          "tid": 1000001,
          "num": 6
        }
      ],
      "arr": [
        1,
        2,
        8
      ],
      "pair": {
        "key": "tag",
        "val": 5
      },
      "map": [
        {
          "key": "tag",
          "val": "s5"
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
      ]
    },
    "2000006": {
      "ctype": 20,
      "building": 0,
      "level": 6,
      "name": "farm",
      "upgrage": {
        "to": 2000007,
        "dependency": [
          2000001
        ]
      },
      "product": [
        {
          "tid": 1000001,
          "num": 7
        }
      ],
      "arr": [
        1,
        2,
        9
      ],
      "pair": {
        "key": "tag",
        "val": 6
      },
      "map": [
        {
          "key": "tag",
          "val": "s6"
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
      ]
    },
    "2000007": {
      "ctype": 20,
      "building": 0,
      "level": 7,
      "name": "farm",
      "upgrage": {
        "to": 2000008,
        "dependency": [
          2000001
        ]
      },
      "product": [
        {
          "tid": 1000001,
          "num": 8
        }
      ],
      "arr": [
        1,
        2,
        10
      ],
      "pair": {
        "key": "tag",
        "val": 7
      },
      "map": [
        {
          "key": "tag",
          "val": "s7"
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
      ]
    },
    "2000008": {
      "ctype": 20,
      "building": 0,
      "level": 8,
      "name": "farm",
      "upgrage": {
        "to": 2000009,
        "dependency": [
          2000001
        ]
      },
      "product": [
        {
          "tid": 1000001,
          "num": 9
        }
      ],
      "arr": [
        1,
        2,
        11
      ],
      "pair": {
        "key": "tag",
        "val": 8
      },
      "map": [
        {
          "key": "tag",
          "val": "s8"
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
      ]
    }
  }
}

export const nftBuilding: { [tid: string] : INftBuilding } = data.result ;
