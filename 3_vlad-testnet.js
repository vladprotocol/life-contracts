const TOKEN = artifacts.require("VladToken");
module.exports = async function (deployer, network, accounts) {
    const devaddr = accounts[0];
    const mint = web3.utils.toWei('100');
    await deployer.deploy(TOKEN);
    const TOKEN_DEPLOYED = await TOKEN.deployed();
    console.log('TOKEN', TOKEN_DEPLOYED.address);
    await TOKEN_DEPLOYED.mint(devaddr, mint);
};
