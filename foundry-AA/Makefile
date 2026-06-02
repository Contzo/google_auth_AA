-include .env

DEPLOY_SCRIPT := script/SystemDeployer.s.sol:SystemDeployer
MINT_SCRIPT  := script/MintScwToken.s.sol:MintScwToken

AMOUNT ?= 1000000000000000000

.PHONY: anvil deploy-anvil deploy-sepolia mint-anvil mint-sepolia

anvil:
	anvil --code-size-limit 40000

deploy-anvil:
	forge script $(DEPLOY_SCRIPT) \
		--rpc-url http://127.0.0.1:8545 \
		--private-key $(LOCAL_SIGNER_KEY) \
		--broadcast

deploy-sepolia:
	forge script $(DEPLOY_SCRIPT) \
		--rpc-url $(SEPOLIA_RPC_URL) \
		--private-key $(SEPOLIA_SIGNER_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ETHERSCAN_API_KEY)

mint-anvil:
	TOKEN_ADDRESS=$(ANVIL_ERC20_TOKEN) AMOUNT=$(AMOUNT) \
	forge script $(MINT_SCRIPT) \
		--rpc-url $(ANVIL_RPC_URL) \
		--private-key $(LOCAL_SIGNER_KEY) \
		--broadcast

mint-sepolia:
	TOKEN_ADDRESS=$(SEPOLIA_ERC20_TOKEN) AMOUNT=$(AMOUNT) \
	forge script $(MINT_SCRIPT) \
		--rpc-url $(SEPOLIA_RPC_URL) \
		--private-key $(SEPOLIA_SIGNER_KEY) \
		--broadcast
