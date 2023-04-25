const fs = require('fs');
const {getDeposits} = require('./deposits');
const {getDepositsOnChain} = require('./depositsOnChain');
const {calcStalkSeedDiscrepencies} = require('./calcStalkSeedDiscrepencies');
const {getStalkSeeds} = require('./stalkSeedsOnChain');

(async () => {
    if (!fs.existsSync('./data')){
        fs.mkdirSync('./data');
    }
    console.log("Fetching Deposits...")
    await getDeposits()
    console.log("Fetching Deposits on Chain...")
    await getDepositsOnChain()
    console.log("Fetching Stalk Seeds on Chain...")
    await getStalkSeeds()
    console.log("Calculating Discrepencies...")
    await calcStalkSeedDiscrepencies()
})();