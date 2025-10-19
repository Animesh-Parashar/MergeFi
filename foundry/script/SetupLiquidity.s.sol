// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SetupLiquidity is Script {
    function run(address routerAddress, uint256 liquidityAmount) external {
        vm.startBroadcast();

        SwapRouter router = SwapRouter(routerAddress);
        address pyusdAddress = address(router.pyusd());
        address usdcAddress = address(router.usdc());

        IERC20 pyusd = IERC20(pyusdAddress);
        IERC20 usdc = IERC20(usdcAddress);

        // Approve tokens
        pyusd.approve(routerAddress, liquidityAmount);
        usdc.approve(routerAddress, liquidityAmount);

        // Add liquidity
        router.addLiquidity(liquidityAmount, liquidityAmount);

        console.log("Liquidity added:");
        console.log("PYUSD Amount:", liquidityAmount);
        console.log("USDC Amount:", liquidityAmount);
        console.log("Router liquidity - PYUSD:", router.pyusdLiquidity());
        console.log("Router liquidity - USDC:", router.usdcLiquidity());

        vm.stopBroadcast();
    }
}
