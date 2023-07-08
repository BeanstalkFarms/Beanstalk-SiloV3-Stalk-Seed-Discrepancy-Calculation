var { web3, beanstalk } = require('./utils/web3.js')
var fs = require('fs');

async function getDeposits(blockNumber) {

    //check if ./data/deposits-events.json exits, if it does, return. Uncomment this to use cached version.
    // if (fs.existsSync('./data/deposits-onchain.json')) {
    //     console.log('deposits-onchain.json already exists, skipping');
    //     return;
    // }

    async function updateDepositsForAccount(account, deposits, updatedDeposits) {
        if (!deposits[account]) {
            // console.log('no deposits for account', account);
            return;
        };


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
                if (!updatedDeposits[account][token]) updatedDeposits[account][token] = {};
                if (!updatedDeposits[account][token][season]) updatedDeposits[account][token][season] = {};
                updatedDeposits[account][token][season].amount = r[0];
                updatedDeposits[account][token][season].bdv = r[1];
            });
        });
    
        if (updatedDeposits[account].length === 0) {
            updatedDeposits[account] = {};
            // console.log('found an account with zero deposits', account);
        }
    }
        


    let deposits = JSON.parse(await fs.readFileSync('./data/deposits-events.json'))

    //if deposits-onchain.json exists and latest_addresses.json exists,
    //then load deposits-onchain.json and delete keys from latest_addresses.json list,
    //then only update those addresses that are in latest_addresses.json
    if (fs.existsSync('./data/deposits-onchain.json') && fs.existsSync('./data/latest_addresses.json')) {
        console.log('deposits-onchain.json and latest_addresses.json already exists, updating...');
        let latestAddresses = JSON.parse(await fs.readFileSync('./data/latest_addresses.json'))
        let depositsOnchain = JSON.parse(await fs.readFileSync('./data/deposits-onchain.json'))
        let depositsOnchainUpdated = {}
        for (let a = 0; a < Object.keys(deposits).length; a++) {
            const account = Object.keys(deposits)[a];
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(`Doing fast update: ${a}/${Object.keys(deposits).length}`);
            if (latestAddresses.includes(account)) {
                depositsOnchainUpdated[account] = updateDepositsForAccount(account, deposits, depositsOnchainUpdated); //get updated deposits for this address
            } else {
                //keep the cached deposits for this address
                depositsOnchainUpdated[account] = depositsOnchain[account];
            }
        }
        deposits = depositsOnchainUpdated;
    } else {
        //do normal deposits update
        for (let a = 0; a < Object.keys(deposits).length; a++) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(`${a}/${Object.keys(deposits).length}`);
            const account = Object.keys(deposits)[a];
            
            updateDepositsForAccount(account, deposits, deposits);
        
            // console.log('deposits for account: ', account, deposits[account]);
        }
    }
    
    await fs.writeFileSync(`./data/deposits-onchain.json`, JSON.stringify(deposits, null, 4));
}

exports.getDepositsOnChain = getDeposits