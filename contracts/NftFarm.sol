// SPDX-License-Identifier: UNLICENSED
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./NFT.sol";
import "./libs/IBEP20.sol";
import "./libs/SafeBEP20.sol";

pragma solidity ^0.6.12;

contract NftFarm is Ownable {
    using SafeMath for uint8;
    using SafeMath for uint256;

    using SafeBEP20 for IBEP20;

    NFT public nft;
    IBEP20 public token;

    uint8[] public minted;
    mapping(uint8 => uint256) public hasClaimed;
    mapping(uint8 => address[] ) public ownersOf;
    mapping(uint8 => address ) public lastOwners;

    uint256 public startBlockNumber;
    uint256 public endBlockNumber;
    uint256 public countBurnt;
    uint256 public tokenPerBurn;
    uint256 public currentDistributedSupply; // test ok
    uint256 public totalSupplyDistributed; // test ok
    string public baseURI;
    string public ipfsHash;
    string public rarity;
    mapping(uint8 => string) public nftIdURIs; // test ok
    uint8 public numberOfNftIds;

    // on marketplace bootstrap and not changeable anymore.
    bool public allowMultipleClaims; // test ok

    // price management
    mapping(uint8 => uint256) public price_by_nftId; // test ok

    // for multipe minting
    uint256 public priceMultiplier; // test ok

    // minting and management

    // can manage price and limits
    mapping(address => bool) public mintingManager;
    mapping(uint8 => uint256) public mint_by_nftId; // test ok

    // set the max minting per nft
    uint256 public maxMintPerNft; // test ok

    event NftMint(address indexed to, uint256 indexed tokenId, uint8 indexed nftId, uint256 amount, uint256 price);
    event NftBurn(address indexed from, uint256 indexed tokenId);

    constructor(
        NFT _nft,
        IBEP20 _token,
        uint256 _totalSupplyDistributed,
        uint256 _tokenPerBurn,
        string memory _baseURI,
        string memory _ipfsHash,
        uint256 _endBlockNumber,
        bool _allowMultipleClaims,
        string memory _rarity,
        uint256 _maxMintPerNft,
        uint256 _priceMultiplier
    ) public {
        nft = _nft;
        token = _token;
        totalSupplyDistributed = _totalSupplyDistributed;
        tokenPerBurn = _tokenPerBurn;
        baseURI = _baseURI;
        ipfsHash = _ipfsHash;
        endBlockNumber = _endBlockNumber;
        allowMultipleClaims = _allowMultipleClaims;
        rarity = _rarity;
        maxMintPerNft = _maxMintPerNft;
        mintingManager[msg.sender] = true;
        priceMultiplier = _priceMultiplier;
    }

    function getOwnersOf( uint8 _nftId ) external view returns (address[] memory){
        return ownersOf[_nftId];
    }
    function getClaimedAmount( uint8 _nftId ) external view returns (uint256){
        return hasClaimed[_nftId];
    }

    function getMinted() external view returns
    (uint8[] memory, uint256[] memory, address[] memory, uint256[] memory, uint256[] memory){
        uint256 length = minted.length;
        uint256[] memory mintedAmounts = new uint256[](length);
        address[] memory lastOwner = new address[](length);
        uint256[] memory maxMintByNft = new uint256[](length);
        uint256[] memory prices = new uint256[](length);
        for (uint256 index = 0; index < length; ++index) {
            uint8 nftId = minted[index];
            lastOwner[index] = lastOwners[nftId];
            maxMintByNft[index] = getMaxMint(nftId);
            prices[index] = getPrice(nftId);
            mintedAmounts[index] = hasClaimed[nftId];
        }
        return (minted, mintedAmounts, lastOwner, maxMintByNft, prices);
    }
    function getMaxMint( uint8 _nftId ) public view returns (uint256) {
        if( mint_by_nftId[_nftId] == 0 ){
            return maxMintPerNft;
        }
        return mint_by_nftId[_nftId];
    }
    function mintNFT(uint8 _nftId) external {

        require(allowMultipleClaims == true || hasClaimed[_nftId] == 0, "Has claimed");

        require(startBlockNumber == 0 || block.number > startBlockNumber, "Too early");
        require(endBlockNumber == 0 || block.number < endBlockNumber, "Too late");

        // here we control collections
        require(totalSupplyDistributed == 0 || currentDistributedSupply < totalSupplyDistributed, "Nothing left");
        currentDistributedSupply = currentDistributedSupply.add(1);

        if( hasClaimed[_nftId] == 0 ){
            minted.push(_nftId);
            nft.setNftName(_nftId, rarity);
        }

        hasClaimed[_nftId] = hasClaimed[_nftId].add(1);
        lastOwners[_nftId] = msg.sender;

        if( mint_by_nftId[_nftId] == 0 ){
            require( maxMintPerNft==0 || hasClaimed[_nftId] <= maxMintPerNft, "Max minting reached");
        }else{
            require( hasClaimed[_nftId] <= mint_by_nftId[_nftId],
                "Max minting by NFT reached");
        }

        address[] storage _ownersOf = ownersOf[_nftId];
        _ownersOf.push( msg.sender );



        string memory tokenURI = string(abi.encodePacked(ipfsHash, "/", itod(_nftId), ".json"));
        nftIdURIs[_nftId] = tokenURI;
        uint256 tokenId = nft.mint(address(msg.sender), tokenURI, _nftId);

        uint256 price = getPrice(_nftId);
        token.safeTransferFrom(address(msg.sender), address(this), price);
        emit NftMint(msg.sender, tokenId, _nftId, hasClaimed[_nftId], price );
    }

    function adminSetInterval(uint256 _start, uint256 _end) external onlyOwner {
        startBlockNumber = _start;
        endBlockNumber = _end;
    }

    function adminWithdrawToken(uint256 _amount) external onlyOwner {
        // only after the marketplace is closed
        require(endBlockNumber == 0 || block.number > endBlockNumber, "Marketplace is open.");
        // comes from bunny: allow token withdraw? need to discus with team.
        token.safeTransfer(address(msg.sender), _amount);
    }

    function adminChangeToken(address _token) external onlyOwner {
        require(_token != address(0x0), "invalid address");
        token = IBEP20(_token);
    }

    function adminSetTotalSupply(uint256 _totalSupplyDistributed) external onlyOwner {
        totalSupplyDistributed = _totalSupplyDistributed;
    }

    function adminSetTokenPerBurn(uint256 _tokenPerBurn) external onlyOwner {
        tokenPerBurn = _tokenPerBurn;
    }

    function adminSetBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
        nft.changeBaseURI(_baseURI);
    }

    function itod(uint256 x) private pure returns (string memory) {
        if (x > 0) {
            string memory str;
            while (x > 0) {
                str = string(abi.encodePacked(uint8(x % 10 + 48), str));
                x /= 10;
            }
            return str;
        }
        return "0";
    }


    function getPrice( uint8 _nftId ) public view returns (uint256){

        // default: return the global price
        uint256 price = tokenPerBurn;

        // check if we have a price for this nft
        if( price_by_nftId[_nftId] > 0 ){
            price = price_by_nftId[_nftId];
        }

        // do we have a price multipler for multiple mintings?
        if( priceMultiplier > 0 && hasClaimed[_nftId] > 0 ){
            uint256 mintedAmount = hasClaimed[_nftId];
            price = price.mul(mintedAmount).mul(priceMultiplier);
        }

        return price;
    }

    // set the price for a specific nft
    function adminSetPriceByNftId(uint8 _nftId, uint256 _price) external mintingManagers {
        price_by_nftId[_nftId] = _price;
    }

    // set the max minting for a specific nft
    function adminSetMaxMintByNftId(uint8 _nftId, uint256 _maxAllowed) external mintingManagers {
        mint_by_nftId[_nftId] = _maxAllowed;
    }

    // manage nft emission
    function adminSetMintingManager(address _manager, bool _status) external onlyOwner {
        mintingManager[_manager] = _status;
    }

    // manage the price multiplier by mint
    function adminSetMultiplier(uint256 _priceMultiplier) external onlyOwner {
        priceMultiplier = _priceMultiplier;
    }

    // manage the price multiplier by mint
    function adminSetAllowMultipleClaims(bool _status) external onlyOwner {
        allowMultipleClaims = _status;
    }

    // manage the price multiplier by mint
    function adminSetMaxMintPerNft(uint256 _max) external onlyOwner {
        maxMintPerNft = _max;
    }

    modifier mintingManagers(){
        require(mintingManager[_msgSender()] == true, "Managers: not a manager");
        _;
    }
}
