// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/// @title TeraPepe share campaigns escrow
/// @notice A token team deposits TPEPE and fixes the reward per referred visit and per buy-link click.
///         Nothing about a campaign can be changed after it is created.
///         Referral visits and clicks are counted off-chain; the signer issues claim vouchers for what each
///         sharer has earned. When the campaign ends the signer reports the total earned and the rest of
///         the deposit goes straight back to the creator.
contract TeraPepeCampaigns is EIP712, Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Campaign {
        address creator;
        uint64 startsAt;
        uint64 endsAt;
        bool closed;
        uint128 deposit; // TPEPE received
        uint128 rewardPerVisit; // TPEPE per counted referral visit
        uint128 rewardPerBuyClick; // TPEPE per counted buy-link click
        uint128 earned; // final total earned by sharers, set when closed
        uint128 claimed; // total already paid out
        bytes32 contentHash; // hash of the campaign content (token info, links), locked at creation
    }

    bytes32 private constant CLAIM_TYPEHASH =
        keccak256("Claim(address account,uint256 campaignId,uint256 cumulativeAmount)");

    /// @notice If the signer has not closed a campaign this long after it ended, the creator can close it.
    uint64 public constant RECLAIM_DELAY = 7 days;

    IERC20 public immutable token;
    uint256 public immutable minDeposit;

    address public signer;
    bool public creationPaused;
    uint256 public campaignCount;

    mapping(uint256 => Campaign) private _campaigns;
    mapping(uint256 => mapping(address => uint256)) public claimedBy;

    event CampaignCreated(
        uint256 indexed id,
        address indexed creator,
        uint256 deposit,
        uint256 rewardPerVisit,
        uint256 rewardPerBuyClick,
        uint64 startsAt,
        uint64 endsAt,
        bytes32 contentHash
    );
    event Claimed(uint256 indexed id, address indexed account, uint256 amount);
    event CampaignClosed(uint256 indexed id, uint256 earned, uint256 refunded, bool byCreator);
    event SignerChanged(address indexed signer);
    event CreationPaused(bool paused);

    error InvalidDuration();
    error DepositTooSmall();
    error InvalidReward();
    error CreationIsPaused();
    error UnknownCampaign();
    error NotSigner();
    error NotCreator();
    error NotEnded();
    error AlreadyClosed();
    error TooEarly();
    error InvalidEarned();
    error BadSignature();
    error NothingToClaim();
    error ExceedsBudget();
    error LengthMismatch();
    error ZeroAddress();

    constructor(IERC20 token_, address signer_, address owner_) EIP712("TeraPepeCampaigns", "1") Ownable(owner_) {
        if (address(token_) == address(0) || signer_ == address(0)) revert ZeroAddress();
        token = token_;
        minDeposit = 10_000 * 10 ** IERC20Metadata(address(token_)).decimals();
        signer = signer_;
        emit SignerChanged(signer_);
    }

    // ---------------------------------------------------------------- create

    /// @param amount TPEPE to deposit (at least 10,000 TPEPE)
    /// @param rewardPerVisit TPEPE paid for each counted referral visit
    /// @param rewardPerBuyClick TPEPE paid for each counted buy-link click
    /// @param durationHours 1, 2, 4, 6, 12 or 24
    /// @param contentHash keccak256 of the campaign content stored off-chain
    function createCampaign(
        uint256 amount,
        uint256 rewardPerVisit,
        uint256 rewardPerBuyClick,
        uint256 durationHours,
        bytes32 contentHash
    ) external nonReentrant returns (uint256 id) {
        if (creationPaused) revert CreationIsPaused();
        if (!_validDuration(durationHours)) revert InvalidDuration();

        // measure what actually arrived, in case the token ever takes a transfer fee
        uint256 before = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = token.balanceOf(address(this)) - before;

        if (received < minDeposit) revert DepositTooSmall();
        if (rewardPerVisit == 0 || rewardPerBuyClick == 0) revert InvalidReward();
        if (rewardPerVisit > received || rewardPerBuyClick > received) revert InvalidReward();

        id = ++campaignCount;
        uint64 startsAt = uint64(block.timestamp);
        uint64 endsAt = startsAt + uint64(durationHours * 1 hours);
        _campaigns[id] = Campaign({
            creator: msg.sender,
            startsAt: startsAt,
            endsAt: endsAt,
            closed: false,
            deposit: SafeCast.toUint128(received),
            rewardPerVisit: SafeCast.toUint128(rewardPerVisit),
            rewardPerBuyClick: SafeCast.toUint128(rewardPerBuyClick),
            earned: 0,
            claimed: 0,
            contentHash: contentHash
        });

        emit CampaignCreated(id, msg.sender, received, rewardPerVisit, rewardPerBuyClick, startsAt, endsAt, contentHash);
    }

    // ---------------------------------------------------------------- claim

    /// @notice Pay out what `msg.sender` has earned in a campaign so far.
    /// @param cumulativeAmount total earned by msg.sender in this campaign, as signed by the signer
    function claim(uint256 id, uint256 cumulativeAmount, bytes calldata signature) external nonReentrant {
        uint256 amount = _claim(id, cumulativeAmount, signature);
        token.safeTransfer(msg.sender, amount);
    }

    /// @notice Claim from several campaigns in one transaction.
    function claimMany(uint256[] calldata ids, uint256[] calldata cumulativeAmounts, bytes[] calldata signatures)
        external
        nonReentrant
    {
        if (ids.length != cumulativeAmounts.length || ids.length != signatures.length) revert LengthMismatch();
        uint256 total;
        for (uint256 i; i < ids.length; ++i) {
            total += _claim(ids[i], cumulativeAmounts[i], signatures[i]);
        }
        token.safeTransfer(msg.sender, total);
    }

    function _claim(uint256 id, uint256 cumulativeAmount, bytes calldata signature) private returns (uint256 amount) {
        Campaign storage c = _campaigns[id];
        if (c.creator == address(0)) revert UnknownCampaign();

        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(CLAIM_TYPEHASH, msg.sender, id, cumulativeAmount)));
        if (ECDSA.recover(digest, signature) != signer) revert BadSignature();

        uint256 already = claimedBy[id][msg.sender];
        if (cumulativeAmount <= already) revert NothingToClaim();
        amount = cumulativeAmount - already;

        uint256 budget = c.closed ? c.earned : c.deposit;
        if (uint256(c.claimed) + amount > budget) revert ExceedsBudget();

        claimedBy[id][msg.sender] = cumulativeAmount;
        c.claimed += uint128(amount);
        emit Claimed(id, msg.sender, amount);
    }

    // ---------------------------------------------------------------- close

    /// @notice Called by the signer once the campaign has ended: fixes the total earned by sharers
    ///         and returns the rest of the deposit to the creator.
    function finalize(uint256 id, uint256 earned) external nonReentrant {
        if (msg.sender != signer) revert NotSigner();
        Campaign storage c = _campaigns[id];
        if (c.creator == address(0)) revert UnknownCampaign();
        if (c.closed) revert AlreadyClosed();
        if (block.timestamp < c.endsAt) revert NotEnded();
        if (earned < c.claimed || earned > c.deposit) revert InvalidEarned();
        _close(id, c, earned, false);
    }

    /// @notice Safety valve: if the signer never closes the campaign, the creator can close it
    ///         RECLAIM_DELAY after it ended and take back everything not yet claimed.
    function reclaim(uint256 id) external nonReentrant {
        Campaign storage c = _campaigns[id];
        if (c.creator == address(0)) revert UnknownCampaign();
        if (msg.sender != c.creator) revert NotCreator();
        if (c.closed) revert AlreadyClosed();
        if (block.timestamp < uint256(c.endsAt) + RECLAIM_DELAY) revert TooEarly();
        _close(id, c, c.claimed, true);
    }

    function _close(uint256 id, Campaign storage c, uint256 earned, bool byCreator) private {
        c.closed = true;
        c.earned = uint128(earned);
        uint256 refund = uint256(c.deposit) - earned;
        if (refund > 0) token.safeTransfer(c.creator, refund);
        emit CampaignClosed(id, earned, refund, byCreator);
    }

    // ---------------------------------------------------------------- admin

    function setSigner(address signer_) external onlyOwner {
        if (signer_ == address(0)) revert ZeroAddress();
        signer = signer_;
        emit SignerChanged(signer_);
    }

    /// @notice Stops new campaigns only. Claims, finalize and reclaim keep working.
    function setCreationPaused(bool paused) external onlyOwner {
        creationPaused = paused;
        emit CreationPaused(paused);
    }

    // ---------------------------------------------------------------- views

    function getCampaign(uint256 id) external view returns (Campaign memory) {
        return _campaigns[id];
    }

    /// @notice TPEPE still available to be earned (0 once closed).
    function remaining(uint256 id) external view returns (uint256) {
        Campaign storage c = _campaigns[id];
        return c.closed ? 0 : uint256(c.deposit) - c.claimed;
    }

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function _validDuration(uint256 h) private pure returns (bool) {
        return h == 1 || h == 2 || h == 4 || h == 6 || h == 12 || h == 24;
    }
}
