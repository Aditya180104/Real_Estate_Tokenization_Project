// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PropertyToken.sol";

/**
 * @title RealEstatePlatform
 * @dev Main platform contract for managing property tokenization
 */
contract RealEstatePlatform is Ownable, ReentrancyGuard {
    // ─── Structs ─────────────────────────────────────────────────────────────────

    struct Property {
        uint256 id;
        string name;
        string location;
        uint256 totalValue;      // in wei
        uint256 totalShares;
        uint256 pricePerShare;   // in wei
        address propertyOwner;
        address tokenContract;
        PropertyStatus status;
        uint256 createdAt;
        string metadataURI;      // IPFS URI for property documents/images
    }

    struct Transaction {
        uint256 id;
        uint256 propertyId;
        address from;
        address to;
        uint256 shares;
        uint256 amount;          // in wei
        TransactionType txType;
        uint256 timestamp;
        bytes32 txHash;
    }

    enum PropertyStatus {
        Pending,
        Verified,
        Active,
        Suspended,
        Delisted
    }

    enum TransactionType {
        Purchase,
        Sale,
        RevenueDistribution,
        RevenueClaim
    }

    // ─── State Variables ─────────────────────────────────────────────────────────

    uint256 public propertyCount;
    uint256 public transactionCount;
    uint256 public platformFeePercent; // basis points (250 = 2.5%)
    address public feeRecipient;

    mapping(uint256 => Property) public properties;
    mapping(uint256 => Transaction) public transactions;
    mapping(address => uint256[]) public ownerProperties;
    mapping(address => uint256[]) public investorTransactions;
    mapping(address => bool) public verifiedUsers;
    mapping(address => bool) public admins;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event PropertyRegistered(uint256 indexed propertyId, address indexed owner, address tokenContract);
    event PropertyVerified(uint256 indexed propertyId, address indexed verifier);
    event PropertyStatusChanged(uint256 indexed propertyId, PropertyStatus newStatus);
    event SharesPurchased(uint256 indexed propertyId, address indexed buyer, uint256 shares, uint256 amount);
    event SharesSold(uint256 indexed propertyId, address indexed seller, address indexed buyer, uint256 shares);
    event RevenueDistributed(uint256 indexed propertyId, uint256 amount);
    event UserVerified(address indexed user);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event PlatformFeeUpdated(uint256 newFee);

    // ─── Modifiers ───────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner(), "Not an admin");
        _;
    }

    modifier onlyVerifiedUser() {
        require(verifiedUsers[msg.sender], "User not verified (KYC required)");
        _;
    }

    modifier propertyExists(uint256 propertyId) {
        require(propertyId > 0 && propertyId <= propertyCount, "Property does not exist");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────────

    constructor(address _feeRecipient, uint256 _platformFeePercent) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
        platformFeePercent = _platformFeePercent;
        admins[msg.sender] = true;
    }

    // ─── Property Management ─────────────────────────────────────────────────────

    /**
     * @dev Register a new property and deploy its token contract
     */
    function registerProperty(
        string memory name,
        string memory location,
        uint256 totalValue,
        uint256 totalShares,
        uint256 pricePerShare,
        string memory metadataURI,
        string memory tokenName,
        string memory tokenSymbol
    ) external onlyVerifiedUser returns (uint256) {
        require(totalShares > 0, "Shares must be > 0");
        require(pricePerShare > 0, "Price must be > 0");
        require(bytes(name).length > 0, "Name required");

        propertyCount++;
        uint256 propertyId = propertyCount;

        // Deploy property token contract
        PropertyToken tokenContract = new PropertyToken(
            propertyId,
            tokenName,
            tokenSymbol,
            totalShares,
            pricePerShare,
            msg.sender,
            address(this)
        );

        properties[propertyId] = Property({
            id: propertyId,
            name: name,
            location: location,
            totalValue: totalValue,
            totalShares: totalShares,
            pricePerShare: pricePerShare,
            propertyOwner: msg.sender,
            tokenContract: address(tokenContract),
            status: PropertyStatus.Pending,
            createdAt: block.timestamp,
            metadataURI: metadataURI
        });

        ownerProperties[msg.sender].push(propertyId);

        emit PropertyRegistered(propertyId, msg.sender, address(tokenContract));
        return propertyId;
    }

    /**
     * @dev Admin verifies a property and enables trading
     */
    function verifyProperty(uint256 propertyId) external onlyAdmin propertyExists(propertyId) {
        Property storage prop = properties[propertyId];
        require(prop.status == PropertyStatus.Pending, "Property not in pending state");

        prop.status = PropertyStatus.Verified;
        PropertyToken(prop.tokenContract).verifyProperty();

        emit PropertyVerified(propertyId, msg.sender);
    }

    /**
     * @dev Admin activates trading for a verified property
     */
    function activateProperty(uint256 propertyId) external onlyAdmin propertyExists(propertyId) {
        Property storage prop = properties[propertyId];
        require(prop.status == PropertyStatus.Verified, "Property must be verified first");

        prop.status = PropertyStatus.Active;
        PropertyToken(prop.tokenContract).enableTrading();

        emit PropertyStatusChanged(propertyId, PropertyStatus.Active);
    }

    /**
     * @dev Admin suspends a property
     */
    function suspendProperty(uint256 propertyId) external onlyAdmin propertyExists(propertyId) {
        Property storage prop = properties[propertyId];
        prop.status = PropertyStatus.Suspended;
        PropertyToken(prop.tokenContract).disableTrading();

        emit PropertyStatusChanged(propertyId, PropertyStatus.Suspended);
    }

    // ─── Trading Functions ────────────────────────────────────────────────────────

    /**
     * @dev Buy shares of a property
     */
    function buyShares(uint256 propertyId, uint256 shareAmount)
        external
        payable
        nonReentrant
        onlyVerifiedUser
        propertyExists(propertyId)
    {
        Property storage prop = properties[propertyId];
        require(prop.status == PropertyStatus.Active, "Property not active");
        require(shareAmount > 0, "Amount must be > 0");

        uint256 totalCost = shareAmount * prop.pricePerShare;
        uint256 platformFee = (totalCost * platformFeePercent) / 10000;
        uint256 sellerAmount = totalCost - platformFee;

        require(msg.value >= totalCost + platformFee, "Insufficient ETH");

        PropertyToken token = PropertyToken(prop.tokenContract);
        require(token.balanceOf(prop.propertyOwner) >= shareAmount, "Not enough shares");

        // Transfer shares
        token.transferFrom(prop.propertyOwner, msg.sender, shareAmount);

        // Pay property owner
        (bool ownerPaid, ) = payable(prop.propertyOwner).call{value: sellerAmount}("");
        require(ownerPaid, "Owner payment failed");

        // Collect platform fee
        (bool feePaid, ) = payable(feeRecipient).call{value: platformFee}("");
        require(feePaid, "Fee payment failed");

        // Refund excess
        uint256 totalRequired = totalCost + platformFee;
        if (msg.value > totalRequired) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - totalRequired}("");
            require(refunded, "Refund failed");
        }

        // Record transaction
        _recordTransaction(propertyId, prop.propertyOwner, msg.sender, shareAmount, totalCost, TransactionType.Purchase);

        emit SharesPurchased(propertyId, msg.sender, shareAmount, totalCost);
    }

    /**
     * @dev Distribute rental revenue to token holders
     */
    function distributeRevenue(uint256 propertyId)
        external
        payable
        propertyExists(propertyId)
    {
        Property storage prop = properties[propertyId];
        require(msg.sender == prop.propertyOwner || admins[msg.sender], "Not authorized");
        require(msg.value > 0, "No revenue to distribute");

        PropertyToken(prop.tokenContract).distributeRevenue{value: msg.value}();

        _recordTransaction(propertyId, msg.sender, address(0), 0, msg.value, TransactionType.RevenueDistribution);

        emit RevenueDistributed(propertyId, msg.value);
    }

    // ─── User Management ─────────────────────────────────────────────────────────

    function verifyUser(address user) external onlyAdmin {
        verifiedUsers[user] = true;
        emit UserVerified(user);
    }

    function revokeUserVerification(address user) external onlyAdmin {
        verifiedUsers[user] = false;
    }

    function addAdmin(address admin) external onlyOwner {
        admins[admin] = true;
        emit AdminAdded(admin);
    }

    function removeAdmin(address admin) external onlyOwner {
        require(admin != owner(), "Cannot remove owner");
        admins[admin] = false;
        emit AdminRemoved(admin);
    }

    // ─── Platform Config ──────────────────────────────────────────────────────────

    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%");
        platformFeePercent = newFee;
        emit PlatformFeeUpdated(newFee);
    }

    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }

    function updatePropertyPrice(uint256 propertyId, uint256 newPrice)
        external
        onlyAdmin
        propertyExists(propertyId)
    {
        Property storage prop = properties[propertyId];
        prop.pricePerShare = newPrice;
        PropertyToken(prop.tokenContract).updatePricePerShare(newPrice);
    }

    // ─── View Functions ───────────────────────────────────────────────────────────

    function getProperty(uint256 propertyId) external view returns (Property memory) {
        return properties[propertyId];
    }

    function getOwnerProperties(address owner) external view returns (uint256[] memory) {
        return ownerProperties[owner];
    }

    function getInvestorTransactions(address investor) external view returns (uint256[] memory) {
        return investorTransactions[investor];
    }

    function getTransaction(uint256 txId) external view returns (Transaction memory) {
        return transactions[txId];
    }

    function getInvestorPortfolio(address investor) external view returns (
        uint256[] memory propertyIds,
        uint256[] memory shareBalances,
        uint256[] memory ownershipPercentages
    ) {
        uint256 count = 0;
        for (uint256 i = 1; i <= propertyCount; i++) {
            PropertyToken token = PropertyToken(properties[i].tokenContract);
            if (token.balanceOf(investor) > 0) {
                count++;
            }
        }

        propertyIds = new uint256[](count);
        shareBalances = new uint256[](count);
        ownershipPercentages = new uint256[](count);

        uint256 idx = 0;
        for (uint256 i = 1; i <= propertyCount; i++) {
            PropertyToken token = PropertyToken(properties[i].tokenContract);
            uint256 balance = token.balanceOf(investor);
            if (balance > 0) {
                propertyIds[idx] = i;
                shareBalances[idx] = balance;
                ownershipPercentages[idx] = token.getOwnershipPercentage(investor);
                idx++;
            }
        }
    }

    function getAllProperties() external view returns (Property[] memory) {
        Property[] memory allProperties = new Property[](propertyCount);
        for (uint256 i = 1; i <= propertyCount; i++) {
            allProperties[i - 1] = properties[i];
        }
        return allProperties;
    }

    function isUserVerified(address user) external view returns (bool) {
        return verifiedUsers[user];
    }

    // ─── Internal Functions ───────────────────────────────────────────────────────

    function _recordTransaction(
        uint256 propertyId,
        address from,
        address to,
        uint256 shares,
        uint256 amount,
        TransactionType txType
    ) internal {
        transactionCount++;
        transactions[transactionCount] = Transaction({
            id: transactionCount,
            propertyId: propertyId,
            from: from,
            to: to,
            shares: shares,
            amount: amount,
            txType: txType,
            timestamp: block.timestamp,
            txHash: blockhash(block.number - 1)
        });

        if (from != address(0)) investorTransactions[from].push(transactionCount);
        if (to != address(0)) investorTransactions[to].push(transactionCount);
    }

    receive() external payable {}
}
