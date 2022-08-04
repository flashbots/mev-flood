// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

contract LotteryMEV {
    // blocknum => winner_address
    mapping(uint256 => address) public winners;
    // blocknum => lottery_amount
    uint256 private bid_pot;
    uint256 public last_bid_block;

    constructor() {
        last_bid_block = block.number;
        bid_pot = 1e9;
    }

    function bid() public payable returns (uint256) {
        if (msg.value > bid_pot) {
            winners[block.number] = msg.sender;
            last_bid_block = block.number;
            bid_pot += msg.value;
        }
        return bid_pot;
    }

    function claim() public returns (uint256) {
        if (msg.sender == winners[last_bid_block]) {
            msg.sender.call{value: address(this).balance}("");
        }
        return address(this).balance;
    }
}
