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
    }

    function bid() public payable returns (uint256) {
        if (msg.value > highest_bid) {
            winners[block.number] = msg.sender;
            last_bid_block = block.number;
            highest_bid = msg.value;
        }
        return highest_bid;
    }

    function claim() public returns (uint256) {
        uint256 start_balance = address(this).balance;
        if (msg.sender == winners[last_bid_block]) {
            highest_bid = 1e9;
            msg.sender.call{value: address(this).balance}("");
        }
        return start_balance;
    }
}
