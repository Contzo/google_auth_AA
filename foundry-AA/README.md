## Foundry-AA flow
- Since this is an AA flow, the end user will not have a classic wallet with a private-public key pair and will not hold any ETH.
- Instead the user will only have to log in with google and the backend will generate an unique credential hash.
    - This hash will be used to generate a deterministic address for the SCW contract and use this to construct the the UserOp object.
    - The object will be signe and submitted to the mempool by a single address BACKEND_SIGNING_KEY.
    - If the user doesn't have a SCW account a new SCW is deployed with a CREATE2 address determined using the credential hash. This deploy transaction will be submitted directly to the chain and be signed by a BACKEND_DEPLOYER_KEY. 



### Contracts
- We are going to have 3 contracts that will be deployed on the blockchaina.
1. ScwToken.sol 
    - An ERC-20 token that will be usded as the interactive asset of this app. 
2. SCW.sol
    - A user smart contract wallet that will be deployed for every user. Implements the IAccount interface following the EIP-4337 interface 
    - Functions:
        - `validateUserOp(userOp, hash, funds)` 
            - caller `EntryPoint` contract 
            - Verifies ECDSA signature of the UserOp is from BACKEND_SIGNING_KEY and pays prefunds if required. 
        - `execute(dest, value, data)` 
            - caller `EntryPoint` contract
            - Executes transactions on behalf of the user to the target contract, the SCW will olny make transactions to the `ScwToken.sol`
        - `receive()`:
            - caller: anoyone
            - Receives ETH required to pay for non sponsored flows. 

3. SponsorContract.sol 

    - A paymaster contract that will hold ETH inside the EntryPoint contract and will sponsor transactions only for accounts that have been deployed by this protocol.
4. ScwFactory.sol   
    - Deploys and tracks SCW for every user. Will generate a CREATE2 deterministic address derived from a credential hashed derived from each user Google's identity. 

