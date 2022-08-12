// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

interface LotteryMEV {
    function bid() external payable returns (uint256);

    function claim() external returns (uint256);
}

contract AtomicLottery {
    constructor(address lottery_address) payable {
        LotteryMEV lottery = LotteryMEV(lottery_address);
        lottery.bid{value: msg.value}();
        lottery.claim();
        require(address(this).balance > msg.value, "bid not high enough");
        selfdestruct(payable(msg.sender));
    }
}
