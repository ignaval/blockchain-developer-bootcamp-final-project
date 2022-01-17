# Token time vault
## Consensys Academy blockchain developer bootcamp final project

ERC-20, ERC-721 and Ether vaults, that can only be accessed by the key owner, at a later date. The creator stores the assets, sets a beneficiary and the unlock date. The beneficiary gets an NFT representig a key to the vault. The assets are displayed in a vault page, with a countdown to the unlock date. The assets can be accessed by the owner of the NFT key at the unlock date or later.

### Functionality

- Create vault
    - Set token contract addresses, token ids and token amounts
    - Set beneficiary and unlock time
    - Mint NFT key for the beneficiary
- Read stored assets, unlock time and beneficiary
- Withdraw assets (key holder only)

### URL

Project accessible at https://tokenvaults.web.app/

### Directory structure

- contracts: Contains Solidity contracts used for testing and the main contract: TokenVaults.sol.
- migrations: Truffle migrations for testing locally and deployment.
- node_modules: Project dependencies, mainly Open Zeppelin contracts.
- public: Simple web site for contract interaction. Uses Bootstrap CSS.
- test: Smart contract unit tests.

### Installing dependencies

Run `npm install`.

### Running tests

Run `truffle test`.

### Running the project locally

Run `firebase emulators:start`, or just host `public.index.html` in a local server.
The project is already using the deployed version of the smart contract on Rinkeby (at 0xeE48262492F20DF1CE5227fFc4677A8312a2d52d).
No Infura (or similar) credentials needed, just have MetaMask installed when accessing index.html.

### Ethereum account for NFT certificate

0x92a6F975CBb957677E44877008b4F85094350810
