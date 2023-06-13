// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "./univ2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "./univ2-core/contracts/interfaces/IERC20.sol";
import "./UniV2Library.sol";

interface IWeth is IERC20 {
    function withdraw(uint256 wad) external;
}

contract AtomicSwap {
    address public WETH;
    address private owner;
    IWeth private weth;

    constructor(address _weth) {
        WETH = _weth;
        weth = IWeth(_weth);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not allowed");
        _;
    }

    fallback() external payable {}

    function liquidate() external onlyOwner {
        weth.transfer(owner, weth.balanceOf(address(this)));
    }

    // perform swap from sender's account
    function _swap(
        uint256 amount0Out, // param to pair.swap
        uint256 amount1Out, // param to pair.swap
        address tokenInAddress, // address of token that searcher sends to swap
        address pairAddress, // univ2 pair address to execute swap
        address recipient, // address that receives the tokens
        bool fromThis // flag to swap from this contract
    ) internal {
        IUniswapV2Pair pair = IUniswapV2Pair(pairAddress);
        IERC20 tokenIn = IERC20(tokenInAddress);

        uint256 transferAmount = pair.token0() == tokenInAddress
            ? amount0Out
            : amount1Out;

        require(
            fromThis
                ? tokenIn.transfer(pairAddress, transferAmount)
                : tokenIn.transferFrom(msg.sender, pairAddress, transferAmount),
            "transfer failed"
        );
        pair.swap(
            amount0Out == transferAmount ? 0 : amount0Out,
            amount1Out == transferAmount ? 0 : amount1Out,
            recipient,
            new bytes(0)
        );
    }

    function swap(
        address[] memory path,
        uint256 amountIn,
        address factory,
        address recipient,
        bool fromThis
    ) public {
        IUniswapV2Pair pair = IUniswapV2Pair(
            IUniswapV2Factory(factory).getPair(path[0], path[1])
        );
        // path-wise amounts
        uint256[] memory amounts = UniswapV2Library.getAmountsOut(
            factory,
            amountIn,
            path
        );
        _swap(
            pair.token0() == path[0] ? amounts[0] : amounts[1],
            pair.token0() == path[0] ? amounts[1] : amounts[0],
            path[0],
            address(pair),
            recipient,
            fromThis
        );
    }

    function swapCheaper(
        address[] memory path,
        uint256 amountIn,
        address factory,
        address recipient,
        address _pair,
        bool fromThis // true => use contract's balance; false => use sender's balance
    ) public returns (uint256 amountOut) {
        IUniswapV2Pair pair = IUniswapV2Pair(_pair);
        uint256[] memory amounts = UniswapV2Library.getAmountsOut(
            factory,
            amountIn,
            path
        );
        _swap(
            pair.token0() == path[0] ? amounts[0] : amounts[1], // amount0Out
            pair.token0() == path[0] ? amounts[1] : amounts[0], // amount1Out
            path[0], // tokenInAddress
            _pair,
            recipient,
            fromThis
        );
        amountOut = path[1] == pair.token0() ? amounts[0] : amounts[1];
    }

    // TODO:
    // function swapCheapest(address _pair, uint256[] memory _amountsOut) public {}

    // assume we only settle in WETH
    // FYI this is _incredibly_ inefficient
    /** deprecated */
    function backrun(
        address _token, // token we're going to buy and sell
        address _startFactory, // factory of pair we'll buy token from
        address _endFactory, // factory of pair we'll sell token to
        uint256 _amountIn // amount of WETH to spend on tokens
    ) external {
        uint256 startBalance = weth.balanceOf(address(this));

        address[] memory startPath = new address[](2);
        address[] memory endPath = new address[](2);
        startPath[0] = WETH;
        startPath[1] = _token;
        endPath[0] = _token;
        endPath[1] = WETH;

        // swap WETH -> TKN on startPair
        swap(startPath, _amountIn, _startFactory, address(this), false);

        // swap TKN -> WETH on endPair
        swap(
            endPath,
            IERC20(_token).balanceOf(address(this)),
            _endFactory,
            address(this),
            true
        );
        require(
            weth.balanceOf(address(this)) > (startBalance + _amountIn),
            "arb not profitable"
        );
        uint256 tipAmount = ((weth.balanceOf(address(this)) -
            startBalance -
            _amountIn) * 9000) / 10000;
        weth.withdraw(tipAmount);
        block.coinbase.transfer(tipAmount); // pay validator
        weth.transfer(msg.sender, weth.balanceOf(address(this))); // send surplus to caller (inefficient!)
    }

    // executes a two-dex circular arb
    function arb(
        address _tokenArb,
        address _tokenSettle,
        address _startFactory,
        address _endFactory,
        address _pairStart,
        address _pairEnd,
        uint256 _amountIn
    ) external returns (uint256 amountOut) {
        // swap _tokenSettle -> _tokenArb on _startFactory's pair (pay into this contract)
        address[] memory buyPath = new address[](2);
        buyPath[0] = _tokenSettle;
        buyPath[1] = _tokenArb;
        swapCheaper(
            buyPath,
            _amountIn,
            _startFactory,
            address(this),
            _pairStart,
            false
        );

        // swap _tokenArb -> _tokenSettle on _endFactory's pair
        address[] memory sellPath = new address[](2);
        sellPath[0] = _tokenArb;
        sellPath[1] = _tokenSettle;
        IERC20 arbToken = IERC20(_tokenArb);
        amountOut = swapCheaper(
            sellPath,
            arbToken.balanceOf(address(this)), // TODO make cheaper by being passed in
            _endFactory,
            msg.sender,
            _pairEnd,
            true
        );

        // // tip validator
        // weth.withdraw();
        // block.coinbase.transfer(_tip);
        // IERC20 settleToken = IERC20(_tokenSettle);
        // settleToken.transfer(msg.sender, settleToken.balanceOf(address(this)));
    }
}
