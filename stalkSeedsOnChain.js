var { web3, beanstalk } = require('./utils/web3.js')
var fs = require('fs');
var { getAllDepositEvents } = require('./utils/events.js')

async function getStalkSeeds(blockNumber) {
    const deposits = JSON.parse(await fs.readFileSync('./data/deposits-events.json'))
    let stalkSeeds = {}


    for (let a = 0; a < Object.keys(deposits).length; a++) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`${a}/${Object.keys(deposits).length}`);
        const account = Object.keys(deposits)[a]

        const calls = [
          beanstalk.methods.balanceOfStalk(account).encodeABI(),
          beanstalk.methods.balanceOfGrownStalk(account).encodeABI(),
          beanstalk.methods.balanceOfEarnedStalk(account).encodeABI(),
          beanstalk.methods.balanceOfSeeds(account).encodeABI(),
        ];

        const encodedFarmCall = beanstalk.methods.farm(calls).encodeABI();

        // console.log('encodedFarmCall: ', encodedFarmCall);

        const rawReturnValues = await web3.eth.call(
          {
            to: beanstalk.options.address,
            data: encodedFarmCall,
          },
          blockNumber
        );

        
        const farmOutputTypes = ['bytes[]'];
        const decodedResult = web3.eth.abi.decodeParameters(farmOutputTypes, rawReturnValues);
        const rawReturnValuesArray = decodedResult[0];

        const returnValues = rawReturnValuesArray.map(r => web3.eth.abi.decodeParameter('uint256', r));

        // console.log('returnValues for: ', account, returnValues);
        stalkSeeds[account] = {
            rawStalk: returnValues[0],
            grownStalk: returnValues[1],
            earnedStalk: returnValues[2],
            countedSeeds: returnValues[3],
            countedStalk: web3.utils.toBN(returnValues[0]).add(
                web3.utils.toBN(returnValues[1])).sub(
                    web3.utils.toBN(returnValues[2])
            ).toString()
        }

        // console.log('stalkSeeds[account]: ', stalkSeeds[account]);
    }
    await fs.writeFileSync(`./data/stalkSeeds-onchain.json`, JSON.stringify(stalkSeeds, null, 4));
}

exports.getStalkSeeds = getStalkSeeds