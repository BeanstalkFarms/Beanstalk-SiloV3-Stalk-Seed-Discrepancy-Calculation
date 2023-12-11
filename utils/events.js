var { beanstalk } = require('./web3.js')

const START_BLOCK = 0
// const END_BLOCK = 16993151; //'latest'


async function getAllDepositEvents(blockNumber) {
    const block_intervals = [
        START_BLOCK,
        14235713,
        14587393,
        15277988,
        15278963,
        15288963,
        15289963,
        15293963,
        15298963,
        15358963,
        15608963,
        16008963,
        /*16308963,
        16608963,
        17008963,
        17308963,
        17608963,
        18008963,
        18308963,*/
        blockNumber
    ]

    let depositEvents = await Promise.all(
        block_intervals.map((block, i) => {
            if (i == block_intervals.length-1) return []
            let settings_ = {
                fromBlock: block,
                toBlock: block_intervals[i+1] !== blockNumber ? block_intervals[i+1]-1 : blockNumber,
            }
            return Promise.all([
                beanstalk.getPastEvents('AddDeposit', settings_),
                beanstalk.getPastEvents('RemoveDeposits', settings_),
                beanstalk.getPastEvents('RemoveDeposit', settings_),
            ])
        })
    )

    depositEvents = (await depositEvents).flat().flat()
    depositEvents = depositEvents.sort((a,b) => {
        if (a.blockNumber == b.blockNumber) return a.logIndex - b.logIndex
        return a.blockNumber - b.blockNumber
    })
    console.log(`Found ${depositEvents.length} events...`)
    return depositEvents

}

/*async function getAccountDepositEvents(account, blockNumber) {
    const settings = {
        fromBlock: START_BLOCK,
        toBlock: blockNumber,
        filter: { account: account }
    };
    depositEvents = await  Promise.all([
        beanstalk.getPastEvents('AddDeposit', settings),
        beanstalk.getPastEvents('RemoveDeposits', settings),
        beanstalk.getPastEvents('RemoveDeposit', settings),
    ])
    depositEvents = (await depositEvents).flat().flat()
    depositEvents = depositEvents.sort((a,b) => {
        if (a.blockNumber == b.blockNumber) return a.logIndex - b.logIndex
        return a.blockNumber - b.blockNumber
    })
    return depositEvents
}

exports.getAccountDepositEvents = getAccountDepositEvents*/
exports.getAllDepositEvents = getAllDepositEvents