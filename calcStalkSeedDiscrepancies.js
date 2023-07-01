var { web3, beanstalk } = require('./utils/web3.js')
var fs = require('fs');
var { getSeedsFromDeposits, getStalkFromDeposits } = require('./utils/silo.js')


async function getStalkSeeds(blockNumber) {
    const deposits = JSON.parse(await fs.readFileSync('./data/deposits-onchain.json'))
    const stalkSeeds = JSON.parse(await fs.readFileSync('./data/stalkSeeds-onchain.json'))
    let seedDiscrepancies = {}
    let stalkDiscrepancies = {}
    let stalkSeedDiscrepancies = []


    // const season = web3.utils.toBN(await beanstalk.methods.season().call())

    const encodedSeasonCall = beanstalk.methods.season().encodeABI();

    const rawSeasonValue = await web3.eth.call(
      {
        to: beanstalk.options.address,
        data: encodedSeasonCall,
      },
      blockNumber
    );

    const season = web3.utils.toBN(web3.eth.abi.decodeParameter('uint256', rawSeasonValue));

    console.log('for season: ', season);

    for (let a = 0; a < Object.keys(deposits).length; a++) {
        const account = Object.keys(deposits)[a]
        const seedsFromDeposits = getSeedsFromDeposits(deposits[account])
        const seedsFromChain = stalkSeeds[account].countedSeeds
        let addRow = false
        if (seedsFromDeposits != seedsFromChain) {
            seedDiscrepancies[account] = web3.utils.toBN(seedsFromChain).sub(
                web3.utils.toBN(seedsFromDeposits)
            ).toString()
            addRow = true
        }
        const stalkFromDeposits = getStalkFromDeposits(deposits[account], season)
        const stalkFromChain = stalkSeeds[account].countedStalk
        if (stalkFromDeposits != stalkFromChain) {
            stalkDiscrepancies[account] = web3.utils.toBN(stalkFromChain).sub(
                web3.utils.toBN(stalkFromDeposits)
            ).toString()
            addRow = true
        }

        if (addRow) {
            stalkSeedDiscrepancies.push([
                account,
                stalkDiscrepancies[account] || '0',
                seedDiscrepancies[account] || '0'
            ])
        }

    }
    await fs.writeFileSync(`./data/seed-discrepancies.json`, JSON.stringify(seedDiscrepancies, null, 4));
    await fs.writeFileSync(`./data/stalk-discrepancies.json`, JSON.stringify(seedDiscrepancies, null, 4));
    await fs.writeFileSync(`./data/seed-stalk-discrepancies.json`, JSON.stringify(stalkSeedDiscrepancies, null, 4));
    await fs.writeFileSync(`./data/seed-stalk-discrepancies.csv`, stalkSeedDiscrepancies.join('\n'))
}

exports.calcStalkSeedDiscrepancies = getStalkSeeds