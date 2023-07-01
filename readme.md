# How to use:
1. Replace `<RPC_URL>` in `./utils/web3.js` with a valid RPC url
2. run `npm install`
3. run `node main.js`
4. output will be saved in: `seed-stalk-discrepancies.json` and `seed-stalk-discrepancies.csv`

# Script Breakdown:

- `deposits.js` -> Get all deposits from events and outputs in `deposits/deposits-events.json`

- `depositsOnChain.js` -> Get all deposits on-chain using all non-zero deposits determined in `deposits.js` and outputs in `deposits/deposits-onchain.json`

- `checkDeposits.js` -> Check that the sum of all amounts in Deposits equals the total Deposited amount for each token

- `stalkSeedsOnChain.js` -> Get the Stalk, Grown Stalk, Earned Stalk and Seeds for each account with at least 1 Deposit. `countedStalk` and `countedSeeds` are the values that should be used to compare. Outputs in `stalkSeeds-onchain.json`

- `calcStalkSeedDiscrencies.js` -> Compute the discrepancies between the Stalk/Seed on-chain balances and the computed Stalk/Seed balances