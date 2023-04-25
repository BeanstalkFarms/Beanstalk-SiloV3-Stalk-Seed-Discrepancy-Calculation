var { web3 } = require('./utils/web3.js')
var fs = require('fs');
var { getAllDepositEvents, getAccountDepositEvents } = require('./utils/events.js')

async function getDeposits() {
    depositEvents = await getAllDepositEvents()

    let deposits = depositEvents.reduce((acc, d, i) => {
        let account = d.returnValues.account
        if (!acc[account]) acc[account] = {}
        let token = d.returnValues.token
        let season = d.returnValues.season
        if (!acc[account][token]) acc[account][token] = {}
        if (d.event == 'AddDeposit') {
            if (!acc[account][token][season]) acc[account][token][season] = {
                amount: web3.utils.toBN('0'),
                bdv: web3.utils.toBN('0'),
            }
            acc[account][token][season].amount = acc[account][token][season].amount.add(web3.utils.toBN(d.returnValues.amount))
            acc[account][token][season].bdv = acc[account][token][season].bdv.add(web3.utils.toBN((d.returnValues.bdv)))
            if (acc[account][token][season].amount.eq(web3.utils.toBN('0'))) delete acc[account][token][season]
        } else if (d.event == 'RemoveDeposit') {
            let season = d.returnValues.season
            let amount = web3.utils.toBN(d.returnValues.amount)
            let bdv = amount.mul(acc[account][token][season].bdv).div(acc[account][token][season].amount)
            acc[account][token][season].amount = acc[account][token][season].amount.sub(amount)
            acc[account][token][season].bdv = acc[account][token][season].bdv.sub(bdv)
            if (acc[account][token][season].amount.eq(web3.utils.toBN('0'))) delete acc[account][token][season]
        } else if (d.event == 'RemoveDeposits') {
            let seasons = d.returnValues.seasons
            let amounts = d.returnValues.amounts
            for (let i = 0; i < seasons.length; i++) {
                let amount = web3.utils.toBN(amounts[i])
                if (`${amount}` !== '0') {
                    let bdv = amount.mul(acc[account][token][seasons[i]].bdv).div(acc[account][token][seasons[i]].amount)
                    acc[account][token][seasons[i]].amount = acc[account][token][seasons[i]].amount.sub(amount)
                    acc[account][token][seasons[i]].bdv = acc[account][token][seasons[i]].bdv.sub(bdv)
                    if (acc[account][token][seasons[i]].amount.eq(web3.utils.toBN('0'))) delete acc[account][token][seasons[i]]
                }
            }
        }
        if (Object.keys(acc[account]) == 0) delete acc[account]
        return acc;
    }, {})

    Object.keys(deposits).forEach((account) => {
        Object.keys(deposits[account]).forEach((token) => {
            Object.keys(deposits[account][token]).forEach((season) => {
                deposits[account][token][season].amount = `${deposits[account][token][season].amount}`
                deposits[account][token][season].bdv = `${deposits[account][token][season].bdv}`
            })
        })
    })

    await fs.writeFileSync(`./data/deposits-events.json`, JSON.stringify(deposits, null, 4));
}

exports.getDeposits = getDeposits