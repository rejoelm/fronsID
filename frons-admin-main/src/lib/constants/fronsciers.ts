/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/fronsciers.json`.
 */
export type Fronsciers = {
  "address": "28VkA76EcTTN746SxZyYT8NTte9gofeBQ2L4N8hfYPgd",
  "metadata": {
    "name": "fronsciers",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "initializeDociRegistry",
      "discriminator": [
        244,
        124,
        138,
        46,
        164,
        51,
        156,
        88
      ],
      "accounts": [
        {
          "name": "dociRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  111,
                  99,
                  105,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeEscrow",
      "discriminator": [
        243,
        160,
        77,
        153,
        11,
        92,
        48,
        209
      ],
      "accounts": [
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "mintDociNft",
      "discriminator": [
        182,
        241,
        79,
        8,
        123,
        77,
        146,
        130
      ],
      "accounts": [
        {
          "name": "manuscript",
          "writable": true
        },
        {
          "name": "dociRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  111,
                  99,
                  105,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "dociManuscript",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  111,
                  99,
                  105,
                  95,
                  109,
                  97,
                  110,
                  117,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "manuscript"
              }
            ]
          }
        },
        {
          "name": "dociMint",
          "writable": true,
          "signer": true
        },
        {
          "name": "author",
          "writable": true,
          "signer": true
        },
        {
          "name": "authorTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "author"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "dociMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "manuscriptTitle",
          "type": "string"
        },
        {
          "name": "manuscriptDescription",
          "type": "string"
        }
      ]
    },
    {
      "name": "registerUser",
      "discriminator": [
        2,
        241,
        150,
        223,
        99,
        214,
        116,
        97
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "wallet"
              }
            ]
          }
        },
        {
          "name": "wallet",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "education",
          "type": "string"
        }
      ]
    },
    {
      "name": "reviewManuscript",
      "discriminator": [
        34,
        232,
        222,
        65,
        219,
        116,
        224,
        13
      ],
      "accounts": [
        {
          "name": "manuscript",
          "writable": true
        },
        {
          "name": "reviewer",
          "signer": true
        },
        {
          "name": "author",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "manuscript.author",
                "account": "manuscript"
              }
            ]
          }
        },
        {
          "name": "escrowUsdAccount",
          "writable": true
        },
        {
          "name": "authorUsdAccount",
          "writable": true
        },
        {
          "name": "platformUsdAccount",
          "writable": true
        },
        {
          "name": "fronsMint",
          "writable": true
        },
        {
          "name": "escrow",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              }
            ]
          }
        },
        {
          "name": "escrowTokenAccount",
          "writable": true
        },
        {
          "name": "reviewerEscrowTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "decision",
          "type": "string"
        }
      ]
    },
    {
      "name": "submitManuscript",
      "discriminator": [
        148,
        104,
        148,
        175,
        255,
        99,
        109,
        216
      ],
      "accounts": [
        {
          "name": "manuscript",
          "writable": true,
          "signer": true
        },
        {
          "name": "user",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "author"
              }
            ]
          }
        },
        {
          "name": "author",
          "writable": true,
          "signer": true
        },
        {
          "name": "authorUsdAccount",
          "writable": true
        },
        {
          "name": "escrowUsdAccount",
          "writable": true
        },
        {
          "name": "escrow",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "ipfsHash",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "dociManuscript",
      "discriminator": [
        17,
        181,
        64,
        6,
        34,
        234,
        150,
        222
      ]
    },
    {
      "name": "dociRegistry",
      "discriminator": [
        223,
        118,
        182,
        156,
        182,
        162,
        8,
        196
      ]
    },
    {
      "name": "escrowAccount",
      "discriminator": [
        36,
        69,
        48,
        18,
        128,
        225,
        125,
        135
      ]
    },
    {
      "name": "manuscript",
      "discriminator": [
        194,
        56,
        127,
        4,
        164,
        30,
        156,
        245
      ]
    },
    {
      "name": "user",
      "discriminator": [
        159,
        117,
        95,
        227,
        239,
        151,
        58,
        236
      ]
    }
  ],
  "events": [
    {
      "name": "docinftMinted",
      "discriminator": [
        159,
        148,
        177,
        73,
        242,
        63,
        23,
        58
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "submissionRequirementsNotMet",
      "msg": "User does not meet submission requirements"
    },
    {
      "code": 6001,
      "name": "invalidEducationLevel",
      "msg": "Invalid education level"
    },
    {
      "code": 6002,
      "name": "insufficientPublishedPapers",
      "msg": "Insufficient published papers"
    },
    {
      "code": 6003,
      "name": "invalidDecision",
      "msg": "Invalid decision. Must be 'Accepted' or 'Rejected'"
    },
    {
      "code": 6004,
      "name": "missingCvHash",
      "msg": "CV hash is required"
    },
    {
      "code": 6005,
      "name": "missingIpfsHash",
      "msg": "IPFS hash is required"
    },
    {
      "code": 6006,
      "name": "reviewerAlreadyAdded",
      "msg": "Manuscript already reviewed by this reviewer"
    },
    {
      "code": 6007,
      "name": "decisionAlreadyAdded",
      "msg": "Manuscript already has this decision"
    },
    {
      "code": 6008,
      "name": "notEnoughReviews",
      "msg": "Not enough reviews to make a decision"
    },
    {
      "code": 6009,
      "name": "manuscriptNotPending",
      "msg": "Manuscript is not pending"
    },
    {
      "code": 6010,
      "name": "manuscriptNotAccepted",
      "msg": "Manuscript is not accepted"
    }
  ],
  "types": [
    {
      "name": "dociManuscript",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "doci",
            "type": "string"
          },
          {
            "name": "manuscriptAccount",
            "type": "pubkey"
          },
          {
            "name": "mintAddress",
            "type": "pubkey"
          },
          {
            "name": "manuscriptHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "authors",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "peerReviewers",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "publicationDate",
            "type": "i64"
          },
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "citationCount",
            "type": "u32"
          },
          {
            "name": "accessCount",
            "type": "u32"
          },
          {
            "name": "metadataUri",
            "type": "string"
          },
          {
            "name": "royaltyConfig",
            "type": {
              "defined": {
                "name": "royaltyConfig"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "docinftMinted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "doci",
            "type": "string"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "ipfsHash",
            "type": "string"
          },
          {
            "name": "author",
            "type": "pubkey"
          },
          {
            "name": "reviewers",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "publicationDate",
            "type": "i64"
          },
          {
            "name": "authorsShare",
            "type": "u16"
          },
          {
            "name": "platformShare",
            "type": "u16"
          },
          {
            "name": "reviewersShare",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "dociRegistry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "totalPublished",
            "type": "u64"
          },
          {
            "name": "currentYear",
            "type": "u16"
          },
          {
            "name": "nextSequence",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "escrowAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "manuscript",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "author",
            "type": "pubkey"
          },
          {
            "name": "ipfsHash",
            "type": "string"
          },
          {
            "name": "status",
            "type": "string"
          },
          {
            "name": "reviewers",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "decisions",
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "submissionTime",
            "type": "i64"
          },
          {
            "name": "doci",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "dociMint",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "publicationDate",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "royaltyConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authorsShare",
            "type": "u16"
          },
          {
            "name": "platformShare",
            "type": "u16"
          },
          {
            "name": "reviewersShare",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "user",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "education",
            "type": "string"
          },
          {
            "name": "publishedPapers",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
