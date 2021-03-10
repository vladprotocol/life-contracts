/*
http://vlad.finance/
https://t.me/VladFinanceOfficial
https://vlad-finance.medium.com/
https://twitter.com/VladFinance
*/

// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VladToken is ERC20("VladToken", "VLAD"), Ownable {
    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }
}
