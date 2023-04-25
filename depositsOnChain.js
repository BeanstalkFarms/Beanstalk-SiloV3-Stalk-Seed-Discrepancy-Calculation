var { web3, beanstalk } = require('./utils/web3.js')
var fs = require('fs');

async function getDeposits() {
    const deposits = JSON.parse(await fs.readFileSync('./data/deposits-events.json'))

    for (let a = 0; a < Object.keys(deposits).length; a++) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`${a}/${Object.keys(deposits).length}`);
        const account = Object.keys(deposits)[a]
        const calls = Object.keys(deposits[account]).reduce((acc, token) => {
            return acc.concat(Object.keys(deposits[account][token]).map(season => {
                return beanstalk.methods.getDeposit(account, token, season).encodeABI()
            }))
        }, [])
        returnValues = (await beanstalk.methods.farm(calls).call()).map(r => web3.eth.abi.decodeParameters(['uint256', 'uint256'], r))
        Object.keys(deposits[account]).forEach((token) => {
            Object.keys(deposits[account][token]).forEach(season => {
                const r = returnValues.shift()
                deposits[account][token][season].amount = r[0]
                deposits[account][token][season].bdv = r[1]
            })
        })
    }
    await fs.writeFileSync(`./data/deposits-onchain.json`, JSON.stringify(deposits, null, 4));
}

exports.getDepositsOnChain = getDeposits