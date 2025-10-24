// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ContributorRewardNFT} from "../src/ContributorNFT.sol";

contract CounterScript is Script {
    ContributorRewardNFT public contributorRewardNFT;


    function run() public {
        vm.startBroadcast();

        contributorRewardNFT = new ContributorRewardNFT();

        vm.stopBroadcast();
    }
    
}
