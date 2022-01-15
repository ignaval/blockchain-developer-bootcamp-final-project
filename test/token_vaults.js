const {expectRevert} = require('@openzeppelin/test-helpers');

const TokenVaults = artifacts.require("TokenVaults");

contract("TokenVaults", async accounts => {
  // Sanity check
  it("should have 0 vaults", async function () {
    let vaultsContract = await TokenVaults.deployed();
    const count = await vaultsContract.vaultsCount.call();
    assert.equal(count.valueOf(), 0);
  });

  // Sanity check
  it("should not be paused", async function () {
    let vaultsContract = await TokenVaults.deployed();
    const isPaused = await vaultsContract.paused.call();
    assert.equal(isPaused.valueOf(), false);
  });

  // Testing Inheritance
  it("should be pauseable by the owner only", async function () {
    let vaultsContract = await TokenVaults.deployed();
    let isPaused = await vaultsContract.paused.call();
    // Should start unpaused
    assert.equal(isPaused.valueOf(), false);

    await vaultsContract.pause();
    isPaused = await vaultsContract.paused.call();
    // Should have been paused by owner
    assert.equal(isPaused.valueOf(), true);

    await vaultsContract.unpause();
    // Non owner should not be able to pause
    await expectRevert(
      vaultsContract.pause({ from: accounts[1] }),
      'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.',
    );
    isPaused = await vaultsContract.paused.call();
    assert.equal(isPaused.valueOf(), false);
  });

  // Testing inherited modifier (whenNotPaused)
  it("should not be able to create vaults while paused", async function () {
    let vaultsContract = await TokenVaults.deployed();
    let isPaused = await vaultsContract.paused.call();
    // Should start unpaused
    assert.equal(isPaused.valueOf(), false);

    await vaultsContract.pause();
    isPaused = await vaultsContract.paused.call();
    // Should have been paused by owner
    assert.equal(isPaused.valueOf(), true);

    // Should not be able to create a vault while paused
    await expectRevert(
      vaultsContract.createVault([], [], [], [], accounts[1], 100000000000),
      'Pausable: paused -- Reason given: Pausable: paused.',
    );

    // Cleanup
    await vaultsContract.unpause();
  });

  // Testing main functionality: create vaults
  it("should be able to create vaults", async function () {
    let vaultsContract = await TokenVaults.deployed();

    const block = await web3.eth.getBlock('latest');
    const timestamp = block.timestamp;
    
    // Create 3 vaults for 3 differents accounts: vault 0 for account 1, vault 1 for account 2, vault 2 for account 3
    await vaultsContract.createVault([], [], [], [], accounts[1], timestamp + 10, { value: web3.utils.toWei('1', 'ether') });
    await vaultsContract.createVault([], [], [], [], accounts[2], timestamp + 10, { value: web3.utils.toWei('2', 'ether') });
    await vaultsContract.createVault([], [], [], [], accounts[3], timestamp + 50, { value: web3.utils.toWei('3', 'ether') });

    const count = await vaultsContract.vaultsCount.call();
    // Assert 3 vaults were created
    assert.equal(count.valueOf(), 3);
  });

  // Testing main functionality: withdraw assets
  it("should release vault contents to the key owner", async function () {
    let vaultsContract = await TokenVaults.deployed();

    const acc1BalanceBefore = await web3.eth.getBalance(accounts[1]);
    // Advance time to be able to unlock vault
    await advanceTime(10);
    
    // Withdraw assets from vault 0
    await vaultsContract.withdrawAssets(0, { from: accounts[1] });

    const acc1Balance = await web3.eth.getBalance(accounts[1]);
    // Assert value was transfered
    assert.isAbove(parseInt(acc1Balance), parseInt(acc1BalanceBefore));
  });

  // Testing main functionality: withdraw assets
  it("should not release vault contents to accounts that don't hold the key", async function () {
    let vaultsContract = await TokenVaults.deployed();

    const acc2BalanceBefore = await web3.eth.getBalance(accounts[2]);
    
    // Withdraw assets from vault 2 should not be possible, as account 2 only can unlock vault 1
    await expectRevert(
      vaultsContract.withdrawAssets(2, { from: accounts[2] }),
      'Withdraw assets: sender does not possess the key to this vault.',
    );

    const acc2Balance = await web3.eth.getBalance(accounts[2]);
    // Assert value was not transfered (gas used)
    assert.isBelow(parseInt(acc2Balance), parseInt(acc2BalanceBefore));
  });

  // Testing main functionality: withdraw assets
  it("should not release vault contents to key holder if time is lower than unlock time", async function () {
    let vaultsContract = await TokenVaults.deployed();

    const acc3BalanceBefore = await web3.eth.getBalance(accounts[3]);
    
    // Withdraw assets from vault 2 should not be possible, as unlock time is greater than current time
    await expectRevert(
      vaultsContract.withdrawAssets(2, { from: accounts[3] }),
      'Withdraw assets: unlock time is after current time.',
    );

    const acc3Balance = await web3.eth.getBalance(accounts[3]);
    // Assert value was not transfered (gas used)
    assert.isBelow(parseInt(acc3Balance), parseInt(acc3BalanceBefore));
  });
});

async function advanceTime(advance) {
  let block = await web3.eth.getBlock('latest');

  await web3.currentProvider.send(
    {
      jsonrpc: "2.0",
      method: "evm_mine",
      params: [block.timestamp + advance],
      id: new Date().getTime(),
    },
    (err, _) => {
      if (err) {
        console.log(err);
      }
    }
  );
}