var TokenVaults = artifacts.require("./TokenVaults.sol");
var ERC721TokenA = artifacts.require("./ERC721TokenA.sol");
var ERC721TokenB = artifacts.require("./ERC721TokenB.sol");
var ERC20TokenA = artifacts.require("./ERC20TokenA.sol");
var ERC20TokenB = artifacts.require("./ERC20TokenB.sol");

module.exports = function(deployer) {
  deployer.deploy(TokenVaults);
  deployer.deploy(ERC721TokenA);
  deployer.deploy(ERC721TokenB);
  deployer.deploy(ERC20TokenA);
  deployer.deploy(ERC20TokenB);
};