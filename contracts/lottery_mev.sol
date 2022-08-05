// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

contract LotteryMEV {
    // blocknum => winner_address
    mapping(uint256 => address) public winners;
    uint256 private highest_bid;
    uint256 public last_bid_block;

    constructor() {
        last_bid_block = block.number;
        highest_bid = 1e9;
        winners[last_bid_block] = 0x0000000000000000000000000000000000000000;
    }

    function bid() public payable returns (uint256) {
        if (msg.value > highest_bid) {
            winners[block.number] = msg.sender;
            last_bid_block = block.number;
            highest_bid = msg.value;
            return msg.value;
        }
        return highest_bid;
    }

    function claim() public returns (uint256) {
        uint256 start_balance = address(this).balance;
        if (
            msg.sender == winners[last_bid_block] ||
            winners[last_bid_block] ==
            0x0000000000000000000000000000000000000000
        ) {
            highest_bid = 1e9;
            msg.sender.call{value: start_balance}("");
        }
        return start_balance;
    }
}
