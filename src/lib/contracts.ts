import { Contract } from 'ethers'
import env from "./env"

export default {
    AtomicLottery: {
        abi: [
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "lottery_address",
                        "type": "address"
                    }
                ],
                "stateMutability": "payable",
                "type": "constructor"
            }
        ],
        bytecode: {
            "functionDebugData": {
                "@_55": {
                    "entryPoint": null,
                    "id": 55,
                    "parameterSlots": 1,
                    "returnSlots": 0
                },
                "abi_decode_t_address_fromMemory": {
                    "entryPoint": 444,
                    "id": null,
                    "parameterSlots": 2,
                    "returnSlots": 1
                },
                "abi_decode_t_uint256_fromMemory": {
                    "entryPoint": 543,
                    "id": null,
                    "parameterSlots": 2,
                    "returnSlots": 1
                },
                "abi_decode_tuple_t_address_fromMemory": {
                    "entryPoint": 465,
                    "id": null,
                    "parameterSlots": 2,
                    "returnSlots": 1
                },
                "abi_decode_tuple_t_uint256_fromMemory": {
                    "entryPoint": 564,
                    "id": null,
                    "parameterSlots": 2,
                    "returnSlots": 1
                },
                "abi_encode_t_stringliteral_44106a157309fccd3a2ba049f0a53ab6c832a2da495f364efacd39b2a346b758_to_t_string_memory_ptr_fromStack": {
                    "entryPoint": 667,
                    "id": null,
                    "parameterSlots": 1,
                    "returnSlots": 1
                },
                "abi_encode_tuple_t_stringliteral_44106a157309fccd3a2ba049f0a53ab6c832a2da495f364efacd39b2a346b758__to_t_string_memory_ptr__fromStack_reversed": {
                    "entryPoint": 702,
                    "id": null,
                    "parameterSlots": 1,
                    "returnSlots": 1
                },
                "allocate_unbounded": {
                    "entryPoint": null,
                    "id": null,
                    "parameterSlots": 0,
                    "returnSlots": 1
                },
                "array_storeLengthForEncoding_t_string_memory_ptr_fromStack": {
                    "entryPoint": 609,
                    "id": null,
                    "parameterSlots": 2,
                    "returnSlots": 1
                },
                "cleanup_t_address": {
                    "entryPoint": 403,
                    "id": null,
                    "parameterSlots": 1,
                    "returnSlots": 1
                },
                "cleanup_t_uint160": {
                    "entryPoint": 371,
                    "id": null,
                    "parameterSlots": 1,
                    "returnSlots": 1
                },
                "cleanup_t_uint256": {
                    "entryPoint": 510,
                    "id": null,
                    "parameterSlots": 1,
                    "returnSlots": 1
                },
                "revert_error_c1322bf8034eace5e0b5c7295db60986aa89aae5e0ea0873e4689e076861a5db": {
                    "entryPoint": null,
                    "id": null,
                    "parameterSlots": 0,
                    "returnSlots": 0
                },
                "revert_error_dbdddcbe895c83990c08b3492a0e83918d802a52331272ac6fdb6a7c4aea3b1b": {
                    "entryPoint": 366,
                    "id": null,
                    "parameterSlots": 0,
                    "returnSlots": 0
                },
                "store_literal_in_memory_44106a157309fccd3a2ba049f0a53ab6c832a2da495f364efacd39b2a346b758": {
                    "entryPoint": 626,
                    "id": null,
                    "parameterSlots": 1,
                    "returnSlots": 0
                },
                "validator_revert_t_address": {
                    "entryPoint": 421,
                    "id": null,
                    "parameterSlots": 1,
                    "returnSlots": 0
                },
                "validator_revert_t_uint256": {
                    "entryPoint": 520,
                    "id": null,
                    "parameterSlots": 1,
                    "returnSlots": 0
                }
            },
            "generatedSources": [
                {
                    "ast": {
                        "nodeType": "YulBlock",
                        "src": "0:3063:1",
                        "statements": [
                            {
                                "body": {
                                    "nodeType": "YulBlock",
                                    "src": "47:35:1",
                                    "statements": [
                                        {
                                            "nodeType": "YulAssignment",
                                            "src": "57:19:1",
                                            "value": {
                                                "arguments": [
                                                    {
                                                        "kind": "number",
                                                        "nodeType": "YulLiteral",
                                                        "src": "73:2:1",
                                                        "type": "",
                                                        "value": "64"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "mload",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "67:5:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "67:9:1"
                                            },
                                            "variableNames": [
                                                {
                                                    "name": "memPtr",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "57:6:1"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "name": "allocate_unbounded",
                                "nodeType": "YulFunctionDefinition",
                                "returnVariables": [
                                    {
                                        "name": "memPtr",
                                        "nodeType": "YulTypedName",
                                        "src": "40:6:1",
                                        "type": ""
                                    }
                                ],
                                "src": "7:75:1"
                            },
                            {
                                "body": {
                                    "nodeType": "YulBlock",
                                    "src": "177:28:1",
                                    "statements": [
                                        {
                                            "expression": {
                                                "arguments": [
                                                    {
                                                        "kind": "number",
                                                        "nodeType": "YulLiteral",
                                                        "src": "194:1:1",
                                                        "type": "",
                                                        "value": "0"
                                                    },
                                                    {
                                                        "kind": "number",
                                                        "nodeType": "YulLiteral",
                                                        "src": "197:1:1",
                                                        "type": "",
                                                        "value": "0"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "revert",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "187:6:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "187:12:1"
                                            },
                                            "nodeType": "YulExpressionStatement",
                                            "src": "187:12:1"
                                        }
                                    ]
                                },
                                "name": "revert_error_dbdddcbe895c83990c08b3492a0e83918d802a52331272ac6fdb6a7c4aea3b1b",
                                "nodeType": "YulFunctionDefinition",
                                "src": "88:117:1"
                            },
                            {
                                "body": {
                                    "nodeType": "YulBlock",
                                    "src": "300:28:1",
                                    "statements": [
                                        {
                                            "expression": {
                                                "arguments": [
                                                    {
                                                        "kind": "number",
                                                        "nodeType": "YulLiteral",
                                                        "src": "317:1:1",
                                                        "type": "",
                                                        "value": "0"
                                                    },
                                                    {
                                                        "kind": "number",
                                                        "nodeType": "YulLiteral",
                                                        "src": "320:1:1",
                                                        "type": "",
                                                        "value": "0"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "revert",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "310:6:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "310:12:1"
                                            },
                                            "nodeType": "YulExpressionStatement",
                                            "src": "310:12:1"
                                        }
                                    ]
                                },
                                "name": "revert_error_c1322bf8034eace5e0b5c7295db60986aa89aae5e0ea0873e4689e076861a5db",
                                "nodeType": "YulFunctionDefinition",
                                "src": "211:117:1"
                            },
                            {
                                "body": {
                                    "nodeType": "YulBlock",
                                    "src": "379:81:1",
                                    "statements": [
                                        {
                                            "nodeType": "YulAssignment",
                                            "src": "389:65:1",
                                            "value": {
                                                "arguments": [
                                                    {
                                                        "name": "value",
                                                        "nodeType": "YulIdentifier",
                                                        "src": "404:5:1"
                                                    },
                                                    {
                                                        "kind": "number",
                                                        "nodeType": "YulLiteral",
                                                        "src": "411:42:1",
                                                        "type": "",
                                                        "value": "0xffffffffffffffffffffffffffffffffffffffff"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "and",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "400:3:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "400:54:1"
                                            },
                                            "variableNames": [
                                                {
                                                    "name": "cleaned",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "389:7:1"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "name": "cleanup_t_uint160",
                                "nodeType": "YulFunctionDefinition",
                                "parameters": [
                                    {
                                        "name": "value",
                                        "nodeType": "YulTypedName",
                                        "src": "361:5:1",
                                        "type": ""
                                    }
                                ],
                                "returnVariables": [
                                    {
                                        "name": "cleaned",
                                        "nodeType": "YulTypedName",
                                        "src": "371:7:1",
                                        "type": ""
                                    }
                                ],
                                "src": "334:126:1"
                            },
                            {
                                "body": {
                                    "nodeType": "YulBlock",
                                    "src": "511:51:1",
                                    "statements": [
                                        {
                                            "nodeType": "YulAssignment",
                                            "src": "521:35:1",
                                            "value": {
                                                "arguments": [
                                                    {
                                                        "name": "value",
                                                        "nodeType": "YulIdentifier",
                                                        "src": "550:5:1"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "cleanup_t_uint160",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "532:17:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "532:24:1"
                                            },
                                            "variableNames": [
                                                {
                                                    "name": "cleaned",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "521:7:1"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "name": "cleanup_t_address",
                                "nodeType": "YulFunctionDefinition",
                                "parameters": [
                                    {
                                        "name": "value",
                                        "nodeType": "YulTypedName",
                                        "src": "493:5:1",
                                        "type": ""
                                    }
                                ],
                                "returnVariables": [
                                    {
                                        "name": "cleaned",
                                        "nodeType": "YulTypedName",
                                        "src": "503:7:1",
                                        "type": ""
                                    }
                                ],
                                "src": "466:96:1"
                            },
                            {
                                "body": {
                                    "nodeType": "YulBlock",
                                    "src": "611:79:1",
                                    "statements": [
                                        {
                                            "body": {
                                                "nodeType": "YulBlock",
                                                "src": "668:16:1",
                                                "statements": [
                                                    {
                                                        "expression": {
                                                            "arguments": [
                                                                {
                                                                    "kind": "number",
                                                                    "nodeType": "YulLiteral",
                                                                    "src": "677:1:1",
                                                                    "type": "",
                                                                    "value": "0"
                                                                },
                                                                {
                                                                    "kind": "number",
                                                                    "nodeType": "YulLiteral",
                                                                    "src": "680:1:1",
                                                                    "type": "",
                                                                    "value": "0"
                                                                }
                                                            ],
                                                            "functionName": {
                                                                "name": "revert",
                                                                "nodeType": "YulIdentifier",
                                                                "src": "670:6:1"
                                                            },
                                                            "nodeType": "YulFunctionCall",
                                                            "src": "670:12:1"
                                                        },
                                                        "nodeType": "YulExpressionStatement",
                                                        "src": "670:12:1"
                                                    }
                                                ]
                                            },
                                            "condition": {
                                                "arguments": [
                                                    {
                                                        "arguments": [
                                                            {
                                                                "name": "value",
                                                                "nodeType": "YulIdentifier",
                                                                "src": "634:5:1"
                                                            },
                                                            {
                                                                "arguments": [
                                                                    {
                                                                        "name": "value",
                                                                        "nodeType": "YulIdentifier",
                                                                        "src": "659:5:1"
                                                                    }
                                                                ],
                                                                "functionName": {
                                                                    "name": "cleanup_t_address",
                                                                    "nodeType": "YulIdentifier",
                                                                    "src": "641:17:1"
                                                                },
                                                                "nodeType": "YulFunctionCall",
                                                                "src": "641:24:1"
                                                            }
                                                        ],
                                                        "functionName": {
                                                            "name": "eq",
                                                            "nodeType": "YulIdentifier",
                                                            "src": "631:2:1"
                                                        },
                                                        "nodeType": "YulFunctionCall",
                                                        "src": "631:35:1"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "iszero",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "624:6:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "624:43:1"
                                            },
                                            "nodeType": "YulIf",
                                            "src": "621:63:1"
                                        }
                                    ]
                                },
                                "name": "validator_revert_t_address",
                                "nodeType": "YulFunctionDefinition",
                                "parameters": [
                                    {
                                        "name": "value",
                                        "nodeType": "YulTypedName",
                                        "src": "604:5:1",
                                        "type": ""
                                    }
                                ],
                                "src": "568:122:1"
                            },
                            {
                                "body": {
                                    "nodeType": "YulBlock",
                                    "src": "759:80:1",
                                    "statements": [
                                        {
                                            "nodeType": "YulAssignment",
                                            "src": "769:22:1",
                                            "value": {
                                                "arguments": [
                                                    {
                                                        "name": "offset",
                                                        "nodeType": "YulIdentifier",
                                                        "src": "784:6:1"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "mload",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "778:5:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "778:13:1"
                                            },
                                            "variableNames": [
                                                {
                                                    "name": "value",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "769:5:1"
                                                }
                                            ]
                                        },
                                        {
                                            "expression": {
                                                "arguments": [
                                                    {
                                                        "name": "value",
                                                        "nodeType": "YulIdentifier",
                                                        "src": "827:5:1"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "validator_revert_t_address",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "800:26:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "800:33:1"
                                            },
                                            "nodeType": "YulExpressionStatement",
                                            "src": "800:33:1"
                                        }
                                    ]
                                },
                                "name": "abi_decode_t_address_fromMemory",
                                "nodeType": "YulFunctionDefinition",
                                "parameters": [
                                    {
                                        "name": "offset",
                                        "nodeType": "YulTypedName",
                                        "src": "737:6:1",
                                        "type": ""
                                    },
                                    {
                                        "name": "end",
                                        "nodeType": "YulTypedName",
                                        "src": "745:3:1",
                                        "type": ""
                                    }
                                ],
                                "returnVariables": [
                                    {
                                        "name": "value",
                                        "nodeType": "YulTypedName",
                                        "src": "753:5:1",
                                        "type": ""
                                    }
                                ],
                                "src": "696:143:1"
                            },
                            {
                                "body": {
                                    "nodeType": "YulBlock",
                                    "src": "922:274:1",
                                    "statements": [
                                        {
                                            "body": {
                                                "nodeType": "YulBlock",
                                                "src": "968:83:1",
                                                "statements": [
                                                    {
                                                        "expression": {
                                                            "arguments": [],
                                                            "functionName": {
                                                                "name": "revert_error_dbdddcbe895c83990c08b3492a0e83918d802a52331272ac6fdb6a7c4aea3b1b",
                                                                "nodeType": "YulIdentifier",
                                                                "src": "970:77:1"
                                                            },
                                                            "nodeType": "YulFunctionCall",
                                                            "src": "970:79:1"
                                                        },
                                                        "nodeType": "YulExpressionStatement",
                                                        "src": "970:79:1"
                                                    }
                                                ]
                                            },
                                            "condition": {
                                                "arguments": [
                                                    {
                                                        "arguments": [
                                                            {
                                                                "name": "dataEnd",
                                                                "nodeType": "YulIdentifier",
                                                                "src": "943:7:1"
                                                            },
                                                            {
                                                                "name": "headStart",
                                                                "nodeType": "YulIdentifier",
                                                                "src": "952:9:1"
                                                            }
                                                        ],
                                                        "functionName": {
                                                            "name": "sub",
                                                            "nodeType": "YulIdentifier",
                                                            "src": "939:3:1"
                                                        },
                                                        "nodeType": "YulFunctionCall",
                                                        "src": "939:23:1"
                                                    },
                                                    {
                                                        "kind": "number",
                                                        "nodeType": "YulLiteral",
                                                        "src": "964:2:1",
                                                        "type": "",
                                                        "value": "32"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "slt",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "935:3:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "935:32:1"
                                            },
                                            "nodeType": "YulIf",
                                            "src": "932:119:1"
                                        },
                                        {
                                            "nodeType": "YulBlock",
                                            "src": "1061:128:1",
                                            "statements": [
                                                {
                                                    "nodeType": "YulVariableDeclaration",
                                                    "src": "1076:15:1",
                                                    "value": {
                                                        "kind": "number",
                                                        "nodeType": "YulLiteral",
                                                        "src": "1090:1:1",
                                                        "type": "",
                                                        "value": "0"
                                                    },
                                                    "variables": [
                                                        {
                                                            "name": "offset",
                                                            "nodeType": "YulTypedName",
                                                            "src": "1080:6:1",
                                                            "type": ""
                                                        }
                                                    ]
                                                },
                                                {
                                                    "nodeType": "YulAssignment",
                                                    "src": "1105:74:1",
                                                    "value": {
                                                        "arguments": [
                                                            {
                                                                "arguments": [
                                                                    {
                                                                        "name": "headStart",
                                                                        "nodeType": "YulIdentifier",
                                                                        "src": "1151:9:1"
                                                                    },
                                                                    {
                                                                        "name": "offset",
                                                                        "nodeType": "YulIdentifier",
                                                                        "src": "1162:6:1"
                                                                    }
                                                                ],
                                                                "functionName": {
                                                                    "name": "add",
                                                                    "nodeType": "YulIdentifier",
                                                                    "src": "1147:3:1"
                                                                },
                                                                "nodeType": "YulFunctionCall",
                                                                "src": "1147:22:1"
                                                            },
                                                            {
                                                                "name": "dataEnd",
                                                                "nodeType": "YulIdentifier",
                                                                "src": "1171:7:1"
                                                            }
                                                        ],
                                                        "functionName": {
                                                            "name": "abi_decode_t_address_fromMemory",
                                                            "nodeType": "YulIdentifier",
                                                            "src": "1115:31:1"
                                                        },
                                                        "nodeType": "YulFunctionCall",
                                                        "src": "1115:64:1"
                                                    },
                                                    "variableNames": [
                                                        {
                                                            "name": "value0",
                                                            "nodeType": "YulIdentifier",
                                                            "src": "1105:6:1"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "name": "abi_decode_tuple_t_address_fromMemory",
                                "nodeType": "YulFunctionDefinition",
                                "parameters": [
                                    {
                                        "name": "headStart",
                                        "nodeType": "YulTypedName",
                                        "src": "892:9:1",
                                        "type": ""
                                    },
                                    {
                                        "name": "dataEnd",
                                        "nodeType": "YulTypedName",
                                        "src": "903:7:1",
                                        "type": ""
                                    }
                                ],
                                "returnVariables": [
                                    {
                                        "name": "value0",
                                        "nodeType": "YulTypedName",
                                        "src": "915:6:1",
                                        "type": ""
                                    }
                                ],
                                "src": "845:351:1"
                            },
                            {
                                "body": {
                                    "nodeType": "YulBlock",
                                    "src": "1247:32:1",
                                    "statements": [
                                        {
                                            "nodeType": "YulAssignment",
                                            "src": "1257:16:1",
                                            "value": {
                                                "name": "value",
                                                "nodeType": "YulIdentifier",
                                                "src": "1268:5:1"
                                            },
                                            "variableNames": [
                                                {
                                                    "name": "cleaned",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "1257:7:1"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "name": "cleanup_t_uint256",
                                "nodeType": "YulFunctionDefinition",
                                "parameters": [
                                    {
                                        "name": "value",
                                        "nodeType": "YulTypedName",
                                        "src": "1229:5:1",
                                        "type": ""
                                    }
                                ],
                                "returnVariables": [
                                    {
                                        "name": "cleaned",
                                        "nodeType": "YulTypedName",
                                        "src": "1239:7:1",
                                        "type": ""
                                    }
                                ],
                                "src": "1202:77:1"
                            },
                            {
                                "body": {
                                    "nodeType": "YulBlock",
                                    "src": "1328:79:1",
                                    "statements": [
                                        {
                                            "body": {
                                                "nodeType": "YulBlock",
                                                "src": "1385:16:1",
                                                "statements": [
                                                    {
                                                        "expression": {
                                                            "arguments": [
                                                                {
                                                                    "kind": "number",
                                                                    "nodeType": "YulLiteral",
                                                                    "src": "1394:1:1",
                                                                    "type": "",
                                                                    "value": "0"
                                                                },
                                                                {
                                                                    "kind": "number",
                                                                    "nodeType": "YulLiteral",
                                                                    "src": "1397:1:1",
                                                                    "type": "",
                                                                    "value": "0"
                                                                }
                                                            ],
                                                            "functionName": {
                                                                "name": "revert",
                                                                "nodeType": "YulIdentifier",
                                                                "src": "1387:6:1"
                                                            },
                                                            "nodeType": "YulFunctionCall",
                                                            "src": "1387:12:1"
                                                        },
                                                        "nodeType": "YulExpressionStatement",
                                                        "src": "1387:12:1"
                                                    }
                                                ]
                                            },
                                            "condition": {
                                                "arguments": [
                                                    {
                                                        "arguments": [
                                                            {
                                                                "name": "value",
                                                                "nodeType": "YulIdentifier",
                                                                "src": "1351:5:1"
                                                            },
                                                            {
                                                                "arguments": [
                                                                    {
                                                                        "name": "value",
                                                                        "nodeType": "YulIdentifier",
                                                                        "src": "1376:5:1"
                                                                    }
                                                                ],
                                                                "functionName": {
                                                                    "name": "cleanup_t_uint256",
                                                                    "nodeType": "YulIdentifier",
                                                                    "src": "1358:17:1"
                                                                },
                                                                "nodeType": "YulFunctionCall",
                                                                "src": "1358:24:1"
                                                            }
                                                        ],
                                                        "functionName": {
                                                            "name": "eq",
                                                            "nodeType": "YulIdentifier",
                                                            "src": "1348:2:1"
                                                        },
                                                        "nodeType": "YulFunctionCall",
                                                        "src": "1348:35:1"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "iszero",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "1341:6:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "1341:43:1"
                                            },
                                            "nodeType": "YulIf",
                                            "src": "1338:63:1"
                                        }
                                    ]
                                },
                                "name": "validator_revert_t_uint256",
                                "nodeType": "YulFunctionDefinition",
                                "parameters": [
                                    {
                                        "name": "value",
                                        "nodeType": "YulTypedName",
                                        "src": "1321:5:1",
                                        "type": ""
                                    }
                                ],
                                "src": "1285:122:1"
                            },
                            {
                                "body": {
                                    "nodeType": "YulBlock",
                                    "src": "1476:80:1",
                                    "statements": [
                                        {
                                            "nodeType": "YulAssignment",
                                            "src": "1486:22:1",
                                            "value": {
                                                "arguments": [
                                                    {
                                                        "name": "offset",
                                                        "nodeType": "YulIdentifier",
                                                        "src": "1501:6:1"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "mload",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "1495:5:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "1495:13:1"
                                            },
                                            "variableNames": [
                                                {
                                                    "name": "value",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "1486:5:1"
                                                }
                                            ]
                                        },
                                        {
                                            "expression": {
                                                "arguments": [
                                                    {
                                                        "name": "value",
                                                        "nodeType": "YulIdentifier",
                                                        "src": "1544:5:1"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "validator_revert_t_uint256",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "1517:26:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "1517:33:1"
                                            },
                                            "nodeType": "YulExpressionStatement",
                                            "src": "1517:33:1"
                                        }
                                    ]
                                },
                                "name": "abi_decode_t_uint256_fromMemory",
                                "nodeType": "YulFunctionDefinition",
                                "parameters": [
                                    {
                                        "name": "offset",
                                        "nodeType": "YulTypedName",
                                        "src": "1454:6:1",
                                        "type": ""
                                    },
                                    {
                                        "name": "end",
                                        "nodeType": "YulTypedName",
                                        "src": "1462:3:1",
                                        "type": ""
                                    }
                                ],
                                "returnVariables": [
                                    {
                                        "name": "value",
                                        "nodeType": "YulTypedName",
                                        "src": "1470:5:1",
                                        "type": ""
                                    }
                                ],
                                "src": "1413:143:1"
                            },
                            {
                                "body": {
                                    "nodeType": "YulBlock",
                                    "src": "1639:274:1",
                                    "statements": [
                                        {
                                            "body": {
                                                "nodeType": "YulBlock",
                                                "src": "1685:83:1",
                                                "statements": [
                                                    {
                                                        "expression": {
                                                            "arguments": [],
                                                            "functionName": {
                                                                "name": "revert_error_dbdddcbe895c83990c08b3492a0e83918d802a52331272ac6fdb6a7c4aea3b1b",
                                                                "nodeType": "YulIdentifier",
                                                                "src": "1687:77:1"
                                                            },
                                                            "nodeType": "YulFunctionCall",
                                                            "src": "1687:79:1"
                                                        },
                                                        "nodeType": "YulExpressionStatement",
                                                        "src": "1687:79:1"
                                                    }
                                                ]
                                            },
                                            "condition": {
                                                "arguments": [
                                                    {
                                                        "arguments": [
                                                            {
                                                                "name": "dataEnd",
                                                                "nodeType": "YulIdentifier",
                                                                "src": "1660:7:1"
                                                            },
                                                            {
                                                                "name": "headStart",
                                                                "nodeType": "YulIdentifier",
                                                                "src": "1669:9:1"
                                                            }
                                                        ],
                                                        "functionName": {
                                                            "name": "sub",
                                                            "nodeType": "YulIdentifier",
                                                            "src": "1656:3:1"
                                                        },
                                                        "nodeType": "YulFunctionCall",
                                                        "src": "1656:23:1"
                                                    },
                                                    {
                                                        "kind": "number",
                                                        "nodeType": "YulLiteral",
                                                        "src": "1681:2:1",
                                                        "type": "",
                                                        "value": "32"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "slt",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "1652:3:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "1652:32:1"
                                            },
                                            "nodeType": "YulIf",
                                            "src": "1649:119:1"
                                        },
                                        {
                                            "nodeType": "YulBlock",
                                            "src": "1778:128:1",
                                            "statements": [
                                                {
                                                    "nodeType": "YulVariableDeclaration",
                                                    "src": "1793:15:1",
                                                    "value": {
                                                        "kind": "number",
                                                        "nodeType": "YulLiteral",
                                                        "src": "1807:1:1",
                                                        "type": "",
                                                        "value": "0"
                                                    },
                                                    "variables": [
                                                        {
                                                            "name": "offset",
                                                            "nodeType": "YulTypedName",
                                                            "src": "1797:6:1",
                                                            "type": ""
                                                        }
                                                    ]
                                                },
                                                {
                                                    "nodeType": "YulAssignment",
                                                    "src": "1822:74:1",
                                                    "value": {
                                                        "arguments": [
                                                            {
                                                                "arguments": [
                                                                    {
                                                                        "name": "headStart",
                                                                        "nodeType": "YulIdentifier",
                                                                        "src": "1868:9:1"
                                                                    },
                                                                    {
                                                                        "name": "offset",
                                                                        "nodeType": "YulIdentifier",
                                                                        "src": "1879:6:1"
                                                                    }
                                                                ],
                                                                "functionName": {
                                                                    "name": "add",
                                                                    "nodeType": "YulIdentifier",
                                                                    "src": "1864:3:1"
                                                                },
                                                                "nodeType": "YulFunctionCall",
                                                                "src": "1864:22:1"
                                                            },
                                                            {
                                                                "name": "dataEnd",
                                                                "nodeType": "YulIdentifier",
                                                                "src": "1888:7:1"
                                                            }
                                                        ],
                                                        "functionName": {
                                                            "name": "abi_decode_t_uint256_fromMemory",
                                                            "nodeType": "YulIdentifier",
                                                            "src": "1832:31:1"
                                                        },
                                                        "nodeType": "YulFunctionCall",
                                                        "src": "1832:64:1"
                                                    },
                                                    "variableNames": [
                                                        {
                                                            "name": "value0",
                                                            "nodeType": "YulIdentifier",
                                                            "src": "1822:6:1"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "name": "abi_decode_tuple_t_uint256_fromMemory",
                                "nodeType": "YulFunctionDefinition",
                                "parameters": [
                                    {
                                        "name": "headStart",
                                        "nodeType": "YulTypedName",
                                        "src": "1609:9:1",
                                        "type": ""
                                    },
                                    {
                                        "name": "dataEnd",
                                        "nodeType": "YulTypedName",
                                        "src": "1620:7:1",
                                        "type": ""
                                    }
                                ],
                                "returnVariables": [
                                    {
                                        "name": "value0",
                                        "nodeType": "YulTypedName",
                                        "src": "1632:6:1",
                                        "type": ""
                                    }
                                ],
                                "src": "1562:351:1"
                            },
                            {
                                "body": {
                                    "nodeType": "YulBlock",
                                    "src": "2015:73:1",
                                    "statements": [
                                        {
                                            "expression": {
                                                "arguments": [
                                                    {
                                                        "name": "pos",
                                                        "nodeType": "YulIdentifier",
                                                        "src": "2032:3:1"
                                                    },
                                                    {
                                                        "name": "length",
                                                        "nodeType": "YulIdentifier",
                                                        "src": "2037:6:1"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "mstore",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "2025:6:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "2025:19:1"
                                            },
                                            "nodeType": "YulExpressionStatement",
                                            "src": "2025:19:1"
                                        },
                                        {
                                            "nodeType": "YulAssignment",
                                            "src": "2053:29:1",
                                            "value": {
                                                "arguments": [
                                                    {
                                                        "name": "pos",
                                                        "nodeType": "YulIdentifier",
                                                        "src": "2072:3:1"
                                                    },
                                                    {
                                                        "kind": "number",
                                                        "nodeType": "YulLiteral",
                                                        "src": "2077:4:1",
                                                        "type": "",
                                                        "value": "0x20"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "add",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "2068:3:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "2068:14:1"
                                            },
                                            "variableNames": [
                                                {
                                                    "name": "updated_pos",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "2053:11:1"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "name": "array_storeLengthForEncoding_t_string_memory_ptr_fromStack",
                                "nodeType": "YulFunctionDefinition",
                                "parameters": [
                                    {
                                        "name": "pos",
                                        "nodeType": "YulTypedName",
                                        "src": "1987:3:1",
                                        "type": ""
                                    },
                                    {
                                        "name": "length",
                                        "nodeType": "YulTypedName",
                                        "src": "1992:6:1",
                                        "type": ""
                                    }
                                ],
                                "returnVariables": [
                                    {
                                        "name": "updated_pos",
                                        "nodeType": "YulTypedName",
                                        "src": "2003:11:1",
                                        "type": ""
                                    }
                                ],
                                "src": "1919:169:1"
                            },
                            {
                                "body": {
                                    "nodeType": "YulBlock",
                                    "src": "2200:63:1",
                                    "statements": [
                                        {
                                            "expression": {
                                                "arguments": [
                                                    {
                                                        "arguments": [
                                                            {
                                                                "name": "memPtr",
                                                                "nodeType": "YulIdentifier",
                                                                "src": "2222:6:1"
                                                            },
                                                            {
                                                                "kind": "number",
                                                                "nodeType": "YulLiteral",
                                                                "src": "2230:1:1",
                                                                "type": "",
                                                                "value": "0"
                                                            }
                                                        ],
                                                        "functionName": {
                                                            "name": "add",
                                                            "nodeType": "YulIdentifier",
                                                            "src": "2218:3:1"
                                                        },
                                                        "nodeType": "YulFunctionCall",
                                                        "src": "2218:14:1"
                                                    },
                                                    {
                                                        "hexValue": "626964206e6f74206869676820656e6f756768",
                                                        "kind": "string",
                                                        "nodeType": "YulLiteral",
                                                        "src": "2234:21:1",
                                                        "type": "",
                                                        "value": "bid not high enough"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "mstore",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "2211:6:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "2211:45:1"
                                            },
                                            "nodeType": "YulExpressionStatement",
                                            "src": "2211:45:1"
                                        }
                                    ]
                                },
                                "name": "store_literal_in_memory_44106a157309fccd3a2ba049f0a53ab6c832a2da495f364efacd39b2a346b758",
                                "nodeType": "YulFunctionDefinition",
                                "parameters": [
                                    {
                                        "name": "memPtr",
                                        "nodeType": "YulTypedName",
                                        "src": "2192:6:1",
                                        "type": ""
                                    }
                                ],
                                "src": "2094:169:1"
                            },
                            {
                                "body": {
                                    "nodeType": "YulBlock",
                                    "src": "2415:220:1",
                                    "statements": [
                                        {
                                            "nodeType": "YulAssignment",
                                            "src": "2425:74:1",
                                            "value": {
                                                "arguments": [
                                                    {
                                                        "name": "pos",
                                                        "nodeType": "YulIdentifier",
                                                        "src": "2491:3:1"
                                                    },
                                                    {
                                                        "kind": "number",
                                                        "nodeType": "YulLiteral",
                                                        "src": "2496:2:1",
                                                        "type": "",
                                                        "value": "19"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "array_storeLengthForEncoding_t_string_memory_ptr_fromStack",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "2432:58:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "2432:67:1"
                                            },
                                            "variableNames": [
                                                {
                                                    "name": "pos",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "2425:3:1"
                                                }
                                            ]
                                        },
                                        {
                                            "expression": {
                                                "arguments": [
                                                    {
                                                        "name": "pos",
                                                        "nodeType": "YulIdentifier",
                                                        "src": "2597:3:1"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "store_literal_in_memory_44106a157309fccd3a2ba049f0a53ab6c832a2da495f364efacd39b2a346b758",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "2508:88:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "2508:93:1"
                                            },
                                            "nodeType": "YulExpressionStatement",
                                            "src": "2508:93:1"
                                        },
                                        {
                                            "nodeType": "YulAssignment",
                                            "src": "2610:19:1",
                                            "value": {
                                                "arguments": [
                                                    {
                                                        "name": "pos",
                                                        "nodeType": "YulIdentifier",
                                                        "src": "2621:3:1"
                                                    },
                                                    {
                                                        "kind": "number",
                                                        "nodeType": "YulLiteral",
                                                        "src": "2626:2:1",
                                                        "type": "",
                                                        "value": "32"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "add",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "2617:3:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "2617:12:1"
                                            },
                                            "variableNames": [
                                                {
                                                    "name": "end",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "2610:3:1"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "name": "abi_encode_t_stringliteral_44106a157309fccd3a2ba049f0a53ab6c832a2da495f364efacd39b2a346b758_to_t_string_memory_ptr_fromStack",
                                "nodeType": "YulFunctionDefinition",
                                "parameters": [
                                    {
                                        "name": "pos",
                                        "nodeType": "YulTypedName",
                                        "src": "2403:3:1",
                                        "type": ""
                                    }
                                ],
                                "returnVariables": [
                                    {
                                        "name": "end",
                                        "nodeType": "YulTypedName",
                                        "src": "2411:3:1",
                                        "type": ""
                                    }
                                ],
                                "src": "2269:366:1"
                            },
                            {
                                "body": {
                                    "nodeType": "YulBlock",
                                    "src": "2812:248:1",
                                    "statements": [
                                        {
                                            "nodeType": "YulAssignment",
                                            "src": "2822:26:1",
                                            "value": {
                                                "arguments": [
                                                    {
                                                        "name": "headStart",
                                                        "nodeType": "YulIdentifier",
                                                        "src": "2834:9:1"
                                                    },
                                                    {
                                                        "kind": "number",
                                                        "nodeType": "YulLiteral",
                                                        "src": "2845:2:1",
                                                        "type": "",
                                                        "value": "32"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "add",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "2830:3:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "2830:18:1"
                                            },
                                            "variableNames": [
                                                {
                                                    "name": "tail",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "2822:4:1"
                                                }
                                            ]
                                        },
                                        {
                                            "expression": {
                                                "arguments": [
                                                    {
                                                        "arguments": [
                                                            {
                                                                "name": "headStart",
                                                                "nodeType": "YulIdentifier",
                                                                "src": "2869:9:1"
                                                            },
                                                            {
                                                                "kind": "number",
                                                                "nodeType": "YulLiteral",
                                                                "src": "2880:1:1",
                                                                "type": "",
                                                                "value": "0"
                                                            }
                                                        ],
                                                        "functionName": {
                                                            "name": "add",
                                                            "nodeType": "YulIdentifier",
                                                            "src": "2865:3:1"
                                                        },
                                                        "nodeType": "YulFunctionCall",
                                                        "src": "2865:17:1"
                                                    },
                                                    {
                                                        "arguments": [
                                                            {
                                                                "name": "tail",
                                                                "nodeType": "YulIdentifier",
                                                                "src": "2888:4:1"
                                                            },
                                                            {
                                                                "name": "headStart",
                                                                "nodeType": "YulIdentifier",
                                                                "src": "2894:9:1"
                                                            }
                                                        ],
                                                        "functionName": {
                                                            "name": "sub",
                                                            "nodeType": "YulIdentifier",
                                                            "src": "2884:3:1"
                                                        },
                                                        "nodeType": "YulFunctionCall",
                                                        "src": "2884:20:1"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "mstore",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "2858:6:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "2858:47:1"
                                            },
                                            "nodeType": "YulExpressionStatement",
                                            "src": "2858:47:1"
                                        },
                                        {
                                            "nodeType": "YulAssignment",
                                            "src": "2914:139:1",
                                            "value": {
                                                "arguments": [
                                                    {
                                                        "name": "tail",
                                                        "nodeType": "YulIdentifier",
                                                        "src": "3048:4:1"
                                                    }
                                                ],
                                                "functionName": {
                                                    "name": "abi_encode_t_stringliteral_44106a157309fccd3a2ba049f0a53ab6c832a2da495f364efacd39b2a346b758_to_t_string_memory_ptr_fromStack",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "2922:124:1"
                                                },
                                                "nodeType": "YulFunctionCall",
                                                "src": "2922:131:1"
                                            },
                                            "variableNames": [
                                                {
                                                    "name": "tail",
                                                    "nodeType": "YulIdentifier",
                                                    "src": "2914:4:1"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "name": "abi_encode_tuple_t_stringliteral_44106a157309fccd3a2ba049f0a53ab6c832a2da495f364efacd39b2a346b758__to_t_string_memory_ptr__fromStack_reversed",
                                "nodeType": "YulFunctionDefinition",
                                "parameters": [
                                    {
                                        "name": "headStart",
                                        "nodeType": "YulTypedName",
                                        "src": "2792:9:1",
                                        "type": ""
                                    }
                                ],
                                "returnVariables": [
                                    {
                                        "name": "tail",
                                        "nodeType": "YulTypedName",
                                        "src": "2807:4:1",
                                        "type": ""
                                    }
                                ],
                                "src": "2641:419:1"
                            }
                        ]
                    },
                    "contents": "{\n\n    function allocate_unbounded() -> memPtr {\n        memPtr := mload(64)\n    }\n\n    function revert_error_dbdddcbe895c83990c08b3492a0e83918d802a52331272ac6fdb6a7c4aea3b1b() {\n        revert(0, 0)\n    }\n\n    function revert_error_c1322bf8034eace5e0b5c7295db60986aa89aae5e0ea0873e4689e076861a5db() {\n        revert(0, 0)\n    }\n\n    function cleanup_t_uint160(value) -> cleaned {\n        cleaned := and(value, 0xffffffffffffffffffffffffffffffffffffffff)\n    }\n\n    function cleanup_t_address(value) -> cleaned {\n        cleaned := cleanup_t_uint160(value)\n    }\n\n    function validator_revert_t_address(value) {\n        if iszero(eq(value, cleanup_t_address(value))) { revert(0, 0) }\n    }\n\n    function abi_decode_t_address_fromMemory(offset, end) -> value {\n        value := mload(offset)\n        validator_revert_t_address(value)\n    }\n\n    function abi_decode_tuple_t_address_fromMemory(headStart, dataEnd) -> value0 {\n        if slt(sub(dataEnd, headStart), 32) { revert_error_dbdddcbe895c83990c08b3492a0e83918d802a52331272ac6fdb6a7c4aea3b1b() }\n\n        {\n\n            let offset := 0\n\n            value0 := abi_decode_t_address_fromMemory(add(headStart, offset), dataEnd)\n        }\n\n    }\n\n    function cleanup_t_uint256(value) -> cleaned {\n        cleaned := value\n    }\n\n    function validator_revert_t_uint256(value) {\n        if iszero(eq(value, cleanup_t_uint256(value))) { revert(0, 0) }\n    }\n\n    function abi_decode_t_uint256_fromMemory(offset, end) -> value {\n        value := mload(offset)\n        validator_revert_t_uint256(value)\n    }\n\n    function abi_decode_tuple_t_uint256_fromMemory(headStart, dataEnd) -> value0 {\n        if slt(sub(dataEnd, headStart), 32) { revert_error_dbdddcbe895c83990c08b3492a0e83918d802a52331272ac6fdb6a7c4aea3b1b() }\n\n        {\n\n            let offset := 0\n\n            value0 := abi_decode_t_uint256_fromMemory(add(headStart, offset), dataEnd)\n        }\n\n    }\n\n    function array_storeLengthForEncoding_t_string_memory_ptr_fromStack(pos, length) -> updated_pos {\n        mstore(pos, length)\n        updated_pos := add(pos, 0x20)\n    }\n\n    function store_literal_in_memory_44106a157309fccd3a2ba049f0a53ab6c832a2da495f364efacd39b2a346b758(memPtr) {\n\n        mstore(add(memPtr, 0), \"bid not high enough\")\n\n    }\n\n    function abi_encode_t_stringliteral_44106a157309fccd3a2ba049f0a53ab6c832a2da495f364efacd39b2a346b758_to_t_string_memory_ptr_fromStack(pos) -> end {\n        pos := array_storeLengthForEncoding_t_string_memory_ptr_fromStack(pos, 19)\n        store_literal_in_memory_44106a157309fccd3a2ba049f0a53ab6c832a2da495f364efacd39b2a346b758(pos)\n        end := add(pos, 32)\n    }\n\n    function abi_encode_tuple_t_stringliteral_44106a157309fccd3a2ba049f0a53ab6c832a2da495f364efacd39b2a346b758__to_t_string_memory_ptr__fromStack_reversed(headStart ) -> tail {\n        tail := add(headStart, 32)\n\n        mstore(add(headStart, 0), sub(tail, headStart))\n        tail := abi_encode_t_stringliteral_44106a157309fccd3a2ba049f0a53ab6c832a2da495f364efacd39b2a346b758_to_t_string_memory_ptr_fromStack( tail)\n\n    }\n\n}\n",
                    "id": 1,
                    "language": "Yul",
                    "name": "#utility.yul"
                }
            ],
            "linkReferences": {},
            "object": "60806040526040516102df3803806102df833981810160405281019061002591906101d1565b600081905060008173ffffffffffffffffffffffffffffffffffffffff16631998aeef346040518263ffffffff1660e01b815260040160206040518083038185885af1158015610079573d6000803e3d6000fd5b50505050506040513d601f19601f8201168201806040525081019061009e9190610234565b9050803410156100e3576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100da906102be565b60405180910390fd5b8173ffffffffffffffffffffffffffffffffffffffff16634e71d92d6040518163ffffffff1660e01b81526004016020604051808303816000875af1158015610130573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101549190610234565b503373ffffffffffffffffffffffffffffffffffffffff16ff5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061019e82610173565b9050919050565b6101ae81610193565b81146101b957600080fd5b50565b6000815190506101cb816101a5565b92915050565b6000602082840312156101e7576101e661016e565b5b60006101f5848285016101bc565b91505092915050565b6000819050919050565b610211816101fe565b811461021c57600080fd5b50565b60008151905061022e81610208565b92915050565b60006020828403121561024a5761024961016e565b5b60006102588482850161021f565b91505092915050565b600082825260208201905092915050565b7f626964206e6f74206869676820656e6f75676800000000000000000000000000600082015250565b60006102a8601383610261565b91506102b382610272565b602082019050919050565b600060208201905081810360008301526102d78161029b565b905091905056fe",
            "opcodes": "PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x40 MLOAD PUSH2 0x2DF CODESIZE SUB DUP1 PUSH2 0x2DF DUP4 CODECOPY DUP2 DUP2 ADD PUSH1 0x40 MSTORE DUP2 ADD SWAP1 PUSH2 0x25 SWAP2 SWAP1 PUSH2 0x1D1 JUMP JUMPDEST PUSH1 0x0 DUP2 SWAP1 POP PUSH1 0x0 DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH4 0x1998AEEF CALLVALUE PUSH1 0x40 MLOAD DUP3 PUSH4 0xFFFFFFFF AND PUSH1 0xE0 SHL DUP2 MSTORE PUSH1 0x4 ADD PUSH1 0x20 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 DUP9 GAS CALL ISZERO DUP1 ISZERO PUSH2 0x79 JUMPI RETURNDATASIZE PUSH1 0x0 DUP1 RETURNDATACOPY RETURNDATASIZE PUSH1 0x0 REVERT JUMPDEST POP POP POP POP POP PUSH1 0x40 MLOAD RETURNDATASIZE PUSH1 0x1F NOT PUSH1 0x1F DUP3 ADD AND DUP3 ADD DUP1 PUSH1 0x40 MSTORE POP DUP2 ADD SWAP1 PUSH2 0x9E SWAP2 SWAP1 PUSH2 0x234 JUMP JUMPDEST SWAP1 POP DUP1 CALLVALUE LT ISZERO PUSH2 0xE3 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x4 ADD PUSH2 0xDA SWAP1 PUSH2 0x2BE JUMP JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH4 0x4E71D92D PUSH1 0x40 MLOAD DUP2 PUSH4 0xFFFFFFFF AND PUSH1 0xE0 SHL DUP2 MSTORE PUSH1 0x4 ADD PUSH1 0x20 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 PUSH1 0x0 DUP8 GAS CALL ISZERO DUP1 ISZERO PUSH2 0x130 JUMPI RETURNDATASIZE PUSH1 0x0 DUP1 RETURNDATACOPY RETURNDATASIZE PUSH1 0x0 REVERT JUMPDEST POP POP POP POP PUSH1 0x40 MLOAD RETURNDATASIZE PUSH1 0x1F NOT PUSH1 0x1F DUP3 ADD AND DUP3 ADD DUP1 PUSH1 0x40 MSTORE POP DUP2 ADD SWAP1 PUSH2 0x154 SWAP2 SWAP1 PUSH2 0x234 JUMP JUMPDEST POP CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND SELFDESTRUCT JUMPDEST PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x0 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 AND SWAP1 POP SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 PUSH2 0x19E DUP3 PUSH2 0x173 JUMP JUMPDEST SWAP1 POP SWAP2 SWAP1 POP JUMP JUMPDEST PUSH2 0x1AE DUP2 PUSH2 0x193 JUMP JUMPDEST DUP2 EQ PUSH2 0x1B9 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP JUMP JUMPDEST PUSH1 0x0 DUP2 MLOAD SWAP1 POP PUSH2 0x1CB DUP2 PUSH2 0x1A5 JUMP JUMPDEST SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x1E7 JUMPI PUSH2 0x1E6 PUSH2 0x16E JUMP JUMPDEST JUMPDEST PUSH1 0x0 PUSH2 0x1F5 DUP5 DUP3 DUP6 ADD PUSH2 0x1BC JUMP JUMPDEST SWAP2 POP POP SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH1 0x0 DUP2 SWAP1 POP SWAP2 SWAP1 POP JUMP JUMPDEST PUSH2 0x211 DUP2 PUSH2 0x1FE JUMP JUMPDEST DUP2 EQ PUSH2 0x21C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP JUMP JUMPDEST PUSH1 0x0 DUP2 MLOAD SWAP1 POP PUSH2 0x22E DUP2 PUSH2 0x208 JUMP JUMPDEST SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x24A JUMPI PUSH2 0x249 PUSH2 0x16E JUMP JUMPDEST JUMPDEST PUSH1 0x0 PUSH2 0x258 DUP5 DUP3 DUP6 ADD PUSH2 0x21F JUMP JUMPDEST SWAP2 POP POP SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH1 0x0 DUP3 DUP3 MSTORE PUSH1 0x20 DUP3 ADD SWAP1 POP SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH32 0x626964206E6F74206869676820656E6F75676800000000000000000000000000 PUSH1 0x0 DUP3 ADD MSTORE POP JUMP JUMPDEST PUSH1 0x0 PUSH2 0x2A8 PUSH1 0x13 DUP4 PUSH2 0x261 JUMP JUMPDEST SWAP2 POP PUSH2 0x2B3 DUP3 PUSH2 0x272 JUMP JUMPDEST PUSH1 0x20 DUP3 ADD SWAP1 POP SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 ADD SWAP1 POP DUP2 DUP2 SUB PUSH1 0x0 DUP4 ADD MSTORE PUSH2 0x2D7 DUP2 PUSH2 0x29B JUMP JUMPDEST SWAP1 POP SWAP2 SWAP1 POP JUMP INVALID ",
            "sourceMap": "189:338:0:-:0;;;218:307;;;;;;;;;;;;;;;;;;;;;:::i;:::-;273:18;305:15;273:48;;331:19;353:7;:11;;;372:9;353:31;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;331:53;;415:11;402:9;:24;;394:56;;;;;;;;;;;;:::i;:::-;;;;;;;;;460:7;:13;;;:15;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;506:10;485:33;;;88:117:1;197:1;194;187:12;334:126;371:7;411:42;404:5;400:54;389:65;;334:126;;;:::o;466:96::-;503:7;532:24;550:5;532:24;:::i;:::-;521:35;;466:96;;;:::o;568:122::-;641:24;659:5;641:24;:::i;:::-;634:5;631:35;621:63;;680:1;677;670:12;621:63;568:122;:::o;696:143::-;753:5;784:6;778:13;769:22;;800:33;827:5;800:33;:::i;:::-;696:143;;;;:::o;845:351::-;915:6;964:2;952:9;943:7;939:23;935:32;932:119;;;970:79;;:::i;:::-;932:119;1090:1;1115:64;1171:7;1162:6;1151:9;1147:22;1115:64;:::i;:::-;1105:74;;1061:128;845:351;;;;:::o;1202:77::-;1239:7;1268:5;1257:16;;1202:77;;;:::o;1285:122::-;1358:24;1376:5;1358:24;:::i;:::-;1351:5;1348:35;1338:63;;1397:1;1394;1387:12;1338:63;1285:122;:::o;1413:143::-;1470:5;1501:6;1495:13;1486:22;;1517:33;1544:5;1517:33;:::i;:::-;1413:143;;;;:::o;1562:351::-;1632:6;1681:2;1669:9;1660:7;1656:23;1652:32;1649:119;;;1687:79;;:::i;:::-;1649:119;1807:1;1832:64;1888:7;1879:6;1868:9;1864:22;1832:64;:::i;:::-;1822:74;;1778:128;1562:351;;;;:::o;1919:169::-;2003:11;2037:6;2032:3;2025:19;2077:4;2072:3;2068:14;2053:29;;1919:169;;;;:::o;2094:::-;2234:21;2230:1;2222:6;2218:14;2211:45;2094:169;:::o;2269:366::-;2411:3;2432:67;2496:2;2491:3;2432:67;:::i;:::-;2425:74;;2508:93;2597:3;2508:93;:::i;:::-;2626:2;2621:3;2617:12;2610:19;;2269:366;;;:::o;2641:419::-;2807:4;2845:2;2834:9;2830:18;2822:26;;2894:9;2888:4;2884:20;2880:1;2869:9;2865:17;2858:47;2922:131;3048:4;2922:131;:::i;:::-;2914:139;;2641:419;;;:::o"
        },
    },
    LotteryMEV: {
        address: env.CHAIN_ID === 11155111 ? "0xf3d95cDF5a6A39497694e3e26fCB44b04530c2C9" : env.CHAIN_ID === 5 ? "0x1B8810316B4bcb959369C9031778d41757CC1210" : "",
        abi: [
            {
              "inputs": [],
              "stateMutability": "nonpayable",
              "type": "constructor"
            },
            {
              "inputs": [],
              "name": "bid",
              "outputs": [
                {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
                }
              ],
              "stateMutability": "payable",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "claim",
              "outputs": [
                {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
                }
              ],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "last_bid_block",
              "outputs": [
                {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "terminate",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
                }
              ],
              "name": "winners",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            }
          ],
    },
    WETH: {
        address: env.CHAIN_ID === 11155111 ? "0xe2258541f30e991b96ef73068af258d29f8cae55" : "",
        abi: [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"src","type":"address"},{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"guy","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Withdrawal","type":"event"}],
    }
}

export const getContract = (contract: {address: string, abi: any}) => {
    return new Contract(contract.address, contract.abi)
}
