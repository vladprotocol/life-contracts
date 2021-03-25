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
    mapping(uint256 => uint256) public hasClaimed;
    mapping(uint8 => address[] ) public owners;
    mapping(uint8 => address ) public lastOwner;

    uint256 public startBlockNumber;
    uint256 public endBlockNumber;
    uint256 public countBurnt;
    uint256 public tokenPerBurn;
    uint256 public currentDistributedSupply;
    uint256 public totalSupplyDistributed;
    string public baseURI;
    string public ipfsHash;
    mapping(uint8 => string) public nftIdURIs;
    uint8 public numberOfNftIds;

    bool allowMultipleClaims; // on marketplace bootstrap and not changeable anymore.

    event NftMint(address indexed to, uint256 indexed tokenId, uint8 indexed nftId, uint256 amount);
    event NftBurn(address indexed from, uint256 indexed tokenId);

    constructor(
        NFT _nft,
        IBEP20 _token,
        uint256 _totalSupplyDistributed,
        uint256 _tokenPerBurn,
        string memory _baseURI,
        string memory _ipfsHash,
        uint256 _endBlockNumber,
        bool _allowMultipleClaims
    ) public {
        nft = _nft;
        token = _token;
        totalSupplyDistributed = _totalSupplyDistributed;
        tokenPerBurn = _tokenPerBurn;
        baseURI = _baseURI;
        ipfsHash = _ipfsHash;
        endBlockNumber = _endBlockNumber;
        allowMultipleClaims = _allowMultipleClaims;
    }
    function getMinted() external view returns (uint8[] memory, uint256[] memory){
        uint256 length = minted.length;
        uint256[] memory mintedAmounts = new uint256[](length);
        for (uint256 index = 0; index < length; ++index) {
            uint256 amount = hasClaimed[index];
            mintedAmounts[index] = amount;
        }
        return (minted, mintedAmounts);
    }

    function mintNFT(uint8 _nftId) external {
        require(allowMultipleClaims == true || hasClaimed[_nftId] == 0, "Has claimed");
        require(currentDistributedSupply == 0 || currentDistributedSupply < totalSupplyDistributed, "Nothing left");
        require(startBlockNumber == 0 || block.number > startBlockNumber, "Too early");
        require(endBlockNumber == 0 || block.number < endBlockNumber, "Too late");

        if( hasClaimed[_nftId] == 0 ){
            minted.push(_nftId);
        }
        hasClaimed[_nftId] = hasClaimed[_nftId].add(1);
        lastOwner[_nftId] = msg.sender;

        uint256 total = owners[_nftId].length;
        owners[_nftId][total] = msg.sender;

        currentDistributedSupply = currentDistributedSupply.add(1);

        string memory tokenURI = string(abi.encodePacked(ipfsHash, "/", _nftId, ".json"));
        nftIdURIs[_nftId] = tokenURI;
        uint256 tokenId = nft.mint(address(msg.sender), tokenURI, _nftId);

        token.safeTransferFrom(address(msg.sender), address(this), tokenPerBurn);
        emit NftMint(msg.sender, tokenId, _nftId, hasClaimed[_nftId] );
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


}
