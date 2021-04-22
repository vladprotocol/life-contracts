const TOKEN = artifacts.require("VLAD");
module.exports = async function (deployer, network, accounts) {
    await deployer.deploy(TOKEN);
    const TOKEN_DEPLOYED = await TOKEN.deployed();
    console.log('TOKEN', TOKEN_DEPLOYED.address);
};
