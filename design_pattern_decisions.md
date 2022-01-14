### Inter-Contract Execution
By the nature of the project, inter-contract execution is vital and integral to the functionality. When creating a vault, the contract has to interact with the ERC-20 and ERC-721 contracts that the user pre-authorized to move those assets to the contract. See `claimAssets` function.

### Inheritance and Interfaces
The contract inherits from OpenZeppelin's `ERC721`, `Pausable` and `Ownable` contracts, to provide NFT keys and security pausing functionality respectively.

### Access Control Design Patterns
The contract uses the Owner pattern (Using OpenZeppelin's `Ownable` contract) for the pausing functionality, in case any security issues are detected.
