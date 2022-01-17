const $ = function( id ) { return document.getElementById( id ); }

let web3 = new Web3(Web3.givenProvider)
let walletAddress
let inCorrectNetwork = false

const mintingToast = new bootstrap.Toast($("mintingToast"))
const mintingDoneToast = new bootstrap.Toast($("mintingDoneToast"))

const contractAddress = '0xeE48262492F20DF1CE5227fFc4677A8312a2d52d'
let vaultsContract = new web3.eth.Contract(TokenVaultsRinkebyABI, contractAddress, {})

if (window.ethereum) {
	web3.eth.getChainId()
	.then((chainId) => {
		updateUIForNetwork(chainId)
	})
} else {
	updateUIForNoWallet()
}

window.ethereum.on('accountsChanged', function (accounts) {
	if (accounts.length > 0) {
		useAddress(accounts[0])
	} else {
		updateUIForNoWallet()
	}
})

window.ethereum.on('chainChanged', function (networkId) {
	updateUIForNetwork(networkId)
})

function updateUIForNetwork(chainId) {
	inCorrectNetwork = chainId == 4
	if (!inCorrectNetwork) {
		$("createButton").innerHTML = `Connect to Rinkeby in order to claim`
		$("createButton").classList.add('disabled')
		$("walletNavButton").innerHTML = `🔌 Connect to Rinkeby`
		$("walletNavButton").classList.add('xs-centered')
		$("walletNavButton").classList.add('wideOnSm')
		$("vaultsNavButton").classList.add('d-none')
	} else {
		// Check if User is already connected by retrieving the accounts
		web3.eth.getAccounts()
		.then((accounts) => {
			if (accounts.length > 0) {
				useAddress(accounts[0])
			}
		})
	}
}

function updateUIForNoWallet() {
	$("createButton").innerHTML = 'Connect an Ethereum wallet to create a vault'
	$("walletNavButton").innerHTML = '🔌 Connect Ethereum wallet'
	$("vaultsNavButton").classList.add('d-none')
	$("walletNavButton").classList.add('wideOnSm')
}

function useAddress(address) {
	walletAddress = address
	window.web3 = new Web3(window.ethereum)
	vaultsContract = new web3.eth.Contract(TokenVaultsRinkebyABI, contractAddress, {
		from: walletAddress
	})
	updateUIFor(walletAddress)
}

function walletButtonClicked() {
	requestAddresses()
}

function myVaultsClicked() {
	// window.location.href = "/vaults/" + walletAddress;
}

function updateUIFor(address) {
	$("walletNavButton").innerHTML = `0x...${address.slice(-5)}`
	$("walletNavButton").classList.remove('xs-centered')

	// vaultsContract.methods.ownerOf(address).call({}, function(error, result){
	// 	if (!result) {
	// 		$("createButton").innerHTML = `Claim ETHouse for 0x...${address.slice(-5)}`
	// 		$("createButton").classList.remove('disabled')
	// 	} else {
	// 		$("createButton").innerHTML = `ETHouse for 0x...${address.slice(-5)} already claimed`
	// 		$("createButton").classList.add('disabled')
	// 	}
	// })

	$("createButton").classList.add('d-none')

	vaultsContract.methods.balanceOf(address).call({}, function(error, result){
		if (error) {
			$("vaultsNavButton").classList.add('d-none')
			$("walletNavButton").classList.add('wideOnSm')
		} else {
			$("vaultsNavButton").innerHTML = `My Keys (${result})`
			$("vaultsNavButton").classList.remove('d-none')
			$("walletNavButton").classList.remove('wideOnSm')
		}
	})
}

function requestAccountsRPC() {
	window.ethereum.request({
		method: 'eth_requestAccounts'
	})
	.then((acocunts) => {
		useAddress(acocunts[0])
	})
	.catch((error) => {
		if (error.code === 4001) {
			console.log('Permissions needed to continue.')
		} else {
			console.error(error)
		}
	})
}

function requestAddresses() {
	if (window.ethereum) {
		if (!inCorrectNetwork) {
			ethereum.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: '0x1' }]
			})

			return
		}

		if (!walletAddress) {
			requestAccountsRPC()
		} else {
			// Switching accounts, does not work in mobile metamask yet
			window.ethereum.request({
				method: 'wallet_requestPermissions',
				params: [{ eth_accounts: {} }],
			})
			.then((permissions) => {
				const accountsPermission = permissions.find(
					(permission) => permission.parentCapability === 'eth_accounts'
				)
				if (accountsPermission) {
					requestAccountsRPC()
				}
			})
			.catch((error) => {
				if (error.code === 4001) {
					console.log('Permissions needed to continue.')
				} else {
					console.error(error)
				}
			})
		}
	} else {
		window.open("https://metamask.io/download.html")
	}
}

function createVault() {
	$("errorMessage").innerHTML = ""

	if (walletAddress) {
		// Already connected
		const erc20TokenAddressesString = $("erc20ContractsInput").value;
		const erc20TokenAmountsString = $("erc20AmountsInput").value;
		const erc721TokenAddressesString = $("erc721ContractsInput").value;
		const erc721TokenIdsString = $("erc721IdsInput").value;
		const beneficiary = $("beneficiaryInput").value;
		const timestamp = parseInt($("timestampInput").value);
		const ethAmount = $("ethInput").value.length == 0 ? '0' : $("ethInput").value;

		let validBeneficiary = web3.utils.isAddress(beneficiary)

		if (!validBeneficiary) {
			$("beneficiaryInput").classList.add('is-invalid')
			return
		} else {
			$("beneficiaryInput").classList.remove('is-invalid')
		}

		if (timestamp < Date.now() / 1000) {
			$("timestampInput").classList.add('is-invalid')
			return
		} else {
			$("timestampInput").classList.remove('is-invalid')
		}

		const erc20TokenAddresses = erc20TokenAddressesString.length == 0 ? [] : erc20TokenAddressesString.split(",")
		const erc20TokenAmounts = erc20TokenAmountsString.length == 0 ? [] : erc20TokenAmountsString.split(",")
		const erc721TokenAddresses = erc721TokenAddressesString.length == 0 ? [] : erc721TokenAddressesString.split(",")
		const erc721TokenIds = erc721TokenIdsString.length == 0 ? [] : erc721TokenIdsString.split("|").map((ids) => {ids.split(",")})

		console.log(erc20TokenAddresses,erc20TokenAmounts,erc721TokenAddresses,erc721TokenIds)
		
		createVaultCall(erc20TokenAddresses, erc20TokenAmounts, erc721TokenAddresses, erc721TokenIds, beneficiary, timestamp, ethAmount)
		// createVaultCall([], [], [], [], beneficiary, timestamp, ethAmount)
	} else {
		requestAddresses()
	}
}

function handleError(error) {
	console.log(error)
	if (error.code === -32000) {
		$("errorMessage").innerHTML = "Insufficient funds to cover price + gas"
	} else {
		$("errorMessage").innerHTML = error.message
	}
}

async function createVaultCall(erc20TokenAddresses, erc20TokenAmounts, erc721TokenAddresses, erc721TokenIds, beneficiary, timestamp, ethAmount) {
	console.log(erc20TokenAddresses, erc20TokenAmounts, erc721TokenAddresses, erc721TokenIds, beneficiary, timestamp, ethAmount)
	const createVaultMethod = vaultsContract.methods.createVault(erc20TokenAddresses, erc20TokenAmounts, erc721TokenAddresses, erc721TokenIds, beneficiary, timestamp)
	let options = {
		from: walletAddress,
		value: web3.utils.toWei(ethAmount, 'ether')
	}

	try {
		const gasEstimate = await createVaultMethod.estimateGas(options)

		options = {
			...options,
			gas: parseInt(1.2 * gasEstimate)
		}

		createVaultMethod.send(options, function(error, result){
			if (!error) {
				trackCreation(result)
			} else {
				handleError(error)
			}
		});
  	}
  	catch (error) {
		handleError(error)
  	}
}

function trackCreation(mintTxHash) {
	$("etherscanLink1").setAttribute("href", `https://rinkeby.etherscan.io/tx/${mintTxHash}`)
	$("etherscanLink2").setAttribute("href", `https://rinkeby.etherscan.io/tx/${mintTxHash}`)
	mintingToast.show()

	confirmEtherTransaction(mintTxHash, 3, () => {
		mintingToast.hide()
		mintingDoneToast.show()
		updateUIFor(walletAddress)
	})
}

function confirmEtherTransaction(txHash, confirmations = 3, callback) {
	setTimeout(async () => {
		const trxConfirmations = await getConfirmations(txHash)

		if (trxConfirmations >= confirmations) {
			callback()
			return
		}

		return confirmEtherTransaction(txHash, confirmations, callback)
	}, 5 * 1000)
  }

async function getConfirmations(txHash) {
	try {
		const trx = await web3.eth.getTransaction(txHash)
		const currentBlock = await web3.eth.getBlockNumber()

		return trx.blockNumber === null ? 0 : currentBlock - trx.blockNumber
  	}
  	catch (error) {
    	console.log(error)
  	}
}
