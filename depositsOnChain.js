var { web3, beanstalk } = require('./utils/web3.js')
var fs = require('fs');

async function getDeposits(blockNumber) {

    //check if ./data/deposits-events.json exits, if it does, return. Uncomment this to use cached version.
    // if (fs.existsSync('./data/deposits-onchain.json')) {
    //     console.log('deposits-onchain.json already exists, skipping');
    //     return;
    // }


    const deposits = JSON.parse(await fs.readFileSync('./data/deposits-events.json'))

    for (let a = 0; a < Object.keys(deposits).length; a++) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`${a}/${Object.keys(deposits).length}`);
        const account = Object.keys(deposits)[a];
        const calls = Object.keys(deposits[account]).reduce((acc, token) => {
            return acc.concat(
                Object.keys(deposits[account][token]).map((season) => {
                    return beanstalk.methods.getDeposit(account, token, season).encodeABI();
                })
            );
        }, []);
    
        const encodedFarmCall = beanstalk.methods.farm(calls).encodeABI();
        const rawReturnValues = await web3.eth.call(
            {
                to: beanstalk.options.address,
                data: encodedFarmCall,
            },
            blockNumber
        );
    
        const farmOutputTypes = ['uint256', 'uint256'];
        const rawReturnValuesArray = web3.eth.abi.decodeParameters(['bytes[]'], rawReturnValues)[0];
        const returnValues = rawReturnValuesArray.map((r) => web3.eth.abi.decodeParameters(farmOutputTypes, r));
    
        Object.keys(deposits[account]).forEach((token) => {
            Object.keys(deposits[account][token]).forEach((season) => {
                const r = returnValues.shift();
                deposits[account][token][season].amount = r[0];
                deposits[account][token][season].bdv = r[1];
            });
        });
    
        if (deposits[account].length === 0) {
            deposits[account] = {};
            console.log('found an account with zero deposits', account);
        }
    
        // console.log('deposits for account: ', account, deposits[account]);
    }
    
    await fs.writeFileSync(`./data/deposits-onchain.json`, JSON.stringify(deposits, null, 4));
}

exports.getDepositsOnChain = getDeposits