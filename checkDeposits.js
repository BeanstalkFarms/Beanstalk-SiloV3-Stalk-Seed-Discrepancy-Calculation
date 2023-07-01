var { web3, beanstalk } = require('./utils/web3.js')
var fs = require('fs');

async function checkDeposits() {
    const deposits = JSON.parse(await fs.readFileSync('./data/deposits-events.json'))
    const totals = {}
    Object.keys(deposits).forEach(account => {
        Object.keys(deposits[account]).forEach(token => {
            if (!totals[token]) totals[token] = web3.utils.toBN('0')
            Object.keys(deposits[account][token]).forEach(season => {
                totals[token] = totals[token].add(
                    web3.utils.toBN(deposits[account][token][season].amount)
                )
            })
        })
    })

    for (let i = 0; i < Object.keys(totals).length; i++) {
        const token = Object.keys(totals)[i]
        let deposited = await beanstalk.methods.getTotalDeposited(token).call()
        if (token == '0xBEA0000029AD1c77D3d5D23Ba2D8893dB9d1Efab') {
            const earnedBeans = await beanstalk.methods.totalEarnedBeans().call()
            console.log(earnedBeans)
            deposited = web3.utils.toBN(deposited).sub(web3.utils.toBN(earnedBeans))
        }
        console.log(`Token: ${token}`)
        // console.log(`Deposited: ${deposited}`)
        // console.log(`Total: ${totals[token].toString()}`)
        console.log(`Diff: ${totals[token].sub(web3.utils.toBN(deposited)).toString()}`)
    }

}

(async () => {
    await checkDeposits()
})();
