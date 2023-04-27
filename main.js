const fs = require('fs');
require('dotenv').config();
const {getDeposits} = require('./deposits');
const {getDepositsOnChain} = require('./depositsOnChain');
const {calcStalkSeedDiscrepancies} = require('./calcStalkSeedDiscrepancies');
const {getStalkSeeds} = require('./stalkSeedsOnChain');

(async () => {
    if (!fs.existsSync('./data')){
        fs.mkdirSync('./data');
    }
    let blockNumber = 16993151; 
    //change to 'latest' after stems deploy, run `node scripts/silov3-merkle/stems_merkle.js`
    //in main bean repo protocol dir to get updated merkle root, then update contracts/libraries/Silo/LibLegacyTokenSilo.sol
    //_mowAndMigrateMerkleCheck with the new merkle root
    console.log("Fetching Deposits...")
    await getDeposits()
    console.log("Fetching Deposits on Chain...")
    await getDepositsOnChain(blockNumber)
    console.log("Fetching Stalk Seeds on Chain...")
    await getStalkSeeds(blockNumber)
    console.log("Calculating Discrepancies...")
    await calcStalkSeedDiscrepancies(blockNumber)
})();