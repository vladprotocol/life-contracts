const web3 = require('web3');
const {accounts, contract} = require('@openzeppelin/test-environment');
const {BN, expectRevert, time, expectEvent, constants} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const Token = contract.fromArtifact('LifeToken');
const NFT = contract.fromArtifact('NFT');
const NftFarm = contract.fromArtifact('NftFarm');
let _deployer, _user;
const mintAmount = '1';
const _name = 'Life';//
const _symbol = 'LIFE';
const baseURI = 'ipfs://';
const ipfsHash = 'QmWB5xPBcFRn8qR4uu1VHt1k9vUrxvbezYv3jDC7WD29ie';

const supply = web3.utils.toWei('6666');
const totalSupplyDistributed = '6666';
const price = '666';
const lifePerBurn = web3.utils.toWei(price);
const startBlock = 0;
const endBlockNumber = 0;
const allowMultipleClaims = true;
const rarity = "Common";

const maxMintPerNft = '666';
const priceMultiplier = '0';

describe('NftMinting', function () {
    beforeEach(async function () {
        _deployer = accounts[0];
        _user = accounts[1];

        this.Token = await Token.new({from: _deployer});
        this.Token.mint(_deployer, supply, {from: _deployer});
        this.NFT = await NFT.new(baseURI, {from: _deployer});


        this.NftFarm = await NftFarm.new(
            this.NFT.address,
            this.Token.address,
            totalSupplyDistributed,
            lifePerBurn,
            baseURI,
            ipfsHash,
            endBlockNumber,
            allowMultipleClaims,
            rarity,
            maxMintPerNft,
            priceMultiplier,
            {from: _deployer});

        await this.NFT.manageMinters(this.NftFarm.address, true, {from: _deployer});

    });

    describe('mintNFT', function () {

        it('MUST HAVE TOKEN', async function () {
            const nftId = 0;
            const price = await this.NftFarm.getPrice(nftId, {from: _user});
            await expectRevert(this.NftFarm.mintNFT(nftId, {from: _user}), 'transfer amount exceeds balance');
        });
        it('MUST MINT WITH BALANCE', async function () {
            const balance = await this.Token.balanceOf(_deployer);
            expect(balance).to.be.bignumber.equal(supply);
            await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

            const nftId = 0;
            await this.NftFarm.mintNFT(0, {from: _deployer});
            const ownersOf = await this.NftFarm.getOwnersOf(nftId, {from: _deployer});
            expect(ownersOf[0]).to.be.equal(_deployer);

            const getClaimedAmount = await this.NftFarm.getClaimedAmount(nftId, {from: _deployer});
            expect(getClaimedAmount.toString()).to.be.equal('1');

            const getMinted = await this.NftFarm.getMinted({from: _deployer});

            // nftId 0 at index 0
            expect(getMinted[0][0].toString()).to.be.equal('0');

            // nftId 0 amount minted at index 1
            expect(getMinted[1][0].toString()).to.be.equal('1');

            // nftId 0 last owner at index 2
            expect(getMinted[2][0].toString()).to.be.equal(_deployer);

        });
    });

    describe('mintNFT', function () {
        it('MUST HAVE TOKEN', async function () {
            await expectRevert(this.NftFarm.mintNFT(0, {from: _user}), 'transfer amount exceeds balance');
        });
        it('MUST MINT 1 NFT WITH BALANCE', async function () {
            const balance = await this.Token.balanceOf(_deployer);
            expect(balance).to.be.bignumber.equal(supply);
            await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

            const nftId = 0;
            await this.NftFarm.mintNFT(0, {from: _deployer});
            const ownersOf = await this.NftFarm.getOwnersOf(nftId, {from: _deployer});
            expect(ownersOf[0]).to.be.equal(_deployer);

            const getClaimedAmount = await this.NftFarm.getClaimedAmount(nftId, {from: _deployer});
            expect(getClaimedAmount.toString()).to.be.equal('1');

            const getMinted = await this.NftFarm.getMinted({from: _deployer});

            // nftId 0 at index 0
            expect(getMinted[0][0].toString()).to.be.equal('0');

            // nftId 0 amount minted at index 1
            expect(getMinted[1][0].toString()).to.be.equal('1');

            // nftId 0 last owner at index 2
            expect(getMinted[2][0].toString()).to.be.equal(_deployer);

        });

        it('Get NFT metadata', async function () {
            const balance = await this.Token.balanceOf(_deployer);
            expect(balance).to.be.bignumber.equal(supply);
            await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

            const nftId = 0;
            await this.NftFarm.mintNFT(nftId, {from: _deployer});
            await this.NftFarm.mintNFT(nftId, {from: _deployer});
            const tokenId = await this.NFT.getNftId(nftId, {from: _deployer});
            const getNftName = await this.NFT.getNftName(tokenId, {from: _deployer});
            const getNftNameOfTokenId = await this.NFT.getNftNameOfTokenId(tokenId, {from: _deployer});
            expect(getNftName).to.be.equal("Common");
            expect(getNftNameOfTokenId).to.be.equal("Common");

            const balanceOf = await this.NFT.balanceOf(_deployer, {from: _deployer});
            const ownerOf = await this.NFT.ownerOf(tokenId, {from: _deployer});
            expect(balanceOf.toString()).to.be.equal("2");
            expect(ownerOf).to.be.equal(_deployer);

            const tokenURI = await this.NFT.tokenURI(tokenId, {from: _deployer});
            expect(tokenURI).to.be.equal(baseURI + ipfsHash + '/0.json');

        });

        it('TEST NFT URI', async function () {
            const balance = await this.Token.balanceOf(_deployer);
            expect(balance).to.be.bignumber.equal(supply);
            await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

            await this.NftFarm.mintNFT(0, {from: _deployer});
            await this.NftFarm.mintNFT(1, {from: _deployer});
            await this.NftFarm.mintNFT(2, {from: _deployer});

            const tokenId0 = await this.NFT.getNftId(0, {from: _deployer});
            const tokenURI0 = await this.NFT.tokenURI(tokenId0, {from: _deployer});
            expect(tokenURI0).to.be.equal(baseURI + ipfsHash + '/0.json');

            const tokenId1 = await this.NFT.getNftId(1, {from: _deployer});
            const tokenURI1 = await this.NFT.tokenURI(tokenId1, {from: _deployer});
            expect(tokenURI1).to.be.equal(baseURI + ipfsHash + '/1.json');

            const tokenId2 = await this.NFT.getNftId(2, {from: _deployer});
            const tokenURI2 = await this.NFT.tokenURI(tokenId2, {from: _deployer});
            expect(tokenURI2).to.be.equal(baseURI + ipfsHash + '/2.json');

        });

        it('TEST DEFAULT PRICE', async function () {
            const nftId = 0;
            const getPrice = await this.NftFarm.getPrice(nftId, {from: _user});
            expect(getPrice).to.be.bignumber.equal(lifePerBurn);
        });
        it('TEST PRICE BY NFT', async function () {
            const nftId = 0;
            const newPrice = web3.utils.toWei('1000');
            await this.NftFarm.adminSetPriceByNftId(nftId, newPrice, {from: _deployer});
            const getPrice = await this.NftFarm.getPrice(nftId, {from: _user});
            expect(getPrice).to.be.bignumber.equal(newPrice);
        });

        it('TEST PRICE MULTIPLIER', async function () {
            const nftId = 0;
            const multiplier = 2;
            await this.NftFarm.adminSetMultiplier(multiplier, {from: _deployer});
            const getPrice = await this.NftFarm.getPrice(nftId, {from: _user});

            await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});
            await this.NftFarm.mintNFT(nftId, {from: _deployer});
            const getPrice1 = await this.NftFarm.getPrice(nftId, {from: _user});
            const total = web3.utils.toWei('1332'); // 666*1*2
            expect(getPrice1).to.be.bignumber.equal(total);
        });


    });


    describe('NFT MINTING LIMITS', function () {
        it('TEST allowMultipleClaims', async function () {
            const nftId = 0;

            await this.NftFarm.adminSetAllowMultipleClaims(true, {from: _deployer});

            await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

            await this.NftFarm.mintNFT(nftId, {from: _deployer});
            await this.NftFarm.mintNFT(nftId, {from: _deployer});

            await this.NftFarm.adminSetAllowMultipleClaims(false, {from: _deployer});

            await expectRevert(this.NftFarm.mintNFT(nftId, {from: _deployer}), "Has claimed");
        });
        it('TEST maxMintPerNft=3', async function () {
            const nftId = 0;

            await this.NftFarm.adminSetMaxMintPerNft(3, {from: _deployer});

            await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

            await this.NftFarm.mintNFT(nftId, {from: _deployer});
            await this.NftFarm.mintNFT(nftId, {from: _deployer});
            await this.NftFarm.mintNFT(nftId, {from: _deployer});
            const getClaimedAmount = await this.NftFarm.getClaimedAmount(nftId, {from: _deployer});
            expect(getClaimedAmount.toString()).to.be.bignumber.equal('3');

            await expectRevert(this.NftFarm.mintNFT(nftId, {from: _deployer}), "Max minting reached");
        });
        it('TEST mint_by_nftId[_nftId]=3', async function () {
            const nftId = 0;

            await this.NftFarm.adminSetMaxMintByNftId(nftId, 3, {from: _deployer});

            await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

            await this.NftFarm.mintNFT(nftId, {from: _deployer});
            await this.NftFarm.mintNFT(nftId, {from: _deployer});
            await this.NftFarm.mintNFT(nftId, {from: _deployer});
            const getClaimedAmount = await this.NftFarm.getClaimedAmount(nftId, {from: _deployer});
            expect(getClaimedAmount.toString()).to.be.bignumber.equal('3');

            await expectRevert(this.NftFarm.mintNFT(nftId, {from: _deployer}), "Max minting by NFT reached");
        });
        it('TEST totalSupplyDistributed=3', async function () {
            const nftId = 0;

            await this.NftFarm.adminSetTotalSupply(3, {from: _deployer});

            await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

            await this.NftFarm.mintNFT(0, {from: _deployer});
            await this.NftFarm.mintNFT(1, {from: _deployer});
            await this.NftFarm.mintNFT(2, {from: _deployer});

            await expectRevert(this.NftFarm.mintNFT(3, {from: _deployer}), "Nothing left");

            const total = await this.NftFarm.currentDistributedSupply({from: _deployer});
            expect(total.toString()).to.be.bignumber.equal('3');

        });
    });


    describe('ADMIN SECURITY TESTS', function () {
        it('adminSetInterval', async function () {
            await expectRevert(this.NftFarm.adminSetInterval(0, 0, {from: _user}), 'Ownable: caller is not the owner');
            await this.NftFarm.adminSetInterval(0, 0, {from: _deployer});
        });
        it('adminChangeToken', async function () {
            await expectRevert(this.NftFarm.adminChangeToken(this.Token.address, {from: _user}), 'Ownable: caller is not the owner');
            await this.NftFarm.adminChangeToken(this.Token.address, {from: _deployer});
        });
        it('adminSetTotalSupply', async function () {
            await expectRevert(this.NftFarm.adminSetTotalSupply(totalSupplyDistributed, {from: _user}), 'Ownable: caller is not the owner');
            await this.NftFarm.adminSetTotalSupply(totalSupplyDistributed, {from: _deployer});
        });
        it('adminSetTokenPerBurn', async function () {
            const tokenPerBurn = web3.utils.toWei('6');
            await expectRevert(this.NftFarm.adminSetTokenPerBurn(tokenPerBurn, {from: _user}), 'Ownable: caller is not the owner');
            await this.NftFarm.adminSetTokenPerBurn(tokenPerBurn, {from: _deployer});
        });
        it('adminSetBaseURI', async function () {
            const baseURI = 'ipfs://';
            await expectRevert(this.NftFarm.adminSetBaseURI(baseURI, {from: _user}), 'Ownable: caller is not the owner');
            const owner = await this.NftFarm.owner();
            await this.NftFarm.adminSetBaseURI(baseURI, {from: _deployer});
        });
    });

});
