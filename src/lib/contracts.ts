import { Contract } from 'ethers'
import env from "./env"

console.log("CHAIN_ID", env.CHAIN_ID)

export type ContractSpec = {
    address?: string,
    abi?: any[],
    bytecode?: string,
}

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
                "@_58": {
                    "entryPoint": null,
                    "id": 58,
                    "parameterSlots": 1,
                    "returnSlots": 0
                },
                "abi_decode_t_address_fromMemory": {
                    "entryPoint": 440,
                    "id": null,
                    "parameterSlots": 2,
                    "returnSlots": 1
                },
                "abi_decode_t_uint256_fromMemory": {
                    "entryPoint": 539,
                    "id": null,
                    "parameterSlots": 2,
                    "returnSlots": 1
                },
                "abi_decode_tuple_t_address_fromMemory": {
                    "entryPoint": 461,
                    "id": null,
                    "parameterSlots": 2,
                    "returnSlots": 1
                },
                "abi_decode_tuple_t_uint256_fromMemory": {
                    "entryPoint": 560,
                    "id": null,
                    "parameterSlots": 2,
                    "returnSlots": 1
                },
                "abi_encode_t_stringliteral_44106a157309fccd3a2ba049f0a53ab6c832a2da495f364efacd39b2a346b758_to_t_string_memory_ptr_fromStack": {
                    "entryPoint": 663,
                    "id": null,
                    "parameterSlots": 1,
                    "returnSlots": 1
                },
                "abi_encode_tuple_t_stringliteral_44106a157309fccd3a2ba049f0a53ab6c832a2da495f364efacd39b2a346b758__to_t_string_memory_ptr__fromStack_reversed": {
                    "entryPoint": 698,
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
                    "entryPoint": 605,
                    "id": null,
                    "parameterSlots": 2,
                    "returnSlots": 1
                },
                "cleanup_t_address": {
                    "entryPoint": 399,
                    "id": null,
                    "parameterSlots": 1,
                    "returnSlots": 1
                },
                "cleanup_t_uint160": {
                    "entryPoint": 367,
                    "id": null,
                    "parameterSlots": 1,
                    "returnSlots": 1
                },
                "cleanup_t_uint256": {
                    "entryPoint": 506,
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
                    "entryPoint": 362,
                    "id": null,
                    "parameterSlots": 0,
                    "returnSlots": 0
                },
                "store_literal_in_memory_44106a157309fccd3a2ba049f0a53ab6c832a2da495f364efacd39b2a346b758": {
                    "entryPoint": 622,
                    "id": null,
                    "parameterSlots": 1,
                    "returnSlots": 0
                },
                "validator_revert_t_address": {
                    "entryPoint": 417,
                    "id": null,
                    "parameterSlots": 1,
                    "returnSlots": 0
                },
                "validator_revert_t_uint256": {
                    "entryPoint": 516,
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
            "object": "60806040526040516102db3803806102db833981810160405281019061002591906101cd565b60008190508073ffffffffffffffffffffffffffffffffffffffff16631998aeef346040518263ffffffff1660e01b815260040160206040518083038185885af1158015610077573d6000803e3d6000fd5b50505050506040513d601f19601f8201168201806040525081019061009c9190610230565b508073ffffffffffffffffffffffffffffffffffffffff16634e71d92d6040518163ffffffff1660e01b81526004016020604051808303816000875af11580156100ea573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061010e9190610230565b50344711610151576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610148906102ba565b60405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff16ff5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061019a8261016f565b9050919050565b6101aa8161018f565b81146101b557600080fd5b50565b6000815190506101c7816101a1565b92915050565b6000602082840312156101e3576101e261016a565b5b60006101f1848285016101b8565b91505092915050565b6000819050919050565b61020d816101fa565b811461021857600080fd5b50565b60008151905061022a81610204565b92915050565b6000602082840312156102465761024561016a565b5b60006102548482850161021b565b91505092915050565b600082825260208201905092915050565b7f626964206e6f74206869676820656e6f75676800000000000000000000000000600082015250565b60006102a460138361025d565b91506102af8261026e565b602082019050919050565b600060208201905081810360008301526102d381610297565b905091905056fe",
            "opcodes": "PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x40 MLOAD PUSH2 0x2DB CODESIZE SUB DUP1 PUSH2 0x2DB DUP4 CODECOPY DUP2 DUP2 ADD PUSH1 0x40 MSTORE DUP2 ADD SWAP1 PUSH2 0x25 SWAP2 SWAP1 PUSH2 0x1CD JUMP JUMPDEST PUSH1 0x0 DUP2 SWAP1 POP DUP1 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH4 0x1998AEEF CALLVALUE PUSH1 0x40 MLOAD DUP3 PUSH4 0xFFFFFFFF AND PUSH1 0xE0 SHL DUP2 MSTORE PUSH1 0x4 ADD PUSH1 0x20 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 DUP9 GAS CALL ISZERO DUP1 ISZERO PUSH2 0x77 JUMPI RETURNDATASIZE PUSH1 0x0 DUP1 RETURNDATACOPY RETURNDATASIZE PUSH1 0x0 REVERT JUMPDEST POP POP POP POP POP PUSH1 0x40 MLOAD RETURNDATASIZE PUSH1 0x1F NOT PUSH1 0x1F DUP3 ADD AND DUP3 ADD DUP1 PUSH1 0x40 MSTORE POP DUP2 ADD SWAP1 PUSH2 0x9C SWAP2 SWAP1 PUSH2 0x230 JUMP JUMPDEST POP DUP1 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH4 0x4E71D92D PUSH1 0x40 MLOAD DUP2 PUSH4 0xFFFFFFFF AND PUSH1 0xE0 SHL DUP2 MSTORE PUSH1 0x4 ADD PUSH1 0x20 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 PUSH1 0x0 DUP8 GAS CALL ISZERO DUP1 ISZERO PUSH2 0xEA JUMPI RETURNDATASIZE PUSH1 0x0 DUP1 RETURNDATACOPY RETURNDATASIZE PUSH1 0x0 REVERT JUMPDEST POP POP POP POP PUSH1 0x40 MLOAD RETURNDATASIZE PUSH1 0x1F NOT PUSH1 0x1F DUP3 ADD AND DUP3 ADD DUP1 PUSH1 0x40 MSTORE POP DUP2 ADD SWAP1 PUSH2 0x10E SWAP2 SWAP1 PUSH2 0x230 JUMP JUMPDEST POP CALLVALUE SELFBALANCE GT PUSH2 0x151 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x4 ADD PUSH2 0x148 SWAP1 PUSH2 0x2BA JUMP JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND SELFDESTRUCT JUMPDEST PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x0 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 AND SWAP1 POP SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 PUSH2 0x19A DUP3 PUSH2 0x16F JUMP JUMPDEST SWAP1 POP SWAP2 SWAP1 POP JUMP JUMPDEST PUSH2 0x1AA DUP2 PUSH2 0x18F JUMP JUMPDEST DUP2 EQ PUSH2 0x1B5 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP JUMP JUMPDEST PUSH1 0x0 DUP2 MLOAD SWAP1 POP PUSH2 0x1C7 DUP2 PUSH2 0x1A1 JUMP JUMPDEST SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x1E3 JUMPI PUSH2 0x1E2 PUSH2 0x16A JUMP JUMPDEST JUMPDEST PUSH1 0x0 PUSH2 0x1F1 DUP5 DUP3 DUP6 ADD PUSH2 0x1B8 JUMP JUMPDEST SWAP2 POP POP SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH1 0x0 DUP2 SWAP1 POP SWAP2 SWAP1 POP JUMP JUMPDEST PUSH2 0x20D DUP2 PUSH2 0x1FA JUMP JUMPDEST DUP2 EQ PUSH2 0x218 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP JUMP JUMPDEST PUSH1 0x0 DUP2 MLOAD SWAP1 POP PUSH2 0x22A DUP2 PUSH2 0x204 JUMP JUMPDEST SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x246 JUMPI PUSH2 0x245 PUSH2 0x16A JUMP JUMPDEST JUMPDEST PUSH1 0x0 PUSH2 0x254 DUP5 DUP3 DUP6 ADD PUSH2 0x21B JUMP JUMPDEST SWAP2 POP POP SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH1 0x0 DUP3 DUP3 MSTORE PUSH1 0x20 DUP3 ADD SWAP1 POP SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH32 0x626964206E6F74206869676820656E6F75676800000000000000000000000000 PUSH1 0x0 DUP3 ADD MSTORE POP JUMP JUMPDEST PUSH1 0x0 PUSH2 0x2A4 PUSH1 0x13 DUP4 PUSH2 0x25D JUMP JUMPDEST SWAP2 POP PUSH2 0x2AF DUP3 PUSH2 0x26E JUMP JUMPDEST PUSH1 0x20 DUP3 ADD SWAP1 POP SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 ADD SWAP1 POP DUP2 DUP2 SUB PUSH1 0x0 DUP4 ADD MSTORE PUSH2 0x2D3 DUP2 PUSH2 0x297 JUMP JUMPDEST SWAP1 POP SWAP2 SWAP1 POP JUMP INVALID ",
            "sourceMap": "189:325:0:-:0;;;218:294;;;;;;;;;;;;;;;;;;;;;:::i;:::-;273:18;305:15;273:48;;331:7;:11;;;350:9;331:31;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;372:7;:13;;;:15;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;429:9;405:21;:33;397:65;;;;;;;;;;;;:::i;:::-;;;;;;;;;493:10;472:33;;;88:117:1;197:1;194;187:12;334:126;371:7;411:42;404:5;400:54;389:65;;334:126;;;:::o;466:96::-;503:7;532:24;550:5;532:24;:::i;:::-;521:35;;466:96;;;:::o;568:122::-;641:24;659:5;641:24;:::i;:::-;634:5;631:35;621:63;;680:1;677;670:12;621:63;568:122;:::o;696:143::-;753:5;784:6;778:13;769:22;;800:33;827:5;800:33;:::i;:::-;696:143;;;;:::o;845:351::-;915:6;964:2;952:9;943:7;939:23;935:32;932:119;;;970:79;;:::i;:::-;932:119;1090:1;1115:64;1171:7;1162:6;1151:9;1147:22;1115:64;:::i;:::-;1105:74;;1061:128;845:351;;;;:::o;1202:77::-;1239:7;1268:5;1257:16;;1202:77;;;:::o;1285:122::-;1358:24;1376:5;1358:24;:::i;:::-;1351:5;1348:35;1338:63;;1397:1;1394;1387:12;1338:63;1285:122;:::o;1413:143::-;1470:5;1501:6;1495:13;1486:22;;1517:33;1544:5;1517:33;:::i;:::-;1413:143;;;;:::o;1562:351::-;1632:6;1681:2;1669:9;1660:7;1656:23;1652:32;1649:119;;;1687:79;;:::i;:::-;1649:119;1807:1;1832:64;1888:7;1879:6;1868:9;1864:22;1832:64;:::i;:::-;1822:74;;1778:128;1562:351;;;;:::o;1919:169::-;2003:11;2037:6;2032:3;2025:19;2077:4;2072:3;2068:14;2053:29;;1919:169;;;;:::o;2094:::-;2234:21;2230:1;2222:6;2218:14;2211:45;2094:169;:::o;2269:366::-;2411:3;2432:67;2496:2;2491:3;2432:67;:::i;:::-;2425:74;;2508:93;2597:3;2508:93;:::i;:::-;2626:2;2621:3;2617:12;2610:19;;2269:366;;;:::o;2641:419::-;2807:4;2845:2;2834:9;2830:18;2822:26;;2894:9;2888:4;2884:20;2880:1;2869:9;2865:17;2858:47;2922:131;3048:4;2922:131;:::i;:::-;2914:139;;2641:419;;;:::o"
        },
    },
    LotteryMEV: {
        address: env.CHAIN_ID === 11155111 ? "0x1560949ba54689d5e4eF8D5d6162905B5663Cd54" : env.CHAIN_ID === 5 ? "0x1B8810316B4bcb959369C9031778d41757CC1210" : "",
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
    DAI: {
        address: env.CHAIN_ID === 1 ? "0x6B175474E89094C44Da98b954EedeAC495271d0F" : "",
        abi: [{"inputs":[{"internalType":"uint256","name":"chainId_","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"src","type":"address"},{"indexed":true,"internalType":"address","name":"guy","type":"address"},{"indexed":false,"internalType":"uint256","name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":true,"inputs":[{"indexed":true,"internalType":"bytes4","name":"sig","type":"bytes4"},{"indexed":true,"internalType":"address","name":"usr","type":"address"},{"indexed":true,"internalType":"bytes32","name":"arg1","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"arg2","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"}],"name":"LogNote","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"src","type":"address"},{"indexed":true,"internalType":"address","name":"dst","type":"address"},{"indexed":false,"internalType":"uint256","name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"guy","type":"address"}],"name":"deny","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"mint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"src","type":"address"},{"internalType":"address","name":"dst","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"move","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"holder","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"bool","name":"allowed","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"pull","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"push","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"guy","type":"address"}],"name":"rely","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"dst","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"src","type":"address"},{"internalType":"address","name":"dst","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"wards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}],
        bytecode: "0x608060405234801561001057600080fd5b5060405161124d38038061124d8339818101604052602081101561003357600080fd5b5051336000908152602081905260409081902060019055518060526111fb8239604080519182900360520182208282018252600e83527f44616920537461626c65636f696e00000000000000000000000000000000000060209384015281518083018352600181527f3100000000000000000000000000000000000000000000000000000000000000908401528151808401919091527f0b1461ddc0c1d5ded79a1db0f74dae949050a7c0b28728c724b24958c27a328b818301527fc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6606082015260808101949094523060a0808601919091528151808603909101815260c090940190528251920191909120600555506110a9806101526000396000f3fe608060405234801561001057600080fd5b50600436106101425760003560e01c80637ecebe00116100b8578063a9059cbb1161007c578063a9059cbb146103e0578063b753a98c1461040c578063bb35783b14610438578063bf353dbb1461046e578063dd62ed3e14610494578063f2d5d56b146104c257610142565b80637ecebe00146103065780638fcbaf0c1461032c57806395d89b41146103865780639c52a7f11461038e5780639dc29fac146103b457610142565b8063313ce5671161010a578063313ce5671461025e5780633644e5151461027c57806340c10f191461028457806354fd4d50146102b257806365fae35e146102ba57806370a08231146102e057610142565b806306fdde0314610147578063095ea7b3146101c657806318160ddd1461020657806323b872dd1461022057806330adf81f14610256575b600080fd5b61014f6104ee565b60405160208082528190810183818151815260200191508051906020019080838360005b8381101561018b578082015183820152602001610173565b50505050905090810190601f1680156101b85780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6101f2600480360360408110156101dc57600080fd5b506001600160a01b038135169060200135610516565b604051901515815260200160405180910390f35b61020e610588565b60405190815260200160405180910390f35b6101f26004803603606081101561023657600080fd5b506001600160a01b0381358116916020810135909116906040013561058e565b61020e6107db565b6102666107ff565b60405160ff909116815260200160405180910390f35b61020e610804565b6102b06004803603604081101561029a57600080fd5b506001600160a01b03813516906020013561080a565b005b61014f6108f1565b6102b0600480360360208110156102d057600080fd5b50356001600160a01b031661090c565b61020e600480360360208110156102f657600080fd5b50356001600160a01b03166109ba565b61020e6004803603602081101561031c57600080fd5b50356001600160a01b03166109ce565b6102b0600480360361010081101561034357600080fd5b506001600160a01b038135811691602081013590911690604081013590606081013590608081013515159060ff60a0820135169060c08101359060e001356109e2565b61014f610cfc565b6102b0600480360360208110156103a457600080fd5b50356001600160a01b0316610d19565b6102b0600480360360408110156103ca57600080fd5b506001600160a01b038135169060200135610dc4565b6101f2600480360360408110156103f657600080fd5b506001600160a01b038135169060200135610fde565b6102b06004803603604081101561042257600080fd5b506001600160a01b038135169060200135610ff2565b6102b06004803603606081101561044e57600080fd5b506001600160a01b03813581169160208101359091169060400135611002565b61020e6004803603602081101561048457600080fd5b50356001600160a01b0316611013565b61020e600480360360408110156104aa57600080fd5b506001600160a01b0381358116916020013516611027565b6102b0600480360360408110156104d857600080fd5b506001600160a01b038135169060200135611049565b60405160408082019052600e81526d2230b49029ba30b13632b1b7b4b760911b602082015281565b336000908152600360205281604082206001600160a01b038516600090815260209190915260409020556001600160a01b038316337f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258460405190815260200160405180910390a35060015b92915050565b60015481565b6001600160a01b0383166000908152600260205281604082205410156105f55760405162461bcd60e51b81526020600482015260186024820152774461692f696e73756666696369656e742d62616c616e636560401b604482015260640160405180910390fd5b6001600160a01b038416331480159061063957506001600160a01b038416600090815260036020526000199060409020336000908152602091909152604090205414155b15610718576001600160a01b03841660009081526003602052829060409020336000908152602091909152604090205410156106bb5760405162461bcd60e51b815260206004820152601a60248201527f4461692f696e73756666696369656e742d616c6c6f77616e6365000000000000604482015260640160405180910390fd5b6001600160a01b038416600090815260036020526106ee9060409020336000908152602091909152604090205483611054565b6001600160a01b038516600090815260036020526040902033600090815260209190915260409020555b6001600160a01b0384166000908152600260205261073b90604090205483611054565b6001600160a01b0385166000908152600260205260409020556001600160a01b0383166000908152600260205261077790604090205483611064565b6001600160a01b0384166000908152600260205260409020556001600160a01b038084169085167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405190815260200160405180910390a35060019392505050565b7fea2aa0a1be11a07ed86d755c93467f4f82362b452371d1ba94d1715123511acb81565b601281565b60055481565b336000908152602081905260409020546001146108625760405162461bcd60e51b815260206004820152601260248201527111185a4bdb9bdd0b585d5d1a1bdc9a5e995960721b604482015260640160405180910390fd5b6001600160a01b0382166000908152600260205261088590604090205482611064565b6001600160a01b0383166000908152600260205260409020556001546108ab9082611064565b6001556001600160a01b03821660007fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405190815260200160405180910390a35050565b6040516040808201905260018152603160f81b602082015281565b336000908152602081905260409020546001146109645760405162461bcd60e51b815260206004820152601260248201527111185a4bdb9bdd0b585d5d1a1bdc9a5e995960721b604482015260640160405180910390fd5b6001600160a01b0381166000908152602081905260019060409020555961012081016040526020815260e0602082015260e060006040830137602435600435336001600160e01b03196000351661012085a45050565b600260205280600052604060002054905081565b600460205280600052604060002054905081565b6005546000907fea2aa0a1be11a07ed86d755c93467f4f82362b452371d1ba94d1715123511acb8a8a8a8a8a60405160208101969096526001600160a01b03948516604080880191909152939094166060860152608085019190915260a084015290151560c083015260e090910190516020818303038152906040528051906020012060405161190160f01b6020820152602281019290925260428201526062016040516020818303038152906040528051906020012090506001600160a01b038916610aed5760405162461bcd60e51b815260206004820152601560248201527404461692f696e76616c69642d616464726573732d3605c1b604482015260640160405180910390fd5b60018185858560405160008152602001604052604051808581526020018460ff1660ff1681526020018381526020018281526020019450505050506020604051602081039080840390855afa158015610b4a573d6000803e3d6000fd5b505050602060405103516001600160a01b0316896001600160a01b031614610bad5760405162461bcd60e51b815260206004820152601260248201527111185a4bda5b9d985b1a590b5c195c9b5a5d60721b604482015260640160405180910390fd5b851580610bba5750854211155b610bff5760405162461bcd60e51b815260206004820152601260248201527111185a4bdc195c9b5a5d0b595e1c1a5c995960721b604482015260640160405180910390fd5b6001600160a01b03891660009081526004602052604090208054600181019091558714610c665760405162461bcd60e51b81526020600482015260116024820152704461692f696e76616c69642d6e6f6e636560781b604482015260640160405180910390fd5b600085610c74576000610c78565b6000195b6001600160a01b038b16600090815260036020529091508190604090206001600160a01b038b16600090815260209190915260409020556001600160a01b03808a16908b167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258360405190815260200160405180910390a350505050505050505050565b60405160408082019052600381526244414960e81b602082015281565b33600090815260208190526040902054600114610d715760405162461bcd60e51b815260206004820152601260248201527111185a4bdb9bdd0b585d5d1a1bdc9a5e995960721b604482015260640160405180910390fd5b6001600160a01b0381166000908152602081905260408120555961012081016040526020815260e0602082015260e060006040830137602435600435336001600160e01b03196000351661012085a45050565b6001600160a01b03821660009081526002602052819060409020541015610e2c5760405162461bcd60e51b81526020600482015260186024820152774461692f696e73756666696369656e742d62616c616e636560401b604482015260640160405180910390fd5b6001600160a01b0382163314801590610e7057506001600160a01b038216600090815260036020526000199060409020336000908152602091909152604090205414155b15610f4f576001600160a01b0382166000908152600360205281906040902033600090815260209190915260409020541015610ef25760405162461bcd60e51b815260206004820152601a60248201527f4461692f696e73756666696369656e742d616c6c6f77616e6365000000000000604482015260640160405180910390fd5b6001600160a01b03821660009081526003602052610f259060409020336000908152602091909152604090205482611054565b6001600160a01b038316600090815260036020526040902033600090815260209190915260409020555b6001600160a01b03821660009081526002602052610f7290604090205482611054565b6001600160a01b038316600090815260026020526040902055600154610f989082611054565b60015560006001600160a01b0383167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405190815260200160405180910390a35050565b6000610feb33848461058e565b9392505050565b610ffd33838361058e565b505050565b61100d83838361058e565b50505050565b600060205280600052604060002054905081565b6003602052816000526040600020602052806000526040600020549150829050565b610ffd82338361058e565b8082038281111561058257600080fd5b8082018281101561058257600080fdfea265627a7a72315820d670b7dc276d39d169b5192a7d4fac20cfb44486987d854f4d394d78918e0b3a64736f6c634300050c0032454950373132446f6d61696e28737472696e67206e616d652c737472696e672076657273696f6e2c75696e7432353620636861696e49642c6164647265737320766572696679696e67436f6e747261637429",
    },
    WETH: {
        address: env.CHAIN_ID === 11155111 ? "0xe2258541f30e991b96ef73068af258d29f8cae55" : env.CHAIN_ID === 1 ? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" : "",
        abi: [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"src","type":"address"},{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"guy","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Withdrawal","type":"event"}],
        bytecode: "0x60c0604052600d60808190527f577261707065642045746865720000000000000000000000000000000000000060a090815261003e91600091906100a3565b506040805180820190915260048082527f57455448000000000000000000000000000000000000000000000000000000006020909201918252610083916001916100a3565b506002805460ff1916601217905534801561009d57600080fd5b5061013e565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106100e457805160ff1916838001178555610111565b82800160010185558215610111579182015b828111156101115782518255916020019190600101906100f6565b5061011d929150610121565b5090565b61013b91905b8082111561011d5760008155600101610127565b90565b6106568061014d6000396000f3006080604052600436106100925760003560e01c63ffffffff16806306fdde031461009c578063095ea7b31461012657806318160ddd1461015e57806323b872dd146101855780632e1a7d4d146101af578063313ce567146101c757806370a08231146101f257806395d89b4114610213578063a9059cbb14610228578063d0e30db014610092578063dd62ed3e1461024c575b61009a610273565b005b3480156100a857600080fd5b506100b16102c2565b6040805160208082528351818301528351919283929083019185019080838360005b838110156100eb5781810151838201526020016100d3565b50505050905090810190601f1680156101185780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561013257600080fd5b5061014a600160a060020a0360043516602435610350565b604080519115158252519081900360200190f35b34801561016a57600080fd5b506101736103b6565b60408051918252519081900360200190f35b34801561019157600080fd5b5061014a600160a060020a03600435811690602435166044356103bb565b3480156101bb57600080fd5b5061009a6004356104ef565b3480156101d357600080fd5b506101dc610584565b6040805160ff9092168252519081900360200190f35b3480156101fe57600080fd5b50610173600160a060020a036004351661058d565b34801561021f57600080fd5b506100b161059f565b34801561023457600080fd5b5061014a600160a060020a03600435166024356105f9565b34801561025857600080fd5b50610173600160a060020a036004358116906024351661060d565b33600081815260036020908152604091829020805434908101909155825190815291517fe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c9281900390910190a2565b6000805460408051602060026001851615610100026000190190941693909304601f810184900484028201840190925281815292918301828280156103485780601f1061031d57610100808354040283529160200191610348565b820191906000526020600020905b81548152906001019060200180831161032b57829003601f168201915b505050505081565b336000818152600460209081526040808320600160a060020a038716808552908352818420869055815186815291519394909390927f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925928290030190a350600192915050565b303190565b600160a060020a0383166000908152600360205260408120548211156103e057600080fd5b600160a060020a038416331480159061041e5750600160a060020a038416600090815260046020908152604080832033845290915290205460001914155b1561047e57600160a060020a038416600090815260046020908152604080832033845290915290205482111561045357600080fd5b600160a060020a03841660009081526004602090815260408083203384529091529020805483900390555b600160a060020a03808516600081815260036020908152604080832080548890039055938716808352918490208054870190558351868152935191937fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef929081900390910190a35060019392505050565b3360009081526003602052604090205481111561050b57600080fd5b33600081815260036020526040808220805485900390555183156108fc0291849190818181858888f1935050505015801561054a573d6000803e3d6000fd5b5060408051828152905133917f7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65919081900360200190a250565b60025460ff1681565b60036020526000908152604090205481565b60018054604080516020600284861615610100026000190190941693909304601f810184900484028201840190925281815292918301828280156103485780601f1061031d57610100808354040283529160200191610348565b60006106063384846103bb565b9392505050565b6004602090815260009283526040808420909152908252902054815600a165627a7a7230582001c5bfe9ec4c6d446b01537f87db92275608d83ff931e343a863bc98bd9efc930029",
    },
    UniV2Router: {
        address: env.CHAIN_ID <= 5 ? "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D" : "",
        abi: [{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountTokenDesired","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountIn","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"}],"name":"quote","outputs":[{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETHSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermit","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityWithPermit","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETHSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}],
    },
    UniV2Factory: {
        abi: [
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "_feeToSetter",
                  "type": "address"
                }
              ],
              "payable": false,
              "stateMutability": "nonpayable",
              "type": "constructor"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "token0",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "token1",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "address",
                  "name": "pair",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
                }
              ],
              "name": "PairCreated",
              "type": "event"
            },
            {
              "constant": true,
              "inputs": [
                {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
                }
              ],
              "name": "allPairs",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "payable": false,
              "stateMutability": "view",
              "type": "function"
            },
            {
              "constant": true,
              "inputs": [],
              "name": "allPairsLength",
              "outputs": [
                {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
                }
              ],
              "payable": false,
              "stateMutability": "view",
              "type": "function"
            },
            {
              "constant": false,
              "inputs": [
                {
                  "internalType": "address",
                  "name": "tokenA",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "tokenB",
                  "type": "address"
                }
              ],
              "name": "createPair",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "pair",
                  "type": "address"
                }
              ],
              "payable": false,
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "constant": true,
              "inputs": [],
              "name": "feeTo",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "payable": false,
              "stateMutability": "view",
              "type": "function"
            },
            {
              "constant": true,
              "inputs": [],
              "name": "feeToSetter",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "payable": false,
              "stateMutability": "view",
              "type": "function"
            },
            {
              "constant": true,
              "inputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "name": "getPair",
              "outputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "payable": false,
              "stateMutability": "view",
              "type": "function"
            },
            {
              "constant": false,
              "inputs": [
                {
                  "internalType": "address",
                  "name": "_feeTo",
                  "type": "address"
                }
              ],
              "name": "setFeeTo",
              "outputs": [],
              "payable": false,
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "constant": false,
              "inputs": [
                {
                  "internalType": "address",
                  "name": "_feeToSetter",
                  "type": "address"
                }
              ],
              "name": "setFeeToSetter",
              "outputs": [],
              "payable": false,
              "stateMutability": "nonpayable",
              "type": "function"
            }
        ],
        bytecode: "0x608060405234801561001057600080fd5b50604051612aa9380380612aa98339818101604052602081101561003357600080fd5b5051600180546001600160a01b0319166001600160a01b03909216919091179055612a46806100636000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c8063a2e74af61161005b578063a2e74af6146100f0578063c9c6539614610118578063e6a4390514610146578063f46901ed1461017457610088565b8063017e7e581461008d578063094b7415146100b15780631e3dd18b146100b9578063574f2ba3146100d6575b600080fd5b61009561019a565b604080516001600160a01b039092168252519081900360200190f35b6100956101a9565b610095600480360360208110156100cf57600080fd5b50356101b8565b6100de6101df565b60408051918252519081900360200190f35b6101166004803603602081101561010657600080fd5b50356001600160a01b03166101e5565b005b6100956004803603604081101561012e57600080fd5b506001600160a01b038135811691602001351661025d565b6100956004803603604081101561015c57600080fd5b506001600160a01b038135811691602001351661058e565b6101166004803603602081101561018a57600080fd5b50356001600160a01b03166105b4565b6000546001600160a01b031681565b6001546001600160a01b031681565b600381815481106101c557fe5b6000918252602090912001546001600160a01b0316905081565b60035490565b6001546001600160a01b0316331461023b576040805162461bcd60e51b81526020600482015260146024820152732ab734b9bbb0b82b191d102327a92124a22222a760611b604482015290519081900360640190fd5b600180546001600160a01b0319166001600160a01b0392909216919091179055565b6000816001600160a01b0316836001600160a01b031614156102c6576040805162461bcd60e51b815260206004820152601e60248201527f556e697377617056323a204944454e544943414c5f4144445245535345530000604482015290519081900360640190fd5b600080836001600160a01b0316856001600160a01b0316106102e95783856102ec565b84845b90925090506001600160a01b03821661034c576040805162461bcd60e51b815260206004820152601760248201527f556e697377617056323a205a45524f5f41444452455353000000000000000000604482015290519081900360640190fd5b6001600160a01b038281166000908152600260209081526040808320858516845290915290205416156103bf576040805162461bcd60e51b8152602060048201526016602482015275556e697377617056323a20504149525f45584953545360501b604482015290519081900360640190fd5b6060604051806020016103d19061062c565b6020820181038252601f19601f8201166040525090506000838360405160200180836001600160a01b03166001600160a01b031660601b8152601401826001600160a01b03166001600160a01b031660601b815260140192505050604051602081830303815290604052805190602001209050808251602084016000f56040805163485cc95560e01b81526001600160a01b038781166004830152868116602483015291519297509087169163485cc9559160448082019260009290919082900301818387803b1580156104a457600080fd5b505af11580156104b8573d6000803e3d6000fd5b505050506001600160a01b0384811660008181526002602081815260408084208987168086529083528185208054978d166001600160a01b031998891681179091559383528185208686528352818520805488168517905560038054600181018255958190527fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b90950180549097168417909655925483519283529082015281517f0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9929181900390910190a35050505092915050565b60026020908152600092835260408084209091529082529020546001600160a01b031681565b6001546001600160a01b0316331461060a576040805162461bcd60e51b81526020600482015260146024820152732ab734b9bbb0b82b191d102327a92124a22222a760611b604482015290519081900360640190fd5b600080546001600160a01b0319166001600160a01b0392909216919091179055565b6123d88061063a8339019056fe60806040526001600c5534801561001557600080fd5b5060405146908060526123868239604080519182900360520182208282018252600a8352692ab734b9bbb0b8102b1960b11b6020938401528151808301835260018152603160f81b908401528151808401919091527fbfcc8ef98ffbf7b6c3fec7bf5185b566b9863e35a9d83acd49ad6824b5969738818301527fc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6606082015260808101949094523060a0808601919091528151808603909101815260c09094019052825192019190912060035550600580546001600160a01b03191633179055612281806101056000396000f3fe608060405234801561001057600080fd5b50600436106101a95760003560e01c80636a627842116100f9578063ba9a7a5611610097578063d21220a711610071578063d21220a714610534578063d505accf1461053c578063dd62ed3e1461058d578063fff6cae9146105bb576101a9565b8063ba9a7a56146104fe578063bc25cf7714610506578063c45a01551461052c576101a9565b80637ecebe00116100d35780637ecebe001461046557806389afcb441461048b57806395d89b41146104ca578063a9059cbb146104d2576101a9565b80636a6278421461041157806370a08231146104375780637464fc3d1461045d576101a9565b806323b872dd116101665780633644e515116101405780633644e515146103cb578063485cc955146103d35780635909c0d5146104015780635a3d549314610409576101a9565b806323b872dd1461036f57806330adf81f146103a5578063313ce567146103ad576101a9565b8063022c0d9f146101ae57806306fdde031461023c5780630902f1ac146102b9578063095ea7b3146102f15780630dfe16811461033157806318160ddd14610355575b600080fd5b61023a600480360360808110156101c457600080fd5b8135916020810135916001600160a01b0360408301351691908101906080810160608201356401000000008111156101fb57600080fd5b82018360208201111561020d57600080fd5b8035906020019184600183028401116401000000008311171561022f57600080fd5b5090925090506105c3565b005b610244610afe565b6040805160208082528351818301528351919283929083019185019080838360005b8381101561027e578181015183820152602001610266565b50505050905090810190601f1680156102ab5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6102c1610b24565b604080516001600160701b03948516815292909316602083015263ffffffff168183015290519081900360600190f35b61031d6004803603604081101561030757600080fd5b506001600160a01b038135169060200135610b4e565b604080519115158252519081900360200190f35b610339610b65565b604080516001600160a01b039092168252519081900360200190f35b61035d610b74565b60408051918252519081900360200190f35b61031d6004803603606081101561038557600080fd5b506001600160a01b03813581169160208101359091169060400135610b7a565b61035d610c14565b6103b5610c38565b6040805160ff9092168252519081900360200190f35b61035d610c3d565b61023a600480360360408110156103e957600080fd5b506001600160a01b0381358116916020013516610c43565b61035d610cc7565b61035d610ccd565b61035d6004803603602081101561042757600080fd5b50356001600160a01b0316610cd3565b61035d6004803603602081101561044d57600080fd5b50356001600160a01b0316610fd3565b61035d610fe5565b61035d6004803603602081101561047b57600080fd5b50356001600160a01b0316610feb565b6104b1600480360360208110156104a157600080fd5b50356001600160a01b0316610ffd565b6040805192835260208301919091528051918290030190f35b6102446113a3565b61031d600480360360408110156104e857600080fd5b506001600160a01b0381351690602001356113c5565b61035d6113d2565b61023a6004803603602081101561051c57600080fd5b50356001600160a01b03166113d8565b610339611543565b610339611552565b61023a600480360360e081101561055257600080fd5b506001600160a01b03813581169160208101359091169060408101359060608101359060ff6080820135169060a08101359060c00135611561565b61035d600480360360408110156105a357600080fd5b506001600160a01b0381358116916020013516611763565b61023a611780565b600c5460011461060e576040805162461bcd60e51b8152602060048201526011602482015270155b9a5cddd85c158c8e881313d0d2d151607a1b604482015290519081900360640190fd5b6000600c55841515806106215750600084115b61065c5760405162461bcd60e51b81526004018080602001828103825260258152602001806121936025913960400191505060405180910390fd5b600080610667610b24565b5091509150816001600160701b03168710801561068c5750806001600160701b031686105b6106c75760405162461bcd60e51b81526004018080602001828103825260218152602001806121dc6021913960400191505060405180910390fd5b60065460075460009182916001600160a01b039182169190811690891682148015906107055750806001600160a01b0316896001600160a01b031614155b61074e576040805162461bcd60e51b8152602060048201526015602482015274556e697377617056323a20494e56414c49445f544f60581b604482015290519081900360640190fd5b8a1561075f5761075f828a8d6118e2565b891561077057610770818a8c6118e2565b861561082b57886001600160a01b03166310d1e85c338d8d8c8c6040518663ffffffff1660e01b815260040180866001600160a01b03166001600160a01b03168152602001858152602001848152602001806020018281038252848482818152602001925080828437600081840152601f19601f8201169050808301925050509650505050505050600060405180830381600087803b15801561081257600080fd5b505af1158015610826573d6000803e3d6000fd5b505050505b604080516370a0823160e01b815230600482015290516001600160a01b038416916370a08231916024808301926020929190829003018186803b15801561087157600080fd5b505afa158015610885573d6000803e3d6000fd5b505050506040513d602081101561089b57600080fd5b5051604080516370a0823160e01b815230600482015290519195506001600160a01b038316916370a0823191602480820192602092909190829003018186803b1580156108e757600080fd5b505afa1580156108fb573d6000803e3d6000fd5b505050506040513d602081101561091157600080fd5b5051925060009150506001600160701b0385168a90038311610934576000610943565b89856001600160701b03160383035b9050600089856001600160701b031603831161096057600061096f565b89856001600160701b03160383035b905060008211806109805750600081115b6109bb5760405162461bcd60e51b81526004018080602001828103825260248152602001806121b86024913960400191505060405180910390fd5b60006109ef6109d184600363ffffffff611a7c16565b6109e3876103e863ffffffff611a7c16565b9063ffffffff611adf16565b90506000610a076109d184600363ffffffff611a7c16565b9050610a38620f4240610a2c6001600160701b038b8116908b1663ffffffff611a7c16565b9063ffffffff611a7c16565b610a48838363ffffffff611a7c16565b1015610a8a576040805162461bcd60e51b815260206004820152600c60248201526b556e697377617056323a204b60a01b604482015290519081900360640190fd5b5050610a9884848888611b2f565b60408051838152602081018390528082018d9052606081018c905290516001600160a01b038b169133917fd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d8229181900360800190a350506001600c55505050505050505050565b6040518060400160405280600a8152602001692ab734b9bbb0b8102b1960b11b81525081565b6008546001600160701b0380821692600160701b830490911691600160e01b900463ffffffff1690565b6000610b5b338484611cf4565b5060015b92915050565b6006546001600160a01b031681565b60005481565b6001600160a01b038316600090815260026020908152604080832033845290915281205460001914610bff576001600160a01b0384166000908152600260209081526040808320338452909152902054610bda908363ffffffff611adf16565b6001600160a01b03851660009081526002602090815260408083203384529091529020555b610c0a848484611d56565b5060019392505050565b7f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c981565b601281565b60035481565b6005546001600160a01b03163314610c99576040805162461bcd60e51b81526020600482015260146024820152732ab734b9bbb0b82b191d102327a92124a22222a760611b604482015290519081900360640190fd5b600680546001600160a01b039384166001600160a01b03199182161790915560078054929093169116179055565b60095481565b600a5481565b6000600c54600114610d20576040805162461bcd60e51b8152602060048201526011602482015270155b9a5cddd85c158c8e881313d0d2d151607a1b604482015290519081900360640190fd5b6000600c81905580610d30610b24565b50600654604080516370a0823160e01b815230600482015290519395509193506000926001600160a01b03909116916370a08231916024808301926020929190829003018186803b158015610d8457600080fd5b505afa158015610d98573d6000803e3d6000fd5b505050506040513d6020811015610dae57600080fd5b5051600754604080516370a0823160e01b815230600482015290519293506000926001600160a01b03909216916370a0823191602480820192602092909190829003018186803b158015610e0157600080fd5b505afa158015610e15573d6000803e3d6000fd5b505050506040513d6020811015610e2b57600080fd5b505190506000610e4a836001600160701b03871663ffffffff611adf16565b90506000610e67836001600160701b03871663ffffffff611adf16565b90506000610e758787611e10565b60005490915080610eb257610e9e6103e86109e3610e99878763ffffffff611a7c16565b611f6e565b9850610ead60006103e8611fc0565b610f01565b610efe6001600160701b038916610ecf868463ffffffff611a7c16565b81610ed657fe5b046001600160701b038916610ef1868563ffffffff611a7c16565b81610ef857fe5b04612056565b98505b60008911610f405760405162461bcd60e51b81526004018080602001828103825260288152602001806122256028913960400191505060405180910390fd5b610f4a8a8a611fc0565b610f5686868a8a611b2f565b8115610f8657600854610f82906001600160701b0380821691600160701b90041663ffffffff611a7c16565b600b555b6040805185815260208101859052815133927f4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f928290030190a250506001600c5550949695505050505050565b60016020526000908152604090205481565b600b5481565b60046020526000908152604090205481565b600080600c5460011461104b576040805162461bcd60e51b8152602060048201526011602482015270155b9a5cddd85c158c8e881313d0d2d151607a1b604482015290519081900360640190fd5b6000600c8190558061105b610b24565b50600654600754604080516370a0823160e01b815230600482015290519496509294506001600160a01b039182169391169160009184916370a08231916024808301926020929190829003018186803b1580156110b757600080fd5b505afa1580156110cb573d6000803e3d6000fd5b505050506040513d60208110156110e157600080fd5b5051604080516370a0823160e01b815230600482015290519192506000916001600160a01b038516916370a08231916024808301926020929190829003018186803b15801561112f57600080fd5b505afa158015611143573d6000803e3d6000fd5b505050506040513d602081101561115957600080fd5b5051306000908152600160205260408120549192506111788888611e10565b6000549091508061118f848763ffffffff611a7c16565b8161119657fe5b049a50806111aa848663ffffffff611a7c16565b816111b157fe5b04995060008b1180156111c4575060008a115b6111ff5760405162461bcd60e51b81526004018080602001828103825260288152602001806121fd6028913960400191505060405180910390fd5b611209308461206e565b611214878d8d6118e2565b61121f868d8c6118e2565b604080516370a0823160e01b815230600482015290516001600160a01b038916916370a08231916024808301926020929190829003018186803b15801561126557600080fd5b505afa158015611279573d6000803e3d6000fd5b505050506040513d602081101561128f57600080fd5b5051604080516370a0823160e01b815230600482015290519196506001600160a01b038816916370a0823191602480820192602092909190829003018186803b1580156112db57600080fd5b505afa1580156112ef573d6000803e3d6000fd5b505050506040513d602081101561130557600080fd5b5051935061131585858b8b611b2f565b811561134557600854611341906001600160701b0380821691600160701b90041663ffffffff611a7c16565b600b555b604080518c8152602081018c905281516001600160a01b038f169233927fdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496929081900390910190a35050505050505050506001600c81905550915091565b604051806040016040528060068152602001652aa72496ab1960d11b81525081565b6000610b5b338484611d56565b6103e881565b600c54600114611423576040805162461bcd60e51b8152602060048201526011602482015270155b9a5cddd85c158c8e881313d0d2d151607a1b604482015290519081900360640190fd5b6000600c55600654600754600854604080516370a0823160e01b815230600482015290516001600160a01b0394851694909316926114d292859287926114cd926001600160701b03169185916370a0823191602480820192602092909190829003018186803b15801561149557600080fd5b505afa1580156114a9573d6000803e3d6000fd5b505050506040513d60208110156114bf57600080fd5b50519063ffffffff611adf16565b6118e2565b600854604080516370a0823160e01b8152306004820152905161153992849287926114cd92600160701b90046001600160701b0316916001600160a01b038616916370a0823191602480820192602092909190829003018186803b15801561149557600080fd5b50506001600c5550565b6005546001600160a01b031681565b6007546001600160a01b031681565b428410156115ab576040805162461bcd60e51b8152602060048201526012602482015271155b9a5cddd85c158c8e881156141254915160721b604482015290519081900360640190fd5b6003546001600160a01b0380891660008181526004602090815260408083208054600180820190925582517f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c98186015280840196909652958d166060860152608085018c905260a085019590955260c08085018b90528151808603909101815260e08501825280519083012061190160f01b6101008601526101028501969096526101228085019690965280518085039096018652610142840180825286519683019690962095839052610162840180825286905260ff89166101828501526101a284018890526101c28401879052519193926101e280820193601f1981019281900390910190855afa1580156116c6573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b038116158015906116fc5750886001600160a01b0316816001600160a01b0316145b61174d576040805162461bcd60e51b815260206004820152601c60248201527f556e697377617056323a20494e56414c49445f5349474e415455524500000000604482015290519081900360640190fd5b611758898989611cf4565b505050505050505050565b600260209081526000928352604080842090915290825290205481565b600c546001146117cb576040805162461bcd60e51b8152602060048201526011602482015270155b9a5cddd85c158c8e881313d0d2d151607a1b604482015290519081900360640190fd5b6000600c55600654604080516370a0823160e01b815230600482015290516118db926001600160a01b0316916370a08231916024808301926020929190829003018186803b15801561181c57600080fd5b505afa158015611830573d6000803e3d6000fd5b505050506040513d602081101561184657600080fd5b5051600754604080516370a0823160e01b815230600482015290516001600160a01b03909216916370a0823191602480820192602092909190829003018186803b15801561189357600080fd5b505afa1580156118a7573d6000803e3d6000fd5b505050506040513d60208110156118bd57600080fd5b50516008546001600160701b0380821691600160701b900416611b2f565b6001600c55565b604080518082018252601981527f7472616e7366657228616464726573732c75696e74323536290000000000000060209182015281516001600160a01b0385811660248301526044808301869052845180840390910181526064909201845291810180516001600160e01b031663a9059cbb60e01b1781529251815160009460609489169392918291908083835b6020831061198f5780518252601f199092019160209182019101611970565b6001836020036101000a0380198251168184511680821785525050505050509050019150506000604051808303816000865af19150503d80600081146119f1576040519150601f19603f3d011682016040523d82523d6000602084013e6119f6565b606091505b5091509150818015611a24575080511580611a245750808060200190516020811015611a2157600080fd5b50515b611a75576040805162461bcd60e51b815260206004820152601a60248201527f556e697377617056323a205452414e534645525f4641494c4544000000000000604482015290519081900360640190fd5b5050505050565b6000811580611a9757505080820282828281611a9457fe5b04145b610b5f576040805162461bcd60e51b815260206004820152601460248201527364732d6d6174682d6d756c2d6f766572666c6f7760601b604482015290519081900360640190fd5b80820382811115610b5f576040805162461bcd60e51b815260206004820152601560248201527464732d6d6174682d7375622d756e646572666c6f7760581b604482015290519081900360640190fd5b6001600160701b038411801590611b4d57506001600160701b038311155b611b94576040805162461bcd60e51b8152602060048201526013602482015272556e697377617056323a204f564552464c4f5760681b604482015290519081900360640190fd5b60085463ffffffff42811691600160e01b90048116820390811615801590611bc457506001600160701b03841615155b8015611bd857506001600160701b03831615155b15611c49578063ffffffff16611c0685611bf18661210c565b6001600160e01b03169063ffffffff61211e16565b600980546001600160e01b03929092169290920201905563ffffffff8116611c3184611bf18761210c565b600a80546001600160e01b0392909216929092020190555b600880546dffffffffffffffffffffffffffff19166001600160701b03888116919091176dffffffffffffffffffffffffffff60701b1916600160701b8883168102919091176001600160e01b0316600160e01b63ffffffff871602179283905560408051848416815291909304909116602082015281517f1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1929181900390910190a1505050505050565b6001600160a01b03808416600081815260026020908152604080832094871680845294825291829020859055815185815291517f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9259281900390910190a3505050565b6001600160a01b038316600090815260016020526040902054611d7f908263ffffffff611adf16565b6001600160a01b038085166000908152600160205260408082209390935590841681522054611db4908263ffffffff61214316565b6001600160a01b0380841660008181526001602090815260409182902094909455805185815290519193928716927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef92918290030190a3505050565b600080600560009054906101000a90046001600160a01b03166001600160a01b031663017e7e586040518163ffffffff1660e01b815260040160206040518083038186803b158015611e6157600080fd5b505afa158015611e75573d6000803e3d6000fd5b505050506040513d6020811015611e8b57600080fd5b5051600b546001600160a01b038216158015945091925090611f5a578015611f55576000611ece610e996001600160701b0388811690881663ffffffff611a7c16565b90506000611edb83611f6e565b905080821115611f52576000611f09611efa848463ffffffff611adf16565b6000549063ffffffff611a7c16565b90506000611f2e83611f2286600563ffffffff611a7c16565b9063ffffffff61214316565b90506000818381611f3b57fe5b0490508015611f4e57611f4e8782611fc0565b5050505b50505b611f66565b8015611f66576000600b555b505092915050565b60006003821115611fb1575080600160028204015b81811015611fab57809150600281828581611f9a57fe5b040181611fa357fe5b049050611f83565b50611fbb565b8115611fbb575060015b919050565b600054611fd3908263ffffffff61214316565b60009081556001600160a01b038316815260016020526040902054611ffe908263ffffffff61214316565b6001600160a01b03831660008181526001602090815260408083209490945583518581529351929391927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9281900390910190a35050565b60008183106120655781612067565b825b9392505050565b6001600160a01b038216600090815260016020526040902054612097908263ffffffff611adf16565b6001600160a01b038316600090815260016020526040812091909155546120c4908263ffffffff611adf16565b60009081556040805183815290516001600160a01b038516917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef919081900360200190a35050565b6001600160701b0316600160701b0290565b60006001600160701b0382166001600160e01b0384168161213b57fe5b049392505050565b80820182811015610b5f576040805162461bcd60e51b815260206004820152601460248201527364732d6d6174682d6164642d6f766572666c6f7760601b604482015290519081900360640190fdfe556e697377617056323a20494e53554646494349454e545f4f55545055545f414d4f554e54556e697377617056323a20494e53554646494349454e545f494e5055545f414d4f554e54556e697377617056323a20494e53554646494349454e545f4c4951554944495459556e697377617056323a20494e53554646494349454e545f4c49515549444954595f4255524e4544556e697377617056323a20494e53554646494349454e545f4c49515549444954595f4d494e544544a265627a7a723158200e52b02c4e173c1ab26f258629bf664e20d132afdd0ba05d602084b1282b126e64736f6c63430005100032454950373132446f6d61696e28737472696e67206e616d652c737472696e672076657273696f6e2c75696e7432353620636861696e49642c6164647265737320766572696679696e67436f6e747261637429a265627a7a7231582035bda75190fdd21e1fa0307fb27d37f8e6bd8539f1dffe6c10a0496aee31c5bf64736f6c63430005100032",
    },
}

export const getContract = (contract: {address: string, abi: any}) => {
    if (!contract.address || !contract.abi) {
        return undefined
    }
    return new Contract(contract.address, contract.abi)
}
