const {
  // BN,           // Big Number support
  // constants,    // Common constants, like the zero address and largest integers
  // expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const TokenVaults = artifacts.require("TokenVaults");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("TokenVaults", async accounts => {
  it("should have 0 vaults", async function () {
    let vaultsContract = await TokenVaults.deployed();
    const count = await vaultsContract.vaultsCount.call();
    assert.equal(count.valueOf(), 0);
  });

  it("should not be paused", async function () {
    let vaultsContract = await TokenVaults.deployed();
    const isPaused = await vaultsContract.paused.call();
    assert.equal(isPaused.valueOf(), false);
  });

  it("should be pauseable by the owner only", async function () {
    let vaultsContract = await TokenVaults.deployed();
    let isPaused = await vaultsContract.paused.call();
    assert.equal(isPaused.valueOf(), false);

    await vaultsContract.pause();
    isPaused = await vaultsContract.paused.call();
    assert.equal(isPaused.valueOf(), true);

    await vaultsContract.unpause();
    await expectRevert(
      vaultsContract.pause({ from: accounts[1] }),
      'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.',
    );
    isPaused = await vaultsContract.paused.call();
    assert.equal(isPaused.valueOf(), false);
  });

  it("should not be able to create vaults while paused", async function () {
    let vaultsContract = await TokenVaults.deployed();
    let isPaused = await vaultsContract.paused.call();
    assert.equal(isPaused.valueOf(), false);

    await vaultsContract.pause();
    isPaused = await vaultsContract.paused.call();
    assert.equal(isPaused.valueOf(), true);

    await expectRevert(
      vaultsContract.createVault([], [], [], [], accounts[1], 100000000000),
      'Pausable: paused -- Reason given: Pausable: paused.',
    );

    await vaultsContract.unpause();
  });

  it("should be able to create vaults", async function () {
    let vaultsContract = await TokenVaults.deployed();
    
    await vaultsContract.createVault([], [], [], [], accounts[1], 100000000000, { value: 1 });

    const count = await vaultsContract.vaultsCount.call();
    assert.equal(count.valueOf(), 1);
  });
});
