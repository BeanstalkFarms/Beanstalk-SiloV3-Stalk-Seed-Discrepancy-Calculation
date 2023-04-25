var { web3, beanstalk } = require('./utils/web3.js')
var fs = require('fs');
var { getAllDepositEvents } = require('./utils/events.js')
var { getSeedsFromDeposits, getStalkFromDeposits } = require('./utils/silo.js')


async function getStalkSeeds() {
    const deposits = JSON.parse(await fs.readFileSync('./data/deposits-onchain.json'))
    const stalkSeeds = JSON.parse(await fs.readFileSync('./data/stalkSeeds-onchain.json'))
    let seedDiscrepencies = {}
    let stalkDiscrepencies = {}
    let stalkSeedDiscrepencies = []

    const season = web3.utils.toBN(await beanstalk.methods.season().call())

    for (let a = 0; a < Object.keys(deposits).length; a++) {
        const account = Object.keys(deposits)[a]
        const seedsFromDeposits = getSeedsFromDeposits(deposits[account])
        const seedsFromChain = stalkSeeds[account].countedSeeds
        let addRow = false
        if (seedsFromDeposits != seedsFromChain) {
            seedDiscrepencies[account] = web3.utils.toBN(seedsFromChain).sub(
                web3.utils.toBN(seedsFromDeposits)
            ).toString()
            addRow = true
        }
        const stalkFromDeposits = getStalkFromDeposits(deposits[account], season)
        const stalkFromChain = stalkSeeds[account].countedStalk
        if (stalkFromDeposits != stalkFromChain) {
            stalkDiscrepencies[account] = web3.utils.toBN(stalkFromChain).sub(
                web3.utils.toBN(stalkFromDeposits)
            ).toString()
            addRow = true
        }

        if (addRow) {
            stalkSeedDiscrepencies.push([
                account,
                stalkDiscrepencies[account] || '0',
                seedDiscrepencies[account] || '0'
            ])
        }



    }
    await fs.writeFileSync(`./data/seed-discrepencies.json`, JSON.stringify(seedDiscrepencies, null, 4));
    await fs.writeFileSync(`./data/stalk-discrepencies.json`, JSON.stringify(seedDiscrepencies, null, 4));
    await fs.writeFileSync(`./data/seed-stalk-discrepencies.json`, JSON.stringify(stalkSeedDiscrepencies, null, 4));
    await fs.writeFileSync(`./data/seed-stalk-discrepencies.csv`, stalkSeedDiscrepencies.join('\n'))
}

exports.calcStalkSeedDiscrepencies = getStalkSeeds