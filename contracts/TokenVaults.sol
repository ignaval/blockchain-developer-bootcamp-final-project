// SPDX-License-Identifier: MIT
// Author: valdi.eth
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/// @title Token Vaults with NFT keys
/// @author Ignacio Valdivieso
/// @notice ERC-20, ERC-721 and Ether vaults with NFT keys and withdrawal dates
/// @dev Using OpenZeppelin contracts for ERC-20 and ERC-721 contract interactions. Also using theis Ownable and Pausable contracts to safeguard assets in case of a bug detection
contract TokenVaults is ERC721, Pausable, Ownable, IERC721Receiver {
    using SafeERC20 for IERC20;
    
    /// @notice Vaults can either be created and locked, or withdrawn
    enum State { Created, Withdrawn }
    
    /// @notice Vault's assets and metadata
    struct Vault {
        // mapping (IERC20 => uint256) erc20Tokens;
		// mapping (IERC721 => uint256[]) erc721Tokens;
		
		IERC20[] erc20Tokens;
        uint256[] erc20TokensAmounts;
        IERC721[] erc721Tokens;
        uint256[][] erc721TokensIds;
        uint256 ethAmount;
        
        address creator;
		uint256 unlockTime;
		State state;
    }
    
    /// @dev Event emitted when a new vault is created
    event LogVaultCreated(Vault vault);

    /// @dev Event emitted when a vault is withdrawn by the key holder
    event LogVaultAssetsWithdrawn(Vault vault, uint256 withdrawalTime);
    
    mapping (uint256 => Vault) private vaults;
    uint256 _vaultsCount;
    mapping (address => uint256[]) private vaultsByCreator;
    mapping (address => uint256[]) private vaultsByBeneficiary;

    constructor() ERC721("TokenVaultToken", "TVT") {}

    /// @notice Pause the contract in case of a security issue
    /// @dev Uses OpenZeppelin's Pausable contract
    function pause() public onlyOwner {
        _pause();
    }

    /// @notice Unpause the contract in case security issue was resolved or no longer an issue
    /// @dev Uses OpenZeppelin's Pausable contract
    function unpause() public onlyOwner {
        _unpause();
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
		require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

		string memory baseURI = _baseURI();
		return bytes(baseURI).length > 0
			? string(abi.encodePacked(baseURI, tokenId))
			: '';
	}
	
	function _baseURI() internal pure override returns (string memory) {
		return "https://tokenvault.xyz/m/";
	}
    
    /// @dev Transfer assets to the contract, using OZs safeTransferFrom functions to verify before transfering
    /// @param caller The creator of the transaction
    /// @param erc20Tokens The contract addresses of all ERC-20 tokens to be included in the vault
    /// @param erc20TokensAmounts The amount of each ERC-20 token
    /// @param erc721Tokens The contract addresses of all ERC-721 tokens to be included in the vault
    /// @param erc721TokensIds The ids of tokens in the ERC-721 contracts to be included in the vault
    function claimAssets(
        address caller, 
        IERC20[] memory erc20Tokens,
        uint256[] memory erc20TokensAmounts,
        IERC721[] memory erc721Tokens,
        uint256[][] memory erc721TokensIds
    ) internal {
        for(uint i = 0; i < erc20Tokens.length; i++) {
            IERC20 token = erc20Tokens[i];
            uint256 tokenAmount = erc20TokensAmounts[i];
            token.safeTransferFrom(caller, address(this), tokenAmount);
        }
        
        for(uint i = 0; i < erc721Tokens.length; i++) {
            IERC721 token = erc721Tokens[i];
            uint256[] memory tokenIds = erc721TokensIds[i];
            for(uint j = 0; j < tokenIds.length; j++) {
                uint256 tokenId = tokenIds[j];
                token.safeTransferFrom(caller, address(this), tokenId);
            }
        }
    }

    function onERC721Received(address, address, uint256, bytes calldata) public pure override returns(bytes4) {
        return this.onERC721Received.selector;
    }
    
    /// @notice Create a vault with ERC-20, ERC-721 and / or Ether. Set a beneficiary and an unlock time.
    /// @dev Mint a new NFT key using OZ's ERC-721 contract
    /// @param erc20Tokens The contract addresses of all ERC-20 tokens to be included in the vault
    /// @param erc20TokensAmounts The amount of each ERC-20 token
    /// @param erc721Tokens The contract addresses of all ERC-721 tokens to be included in the vault
    /// @param erc721TokensIds The ids of tokens in the ERC-721 contracts to be included in the vault
    function createVault(
        IERC20[] memory erc20Tokens,
        uint256[] memory erc20TokensAmounts,
        IERC721[] memory erc721Tokens,
        uint256[][] memory erc721TokensIds,
        address beneficiary,
        uint256 unlockTime
    ) public payable whenNotPaused {
        require(unlockTime > block.timestamp, "Create Vault: unlock time is before current time");
        require(beneficiary != 0x0000000000000000000000000000000000000000, "Create Vault: beneficiary address cannot be 0x0");
        require(erc20Tokens.length == erc20TokensAmounts.length, "Create Vault: ERC20 tokens array length and token amounts array length mismatch");
        require(erc721Tokens.length == erc721TokensIds.length, "Create Vault: ERC721 tokens array length and token ids array length mismatch");
        
        claimAssets(msg.sender, erc20Tokens, erc20TokensAmounts, erc721Tokens, erc721TokensIds);

        Vault memory vault =  Vault({
            erc20Tokens: erc20Tokens,
            erc20TokensAmounts: erc20TokensAmounts,
            erc721Tokens: erc721Tokens,
            erc721TokensIds: erc721TokensIds,
            ethAmount: msg.value,
            creator: msg.sender,
            unlockTime: unlockTime,
            state: State.Created
        });
        vaults[_vaultsCount] = vault;
        vaultsByCreator[msg.sender].push(_vaultsCount);
        vaultsByBeneficiary[beneficiary].push(_vaultsCount);
        _safeMint(beneficiary, _vaultsCount);
        
        _vaultsCount = _vaultsCount + 1;
        
        emit LogVaultCreated(vault);
    }
    
    /// @notice Get all the information for a given vault
    /// @param vaultId The id of the vault to be examined
    /// @return All vault data: contents, creator, unlock time and state
    function vaultData(uint256 vaultId) public view returns (Vault memory) {
        require(vaultId < _vaultsCount, "Error: Non existent vault");
        return vaults[vaultId];
    }
    
    /// @notice Claim the vault's assets using this function. Only the key holder can call this function
    /// @dev Transfer assets to the key holder, using OZs safeTransfer functions
    /// @param vaultId The id of the vault to be withdrawn
    function withdrawAssets(uint256 vaultId) public whenNotPaused {
        require(vaultId < _vaultsCount, "Withdraw assets: Non existent vault");
        
        Vault storage vault = vaults[vaultId];
        
        require(vault.state == State.Created, "Withdraw assets: Vault already withdrawn");

        address beneficiary = ownerOf(vaultId);
        require(msg.sender == beneficiary, "Withdraw assets: sender does not possess the key to this vault");
        require(vault.unlockTime <= block.timestamp, "Withdraw assets: unlock time is after current time");
        
        vault.state = State.Withdrawn;

        for(uint i = 0; i < vault.erc20Tokens.length; i++) {
            IERC20 token = vault.erc20Tokens[i];
            uint256 tokenAmount = vault.erc20TokensAmounts[i];
            token.safeTransfer(beneficiary, tokenAmount);
        }
        
        for(uint i = 0; i < vault.erc721Tokens.length; i++) {
            IERC721 token = vault.erc721Tokens[i];
            uint256[] memory tokenIds = vault.erc721TokensIds[i];
            for(uint j = 0; j < tokenIds.length; j++) {
                uint256 tokenId = tokenIds[j];
                token.safeTransferFrom(address(this), beneficiary, tokenId);
            }
        }

        Address.sendValue(payable(beneficiary), vault.ethAmount);
        
        emit LogVaultAssetsWithdrawn(vault, block.timestamp);
    }
    
    /// @notice Get the amount of vaults created
    /// @return The amount of vaults created
    function vaultsCount() public view returns (uint256) {
        return _vaultsCount;
    }
}