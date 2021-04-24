const web3 = require('web3');
const {accounts, contract} = require('@openzeppelin/test-environment');
const {BN, expectRevert, time, expectEvent, constants} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const Token = contract.fromArtifact('LifeToken');
const SmartChef = contract.fromArtifact('SmartChef');
let _deployer;

describe('SmartChef', function () {
    beforeEach(async function () {
        _deployer = accounts[0];
        this.token = await Token.new({from: _deployer});
        this.lp = await Token.new({from: _deployer});
        const deposit = web3.utils.toWei('1000');


        await this.lp.mint(_deployer, deposit, {from: _deployer});

        const _rewardPerBlock = web3.utils.toWei('0.002480159');
        const _startBlock = 1;
        const _bonusEndBlock = _startBlock + 3600;

        this.pool = await SmartChef.new(
            this.lp.address, this.token.address, _rewardPerBlock, _startBlock, _bonusEndBlock,
            {from: _deployer});

        await this.token.mint(this.pool.address, deposit, {from: _deployer});

    });

    describe('SmartChef', function(){
        it('DEPOSIT', async function(){
            const amount = web3.utils.toWei('100');
            // const v = await this.lp.balanceOf(_deployer, {from: _deployer});
            await this.lp.approve(this.pool.address, amount, {from: _deployer});
            await this.pool.deposit(amount, {from: _deployer});
            time.advanceBlock();
            // const pendingReward = await this.pool.pendingReward(_deployer, {from: _deployer});
        });
        it('WITHDRAW', async function(){
            const amount = web3.utils.toWei('100');
            await this.lp.approve(this.pool.address, amount, {from: _deployer});
            await this.pool.deposit(amount, {from: _deployer});
            time.advanceBlock();
            await this.pool.withdraw(amount, {from: _deployer});

            const balanceOfLp = await this.lp.balanceOf(_deployer, {from: _deployer});
            const balanceOfReward = await this.token.balanceOf(_deployer, {from: _deployer});
            // console.log('balanceOfLp', balanceOfLp.toString() );
            // console.log('balanceOfReward', balanceOfReward.toString() );

            expect( web3.utils.fromWei(balanceOfLp,'ether') ).to.be.equal( '1000' );
            expect( web3.utils.fromWei(balanceOfReward,'ether') ).to.be.equal( '0.004960318' );


        });
    });


});
