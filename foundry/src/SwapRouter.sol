// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SwapRouter is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable pyusd;
    IERC20 public immutable usdc;
    uint256 public pyusdLiquidity;
    uint256 public usdcLiquidity;

    event LiquidityAdded(uint256 pyusdAmount, uint256 usdcAmount);
    event SwappedForBridge(address user, uint256 pyusdIn, uint256 usdcOut);
    event SwappedFromBridge(
        address recipient,
        uint256 usdcIn,
        uint256 pyusdOut
    );

    constructor(address _pyusd, address _usdc) Ownable(msg.sender) {
        pyusd = IERC20(_pyusd);
        usdc = IERC20(_usdc);
    }

    // Owner funds with equal amounts for both tokens
    function addLiquidity(
        uint256 pyusdAmt,
        uint256 usdcAmt
    ) external onlyOwner {
        pyusd.safeTransferFrom(msg.sender, address(this), pyusdAmt);
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmt);
        pyusdLiquidity += pyusdAmt;
        usdcLiquidity += usdcAmt;
        emit LiquidityAdded(pyusdAmt, usdcAmt);
    }

    // Step 1: swap PYUSD -> USDC for bridging
    function swapForBridge(
        uint256 pyusdAmt
    ) external returns (uint256 usdcAmt) {
        require(
            pyusdAmt > 0 && usdcLiquidity >= pyusdAmt,
            "Insufficient liquidity"
        );
        pyusd.safeTransferFrom(msg.sender, address(this), pyusdAmt);
        usdcAmt = pyusdAmt; // 1:1 for testnet
        usdc.safeTransfer(msg.sender, usdcAmt);
        pyusdLiquidity += pyusdAmt;
        usdcLiquidity -= usdcAmt;
        emit SwappedForBridge(msg.sender, pyusdAmt, usdcAmt);
    }

    // Step 3: swap USDC -> PYUSD after bridging
    function swapFromBridge(
        uint256 usdcAmt,
        address recipient
    ) external returns (uint256 pyusdAmt) {
        require(
            usdcAmt > 0 && pyusdLiquidity >= usdcAmt,
            "Insufficient liquidity"
        );
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmt);
        pyusdAmt = usdcAmt; // 1:1 for testnet
        pyusd.safeTransfer(recipient, pyusdAmt);
        usdcLiquidity += usdcAmt;
        pyusdLiquidity -= pyusdAmt;
        emit SwappedFromBridge(recipient, usdcAmt, pyusdAmt);
    }

    // Emergency withdraw function for owner
    function emergencyWithdraw() external onlyOwner {
        if (pyusdLiquidity > 0) {
            pyusd.safeTransfer(owner(), pyusdLiquidity);
            pyusdLiquidity = 0;
        }
        if (usdcLiquidity > 0) {
            usdc.safeTransfer(owner(), usdcLiquidity);
            usdcLiquidity = 0;
        }
    }

    // View functions for liquidity
    function getLiquidity()
        external
        view
        returns (uint256 pyusdLiq, uint256 usdcLiq)
    {
        return (pyusdLiquidity, usdcLiquidity);
    }
}

// Deploy SwapRouter on each chain with respective token addresses:

// Ethereum Sepolia

// PYUSD: 0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9

// USDC: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

// Arbitrum Sepolia

// PYUSD: 0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1

// USDC: 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d
