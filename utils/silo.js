var { web3 } = require('./web3.js')

function getSeedsFromDeposits(deposits) {
    return Object.entries(deposits).reduce((acc, [token, v2]) => {
        return acc.add(Object.entries(v2).reduce((acc, [season, {amount, bdv}]) => {
            return acc.add(web3.utils.toBN(bdv).mul(getBdvPerToken(token)))
        }, web3.utils.toBN('0')))
    }, web3.utils.toBN('0'))
}

function getStalkFromDeposits(deposits, currentSeason) {
    return Object.entries(deposits).reduce((acc, [token, v2]) => {
        return acc.add(Object.entries(v2).reduce((acc, [season, {amount, bdv}]) => {
            return acc.add(web3.utils.toBN(bdv).mul(
                web3.utils.toBN('10000').add(currentSeason.sub(web3.utils.toBN(season)).mul(getBdvPerToken(token)))
            ))
        }, web3.utils.toBN('0')))
    }, web3.utils.toBN('0'))
}

function getBdvPerToken(token) {
    if (token.toLowerCase() == '0x1bea3ccd22f4ebd3d37d731ba31eeca95713716d') {
        return web3.utils.toBN('4');
    }
    if (token.toLowerCase() == '0x1bea0050e63e05fbb5d8ba2f10cf5800b6224449') {
        return web3.utils.toBN('2')
    }
    if (token.toLowerCase() == '0xc9c32cd16bf7efb85ff14e0c8603cc90f6f2ee49') {
        return web3.utils.toBN('4')
    }
    if (token.toLowerCase() == '0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab') {
        return web3.utils.toBN('2')
    }
    console.log("oops")
}

exports.getSeedsFromDeposits = getSeedsFromDeposits
exports.getStalkFromDeposits = getStalkFromDeposits