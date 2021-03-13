const TOKEN = artifacts.require("LifeToken");
const BunnyMintingFarm = artifacts.require("BunnyMintingFarm");
module.exports = async function (deployer, network, accounts) {
    const TOKEN_DEPLOYED = await TOKEN.deployed();
    const cakeToken = TOKEN_DEPLOYED.address;
    const totalSupplyDistributed = '7404';
    const cakePerBurn = web3.utils.toWei('1');
    const baseURI = 'ipfs://';
    const ipfsHash = 'QmXdHqg3nywpNJWDevJQPtkz93vpfoHcZWQovFz2nmtPf5/';
    const block_latest = await web3.eth.getBlock("latest");
    let startBlock = block_latest.number;

    if( network == 'testnet' ){
        // startBlock = 4360007;
    }
    if( network == 'dev' ){
        _startBlock = 1;
    }
    const endBlockNumber =  startBlock + (28800*30);

    await deployer.deploy(BunnyMintingFarm,
        cakeToken, totalSupplyDistributed, cakePerBurn,
        baseURI, ipfsHash, endBlockNumber);

};
