// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {TeraPepeCampaigns} from "../src/TeraPepeCampaigns.sol";

contract TestToken is ERC20 {
    constructor() ERC20("TeraPepe", "TPEPE") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TeraPepeCampaignsTest is Test {
    TestToken token;
    TeraPepeCampaigns esc;

    uint256 signerKey = 0xA11CE;
    address signer;
    address owner = makeAddr("owner");
    address creator = makeAddr("creator");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    uint256 constant T = 1e18;
    bytes32 constant CONTENT = keccak256("campaign content");

    function setUp() public {
        signer = vm.addr(signerKey);
        token = new TestToken();
        esc = new TeraPepeCampaigns(token, signer, owner);
        token.mint(creator, 1_000_000 * T);
        vm.prank(creator);
        token.approve(address(esc), type(uint256).max);
    }

    function _create(uint256 amount, uint256 hours_) internal returns (uint256) {
        vm.prank(creator);
        return esc.createCampaign(amount, 10 * T, 50 * T, hours_, CONTENT);
    }

    function _sig(address account, uint256 id, uint256 cumulative) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Claim(address account,uint256 campaignId,uint256 cumulativeAmount)"), account, id, cumulative
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", esc.domainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, digest);
        return abi.encodePacked(r, s, v);
    }

    // ---------------- create

    function test_create_storesTermsAndPullsDeposit() public {
        uint256 id = _create(10_000 * T, 6);
        TeraPepeCampaigns.Campaign memory c = esc.getCampaign(id);
        assertEq(c.creator, creator);
        assertEq(c.deposit, 10_000 * T);
        assertEq(c.rewardPerVisit, 10 * T);
        assertEq(c.rewardPerBuyClick, 50 * T);
        assertEq(c.endsAt - c.startsAt, 6 hours);
        assertEq(c.contentHash, CONTENT);
        assertEq(token.balanceOf(address(esc)), 10_000 * T);
    }

    function test_create_minDepositIs10000() public {
        assertEq(esc.minDeposit(), 10_000 * T);
        vm.prank(creator);
        vm.expectRevert(TeraPepeCampaigns.DepositTooSmall.selector);
        esc.createCampaign(9_999 * T, 10 * T, 50 * T, 1, CONTENT);
    }

    function test_create_onlyAllowedDurations() public {
        uint256[6] memory ok = [uint256(1), 2, 4, 6, 12, 24];
        for (uint256 i; i < ok.length; ++i) _create(10_000 * T, ok[i]);
        uint256[5] memory bad = [uint256(0), 3, 5, 48, 25];
        for (uint256 i; i < bad.length; ++i) {
            vm.prank(creator);
            vm.expectRevert(TeraPepeCampaigns.InvalidDuration.selector);
            esc.createCampaign(10_000 * T, 10 * T, 50 * T, bad[i], CONTENT);
        }
    }

    function test_create_requiresBothRewards() public {
        vm.startPrank(creator);
        vm.expectRevert(TeraPepeCampaigns.InvalidReward.selector);
        esc.createCampaign(10_000 * T, 0, 50 * T, 1, CONTENT);
        vm.expectRevert(TeraPepeCampaigns.InvalidReward.selector);
        esc.createCampaign(10_000 * T, 10 * T, 0, 1, CONTENT);
        vm.expectRevert(TeraPepeCampaigns.InvalidReward.selector);
        esc.createCampaign(10_000 * T, 10_001 * T, 50 * T, 1, CONTENT);
        vm.stopPrank();
    }

    function test_create_pausedByOwner() public {
        vm.prank(owner);
        esc.setCreationPaused(true);
        vm.prank(creator);
        vm.expectRevert(TeraPepeCampaigns.CreationIsPaused.selector);
        esc.createCampaign(10_000 * T, 10 * T, 50 * T, 1, CONTENT);
    }

    // ---------------- claim

    function test_claim_paysCumulativeDelta() public {
        uint256 id = _create(10_000 * T, 1);
        bytes memory s1 = _sig(alice, id, 30 * T);
        vm.prank(alice);
        esc.claim(id, 30 * T, s1);
        assertEq(token.balanceOf(alice), 30 * T);

        bytes memory s2 = _sig(alice, id, 100 * T);

        vm.prank(alice);
        esc.claim(id, 100 * T, s2);
        assertEq(token.balanceOf(alice), 100 * T);
        assertEq(esc.claimedBy(id, alice), 100 * T);
        assertEq(esc.remaining(id), 9_900 * T);
    }

    function test_claim_cannotReuseVoucher() public {
        uint256 id = _create(10_000 * T, 1);
        bytes memory s = _sig(alice, id, 30 * T);
        vm.startPrank(alice);
        esc.claim(id, 30 * T, s);
        vm.expectRevert(TeraPepeCampaigns.NothingToClaim.selector);
        esc.claim(id, 30 * T, s);
        vm.stopPrank();
    }

    function test_claim_voucherBoundToAccount() public {
        uint256 id = _create(10_000 * T, 1);
        bytes memory s = _sig(alice, id, 30 * T);
        vm.prank(bob);
        vm.expectRevert(TeraPepeCampaigns.BadSignature.selector);
        esc.claim(id, 30 * T, s);
    }

    function test_claim_voucherBoundToCampaign() public {
        uint256 id1 = _create(10_000 * T, 1);
        uint256 id2 = _create(10_000 * T, 1);
        bytes memory s = _sig(alice, id1, 30 * T);
        vm.prank(alice);
        vm.expectRevert(TeraPepeCampaigns.BadSignature.selector);
        esc.claim(id2, 30 * T, s);
    }

    function test_claim_rejectsWrongSigner() public {
        uint256 id = _create(10_000 * T, 1);
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Claim(address account,uint256 campaignId,uint256 cumulativeAmount)"), alice, id, 30 * T
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", esc.domainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(0xBAD, digest);
        vm.prank(alice);
        vm.expectRevert(TeraPepeCampaigns.BadSignature.selector);
        esc.claim(id, 30 * T, abi.encodePacked(r, s, v));
    }

    function test_claim_cannotExceedDeposit() public {
        uint256 id = _create(10_000 * T, 1);
        bytes memory s3 = _sig(alice, id, 9_000 * T);
        vm.prank(alice);
        esc.claim(id, 9_000 * T, s3);
        bytes memory s4 = _sig(bob, id, 1_001 * T);
        vm.prank(bob);
        vm.expectRevert(TeraPepeCampaigns.ExceedsBudget.selector);
        esc.claim(id, 1_001 * T, s4);
    }

    function test_claimMany() public {
        uint256 id1 = _create(10_000 * T, 1);
        uint256 id2 = _create(10_000 * T, 1);
        uint256[] memory ids = new uint256[](2);
        uint256[] memory amts = new uint256[](2);
        bytes[] memory sigs = new bytes[](2);
        (ids[0], amts[0], sigs[0]) = (id1, 20 * T, _sig(alice, id1, 20 * T));
        (ids[1], amts[1], sigs[1]) = (id2, 70 * T, _sig(alice, id2, 70 * T));
        vm.prank(alice);
        esc.claimMany(ids, amts, sigs);
        assertEq(token.balanceOf(alice), 90 * T);
    }

    // ---------------- finalize

    function test_finalize_refundsRestToCreator() public {
        uint256 id = _create(10_000 * T, 2);
        bytes memory s5 = _sig(alice, id, 100 * T);
        vm.prank(alice);
        esc.claim(id, 100 * T, s5);

        vm.warp(block.timestamp + 2 hours);
        uint256 before = token.balanceOf(creator);
        vm.prank(signer);
        esc.finalize(id, 400 * T); // alice claimed 100, bob still has 300 to claim

        assertEq(token.balanceOf(creator) - before, 9_600 * T);
        assertEq(esc.remaining(id), 0);

        // bob can still claim what he earned
        bytes memory s6 = _sig(bob, id, 300 * T);
        vm.prank(bob);
        esc.claim(id, 300 * T, s6);
        assertEq(token.balanceOf(bob), 300 * T);

        // nothing beyond the reported total
        bytes memory s7 = _sig(bob, id, 301 * T);
        vm.prank(bob);
        vm.expectRevert(TeraPepeCampaigns.ExceedsBudget.selector);
        esc.claim(id, 301 * T, s7);
        assertEq(token.balanceOf(address(esc)), 0);
    }

    function test_finalize_onlySignerAfterEnd() public {
        uint256 id = _create(10_000 * T, 1);
        vm.prank(signer);
        vm.expectRevert(TeraPepeCampaigns.NotEnded.selector);
        esc.finalize(id, 0);

        vm.warp(block.timestamp + 1 hours);
        vm.prank(creator);
        vm.expectRevert(TeraPepeCampaigns.NotSigner.selector);
        esc.finalize(id, 0);

        vm.prank(signer);
        esc.finalize(id, 0);
        vm.prank(signer);
        vm.expectRevert(TeraPepeCampaigns.AlreadyClosed.selector);
        esc.finalize(id, 0);
    }

    function test_finalize_earnedBounds() public {
        uint256 id = _create(10_000 * T, 1);
        bytes memory s8 = _sig(alice, id, 100 * T);
        vm.prank(alice);
        esc.claim(id, 100 * T, s8);
        vm.warp(block.timestamp + 1 hours);
        vm.startPrank(signer);
        vm.expectRevert(TeraPepeCampaigns.InvalidEarned.selector);
        esc.finalize(id, 99 * T);
        vm.expectRevert(TeraPepeCampaigns.InvalidEarned.selector);
        esc.finalize(id, 10_001 * T);
        vm.stopPrank();
    }

    // ---------------- reclaim fallback

    function test_reclaim_afterDelayIfNotFinalized() public {
        uint256 id = _create(10_000 * T, 1);
        bytes memory s9 = _sig(alice, id, 100 * T);
        vm.prank(alice);
        esc.claim(id, 100 * T, s9);

        vm.warp(block.timestamp + 1 hours + 7 days - 1);
        vm.prank(creator);
        vm.expectRevert(TeraPepeCampaigns.TooEarly.selector);
        esc.reclaim(id);

        vm.warp(block.timestamp + 1);
        vm.prank(alice);
        vm.expectRevert(TeraPepeCampaigns.NotCreator.selector);
        esc.reclaim(id);

        uint256 before = token.balanceOf(creator);
        vm.prank(creator);
        esc.reclaim(id);
        assertEq(token.balanceOf(creator) - before, 9_900 * T);
        assertEq(token.balanceOf(address(esc)), 0);
    }

    // ---------------- admin

    function test_admin_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        esc.setSigner(alice);
        vm.prank(alice);
        vm.expectRevert();
        esc.setCreationPaused(true);
        vm.prank(owner);
        esc.setSigner(bob);
        assertEq(esc.signer(), bob);
    }

    // ---------------- invariant-style fuzz: escrow never pays out more than deposits

    function testFuzz_neverOverpays(uint96 a, uint96 b, uint96 earnedSeed) public {
        uint256 id = _create(50_000 * T, 4);
        uint256 dep = 50_000 * T;
        uint256 ca = bound(a, 1, dep);
        uint256 cb = bound(b, 1, dep);

        bytes memory s10 = _sig(alice, id, ca);

        vm.prank(alice);
        esc.claim(id, ca, s10);
        if (ca + cb <= dep) {
            bytes memory s11 = _sig(bob, id, cb);
            vm.prank(bob);
            esc.claim(id, cb, s11);
        }
        uint256 claimed = esc.getCampaign(id).claimed;
        uint256 earned = bound(earnedSeed, claimed, dep);
        vm.warp(block.timestamp + 4 hours);
        vm.prank(signer);
        esc.finalize(id, earned);

        // escrow keeps exactly what is still owed to sharers
        assertEq(token.balanceOf(address(esc)), earned - claimed);
    }
}
