// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TeraPepeCampaigns} from "../src/TeraPepeCampaigns.sol";

/// TPEPE_CA=0x... SIGNER=0x83e0... OWNER=0x<your main wallet> \
/// forge script script/Deploy.s.sol --rpc-url robinhood --broadcast --interactives 1
contract Deploy is Script {
    function run() external {
        address tpepe = vm.envAddress("TPEPE_CA");
        address signer = vm.envAddress("SIGNER");
        address owner = vm.envAddress("OWNER");
        vm.startBroadcast();
        TeraPepeCampaigns esc = new TeraPepeCampaigns(IERC20(tpepe), signer, owner);
        vm.stopBroadcast();
        console.log("TeraPepeCampaigns:", address(esc));
    }
}
