// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PropertyToken
 * @dev ERC20 token representing fractional ownership of a real estate property
 */
contract PropertyToken is ERC20, Ownable, ReentrancyGuard {
    // ─── State Variables ────────────────────────────────────────────────────────

    uint256 public propertyId;
    uint256 public totalShares;
    uint256 public pricePerShare; // in wei
    uint256 public totalRevenue;
    bool public tradingEnabled;
    bool public propertyVerified;

    address public propertyOwner;
    address public platformContract;

    // Revenue distribution tracking
    mapping(address => uint256) public lastClaimedRevenue;
    mapping(address => uint256) public pendingRevenue;

    // Shareholder list for enumeration
    address[] public shareholders;
    mapping(address => bool) public isShareholder;

    // ─── Events ─────────────────────────────────────────────────────────────────

    event SharesPurchased(address indexed buyer, uint256 amount, uint256 totalCost);
    event SharesSold(address indexed seller, uint256 amount, uint256 totalValue);
    event RevenueDistributed(uint256 amount, uint256 timestamp);
    event RevenueClaimed(address indexed shareholder, uint256 amount);
    event TradingStatusChanged(bool enabled);
    event PropertyVerified(address indexed verifier);
    event PricePerShareUpdated(uint256 newPrice);

    // ─── Modifiers ───────────────────────────────────────────────────────────────

    modifier onlyPlatform() {
        require(msg.sender == platformContract, "Only platform contract");
        _;
    }

    modifier tradingActive() {
        require(tradingEnabled, "Trading is not enabled");
        require(propertyVerified, "Property not verified");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────────

    constructor(
        uint256 _propertyId,
        string memory _name,
        string memory _symbol,
        uint256 _totalShares,
        uint256 _pricePerShare,
        address _propertyOwner,
        address _platformContract
    ) ERC20(_name, _symbol) Ownable(_platformContract) {
        propertyId = _propertyId;
        totalShares = _totalShares;
        pricePerShare = _pricePerShare;
        propertyOwner = _propertyOwner;
        platformContract = _platformContract;
        tradingEnabled = false;
        propertyVerified = false;

        // Mint all shares to the property owner initially
        _mint(_propertyOwner, _totalShares);
        _addShareholder(_propertyOwner);
    }

    // ─── Core Functions ──────────────────────────────────────────────────────────

    /**
     * @dev Buy shares directly from the property owner
     */
    function buyShares(uint256 shareAmount) external payable nonReentrant tradingActive {
        require(shareAmount > 0, "Amount must be > 0");
        require(msg.value >= shareAmount * pricePerShare, "Insufficient ETH sent");

        address seller = propertyOwner;
        require(balanceOf(seller) >= shareAmount, "Not enough shares available");

        // Transfer shares from property owner to buyer
        _transfer(seller, msg.sender, shareAmount);

        // Pay the property owner
        uint256 cost = shareAmount * pricePerShare;
        (bool sent, ) = payable(seller).call{value: cost}("");
        require(sent, "ETH transfer failed");

        // Refund excess ETH
        if (msg.value > cost) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - cost}("");
            require(refunded, "Refund failed");
        }

        _addShareholder(msg.sender);
        emit SharesPurchased(msg.sender, shareAmount, cost);
    }

    /**
     * @dev Sell shares back (peer-to-peer via platform)
     */
    function sellShares(address buyer, uint256 shareAmount) external payable nonReentrant tradingActive {
        require(shareAmount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= shareAmount, "Insufficient shares");
        require(msg.value >= shareAmount * pricePerShare, "Insufficient ETH");

        uint256 cost = shareAmount * pricePerShare;

        _transfer(msg.sender, buyer, shareAmount);

        (bool sent, ) = payable(msg.sender).call{value: cost}("");
        require(sent, "ETH transfer failed");

        if (msg.value > cost) {
            (bool refunded, ) = payable(buyer).call{value: msg.value - cost}("");
            require(refunded, "Refund failed");
        }

        _addShareholder(buyer);
        emit SharesSold(msg.sender, shareAmount, cost);
    }

    /**
     * @dev Distribute rental revenue to all shareholders proportionally
     */
    function distributeRevenue() external payable onlyPlatform {
        require(msg.value > 0, "No revenue to distribute");
        require(totalSupply() > 0, "No shares outstanding");

        totalRevenue += msg.value;

        // Distribute proportionally to all shareholders
        for (uint256 i = 0; i < shareholders.length; i++) {
            address holder = shareholders[i];
            uint256 balance = balanceOf(holder);
            if (balance > 0) {
                uint256 share = (msg.value * balance) / totalSupply();
                pendingRevenue[holder] += share;
            }
        }

        emit RevenueDistributed(msg.value, block.timestamp);
    }

    /**
     * @dev Claim pending revenue
     */
    function claimRevenue() external nonReentrant {
        uint256 amount = pendingRevenue[msg.sender];
        require(amount > 0, "No pending revenue");

        pendingRevenue[msg.sender] = 0;
        lastClaimedRevenue[msg.sender] = block.timestamp;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Revenue transfer failed");

        emit RevenueClaimed(msg.sender, amount);
    }

    // ─── Admin Functions ─────────────────────────────────────────────────────────

    function verifyProperty() external onlyPlatform {
        propertyVerified = true;
        emit PropertyVerified(msg.sender);
    }

    function enableTrading() external onlyPlatform {
        require(propertyVerified, "Property must be verified first");
        tradingEnabled = true;
        emit TradingStatusChanged(true);
    }

    function disableTrading() external onlyPlatform {
        tradingEnabled = false;
        emit TradingStatusChanged(false);
    }

    function updatePricePerShare(uint256 newPrice) external onlyPlatform {
        require(newPrice > 0, "Price must be > 0");
        pricePerShare = newPrice;
        emit PricePerShareUpdated(newPrice);
    }

    // ─── View Functions ──────────────────────────────────────────────────────────

    function getOwnershipPercentage(address holder) external view returns (uint256) {
        if (totalSupply() == 0) return 0;
        return (balanceOf(holder) * 10000) / totalSupply(); // basis points (100 = 1%)
    }

    function getShareholderCount() external view returns (uint256) {
        return shareholders.length;
    }

    function getAllShareholders() external view returns (address[] memory) {
        return shareholders;
    }

    function getAvailableShares() external view returns (uint256) {
        return balanceOf(propertyOwner);
    }

    function getPendingRevenue(address holder) external view returns (uint256) {
        return pendingRevenue[holder];
    }

    // ─── Internal Functions ──────────────────────────────────────────────────────

    function _addShareholder(address holder) internal {
        if (!isShareholder[holder]) {
            isShareholder[holder] = true;
            shareholders.push(holder);
        }
    }

    // Override transfer to track shareholders
    function _update(address from, address to, uint256 value) internal override {
        super._update(from, to, value);
        if (to != address(0)) {
            _addShareholder(to);
        }
    }

    receive() external payable {}
}
