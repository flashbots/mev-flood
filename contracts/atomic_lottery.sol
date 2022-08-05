// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

interface LotteryMEV {
    function bid() external payable returns (uint256);

    function claim() external returns (uint256);
}

contract AtomicLottery {
    constructor(address lottery_address) payable {
        LotteryMEV lottery = LotteryMEV(lottery_address);
        uint256 highest_bid = lottery.bid{value: msg.value}();
        require(msg.value >= highest_bid, "bid not high enough");
        lottery.claim();
        selfdestruct(payable(msg.sender));
    }
}
