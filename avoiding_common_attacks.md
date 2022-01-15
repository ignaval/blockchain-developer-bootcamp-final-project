### Proper Use of Require, Assert and Revert
Throughout the contract, `require` is used to validate inputs and pre conditions.

### Use Modifiers Only for Validation
Two modifiers are used in this contrac `onlyOwner` and `whenNotPaused`. Both are used for validation only.

### Checks-Effects-Interactions and Re-entrancy (SWC-107)
To prevent re-entrancy attacks, the check-effects-interactions pattern is used. A clear example is the `withdrawAssets` function. Here, pre-conditions are checked with several `require` statements (vault exists, vault state, owner of the key, unlock time), then the state is modified to mark the vault as `State.Withdrawn`, and finally the assets are transfered to the key owner calling the function.

### Timestamp Dependence
The decision to check `block.timestamp` to validate the vault can be opened was made because this particular use case does not seem to be attractive for timestamp manipulation. Unlock times will probably be far in the future, making big timestamp differences between miners unlikely. Plus, only key holders can access a vault, regardless of `block.timestamp`.
