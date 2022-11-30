// SPDX-License-Identifier: MIT
pragma solidity =0.8.17;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface Weth is IERC20 {
    function withdraw(uint wad) external;
    function deposit() external payable;
}

interface IUniswapV2Pair {
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    function name() external pure returns (string memory);
    function symbol() external pure returns (string memory);
    function decimals() external pure returns (uint8);
    function totalSupply() external view returns (uint);
    function balanceOf(address owner) external view returns (uint);
    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint value) external returns (bool);
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);

    function DOMAIN_SEPARATOR() external view returns (bytes32);
    function PERMIT_TYPEHASH() external pure returns (bytes32);
    function nonces(address owner) external view returns (uint);

    function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s) external;

    event Mint(address indexed sender, uint amount0, uint amount1);
    event Burn(address indexed sender, uint amount0, uint amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    function MINIMUM_LIQUIDITY() external pure returns (uint);
    function factory() external view returns (address);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function price0CumulativeLast() external view returns (uint);
    function price1CumulativeLast() external view returns (uint);
    function kLast() external view returns (uint);

    function mint(address to) external returns (uint liquidity);
    function burn(address to) external returns (uint amount0, uint amount1);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
    function skim(address to) external;
    function sync() external;

    function initialize(address, address) external;
}

contract SkimUniswap {
    address private immutable owner;
    Weth private immutable weth;

    constructor(Weth _weth) {
        owner = msg.sender;
        weth = _weth;
    }

    receive() external payable {}

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
        require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        uint amountInWithFee = amountIn * 997;
        uint numerator = amountInWithFee * reserveOut;
        uint denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function skims(IUniswapV2Pair[] calldata _pairs) external {
        for (uint i=0; i < _pairs.length; i++) {
            skim(_pairs[i]);
        }
    }

    function skim(IUniswapV2Pair _pair) public {
        (uint256 reserve0, uint256 reserve1, ) = _pair.getReserves();
        IERC20 token0 = IERC20(_pair.token0());
        IERC20 token1 = IERC20(_pair.token1());
        uint256 actualBalance0 = token0.balanceOf(address(_pair));
        uint256 actualBalance1 = token1.balanceOf(address(_pair));
        uint256 excess0 = actualBalance0 - reserve0;
        uint256 excess1 = actualBalance1 - reserve1;
        if (excess0 == 0 && excess1 == 0) {
            revert("Nothing to skim");
        }
        if (
            (excess0 > 0 && token0 == weth) ||
            (excess1 > 0 && token1 == weth)) {
            _pair.skim(address(this));
        }
        // excess on non-weth token, before swap with no input
        if (excess0 > 0) {
            uint256 amountToGetOut = getAmountOut(excess0, reserve0, reserve1);
            _pair.swap(0, amountToGetOut, address(this), "");
        } else {
            uint256 amountToGetOut = getAmountOut(excess1, reserve1, reserve0);
            _pair.swap(amountToGetOut, 0, address(this), "");
        }

        uint256 wethBalance = weth.balanceOf(address(this));
        if (wethBalance == 0) {
            revert("no new weth");
        }
        weth.withdraw(wethBalance);
        // we now have wethBalance extra eth on the contract
        // TODO: do something with the eth
    }
}