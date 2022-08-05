// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

interface LotteryMEV {
    function bid() external payable returns (uint256);

    function claim() external returns (uint256);
}

contract AtomicLottery {
    constructor(address lotteryAddress) payable {
        LotteryMEV lottery = LotteryMEV(lotteryAddress);
        lottery.bid{value: msg.value}();
        lottery.claim();
        selfdestruct(payable(msg.sender));
    }
}
