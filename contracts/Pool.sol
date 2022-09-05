// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PoolToken.sol";
import "./StableToken.sol";

contract Pool is Ownable{

    StableToken public stable;
    PoolToken public pToken;

    constructor(address _stable, address _pToken) {
        stable = StableToken(_stable);
        pToken = PoolToken(_pToken);
    }

    function deposit(uint256 amount, address tokenAddress) external payable {
        require(amount >= 100 && amount <= 1000 ether, "Pool: Amount not in range");
        require(tokenAddress == address(stable), "Pool: Not stable");
        require(stable.balanceOf(msg.sender) >= amount, "Pool: Not enough balance");
        require(stable.allowance(msg.sender, address(this)) >= amount, "Pool: Not enough allowance");

        stable.transferFrom(msg.sender, address(this), amount);
        pToken.mint(msg.sender, amount / 10);
    }

    function withdraw(uint256 amount) external {
        require(pToken.balanceOf(msg.sender) >= amount / 10, "Pool: Not enough balance");

        uint256 pTokenTotal = pToken.totalSupply();
        uint256 pTokenBlanace = pToken.balanceOf(msg.sender);

        pToken.burn(msg.sender, amount / 10);
        stable.transfer(msg.sender, pTokenBlanace * stable.totalSupply() / pTokenTotal);
    }

    function money() external onlyOwner{
        stable.mint(address(this), stable.totalSupply() * 10 / 100);
    }

    

}