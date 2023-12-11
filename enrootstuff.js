const fs = require("fs");
require("dotenv").config();
const { network, ethers } = require("hardhat");
require("@nomicfoundation/hardhat-toolbox");
const { RPC_URL } = require('./utils/web3.js');
const { decodeFarm } = require('./decodeFarm.js');

const LATEST_BLOCK = 18703853;
const SILOV3_DEPLOYMENT = 17671557;

const FORK_BLOCK_NUMBER = LATEST_BLOCK;



const END_BLOCK = LATEST_BLOCK;
const QUERY_EVENTS_START_BLOCK = SILOV3_DEPLOYMENT;

(async () => {
  try {

    //maybe this is not necessary if hardhat.js is setup correctly?
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: RPC_URL,
            blockNumber: FORK_BLOCK_NUMBER,
          },
        },
      ],
    });
  } catch (error) {
    console.log("forking error, uh oh");
    console.log(error);
    return;
  }

  const beanstalkAddress = "0xc1e088fc1323b20bcbee9bd1b9fc9546db5624c5";


  const provider = new ethers.JsonRpcProvider(RPC_URL);


    console.log('here 1');

    //load beanstalk abi from ./abi/Beanstalk.json'
    const beanstalkAbi = JSON.parse(
        fs.readFileSync("./abi/Beanstalk.json", "utf8")
    );

  const beanContract = new ethers.Contract(
    beanstalkAddress,
    beanstalkAbi,
    provider
  );


  const queryEvents = async (eventSignature, interface, startBlock) => {
    const eventTopic = ethers.id(eventSignature);
    // Create the filter object
    const filter = {
      fromBlock: startBlock,
      toBlock: END_BLOCK,
      address: beanContract.address,
      topics: [eventTopic],
    };
    const events = await provider.getLogs(filter, 0, END_BLOCK);
    const updatedEvents = events.map((eventLog) => {
      let parsedLog;
      parsedLog = interface.parseLog(eventLog);
      if (parsedLog) {
        const { args } = parsedLog;
        eventLog = { ...eventLog, ...args };
        const eventName = eventSignature.split("(")[0];
        eventLog["event"] = eventName;
      }
      return eventLog;
    });
    return updatedEvents;
  };

  const oldRemoveDepositAbi = [
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "account", type: "address", },
        { indexed: true, internalType: "address", name: "token", type: "address", },
        { indexed: false, internalType: "uint32", name: "season", type: "uint32", },
        { indexed: false, internalType: "uint256", name: "amount", type: "uint256", },
      ],
      name: "RemoveDeposit",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "account", type: "address", },
        { indexed: true, internalType: "address", name: "token", type: "address", },
        { indexed: false, internalType: "int96[]", name: "stems", type: "int96[]", },
        { indexed: false, internalType: "uint256[]", name: "amounts", type: "uint256[]", },
        { indexed: false, internalType: "uint256", name: "amount", type: "uint256", },
        { indexed: false, internalType: "uint256[]", name: "bdvs", type: "uint256[]", },
      ],
      name: "RemoveDeposits",
      type: "event",
    },
  ];

  const removeDepositInterface = new ethers.Interface(
    oldRemoveDepositAbi
  );

  //get every transaction that has a RemoveDeposits event, this event is emitted by EnrootDeposits
  //only problem is that it's also emitted by many other functions, so we need to filter those out
  //which is what happens with the farm decoding
  //this still left a number of transactions that didn't start with a farm call, but with a gnosis safe call
  //or a call from a transparent proxy contract, those are manually handled. (No great way just to see
  //a list of all the functions that were called within a transaction without using something like the Tenderly API)
  let events = await queryEvents(
    "RemoveDeposits(address,address,int96[],uint256[],uint256,uint256[])",
    removeDepositInterface,
    QUERY_EVENTS_START_BLOCK
  );

  const transactionsWithARemoveDepositEvent = [];

  //loop through events
  for (let i = 0; i < events.length; i++) {
    let event = events[i];
    transactionsWithARemoveDepositEvent.push(event.transactionHash);
  }

  //loop through transactions with a remove deposit event and only include those who's function calls include farm with enrootDeposits or plain enrootDeposits

  const addressesThatDidAnEnroot = [];

  console.log('transactionsWithARemoveDepositEvent.length: ', transactionsWithARemoveDepositEvent.length);

  for (let i = 0; i < transactionsWithARemoveDepositEvent.length; i++) {
    let txid = transactionsWithARemoveDepositEvent[i];

    if (txid == '0x900364272524b136fd4f9b80ee4f4135babaadfa788316e597649f79471dc287') {
      //this one has enroot deposits, on address 0xe591f77b7d5a0a704feba8558430d7991e928888
      //it calls selector 0x0b58f073 on the farm function which fails, so messes up
      //the decodeFarm function a bit, just handling it manually here
      addressesThatDidAnEnroot.push('0xe591f77b7d5a0a704feba8558430d7991e928888');
      continue;
    }
    
    let decoded = await decodeFarm(txid, provider, beanstalkAbi, beanContract);

    // console.log(i, 'decoded: ', decoded);

    if (decoded.includes('enrootDeposits')) {
      const tx = await provider.getTransaction(txid);

      console.log('Found an enroot deposit! sender: ', tx);

      addressesThatDidAnEnroot.push(tx.from);
    }

    if (decoded.includes('not a farm function')) {
      //is tx from 0x21de18b6a8f78ede6d16c50a167f6b222dc08df7? if yes then it is gnosis safe
      const tx = await provider.getTransaction(txid);
      
      if (tx.to == '0x9662C8E686fe84F468a139b10769D65665c344F9') {
        //ignore, this is a "bot" address, it didn't do any enroot txns
      } else if (tx.to == '0x9f15DE1a169D3073f8fBA8de79E4BA519b19C64D') {
        //skip this one, seems to be another upgradable proxy and doesn't call enroot
      } else  if (tx.to == '0xc5A7F91Ac0B24CA8957a97AACab4fc1022e256f5') {
        //skip this one, seems to be another upgradable proxy and doesn't call enroot
      } else  if (tx.to == '0xB9F14eFae1D14b6d06816B6E3a5F6e79c87232fA') {
        //skip this one, seems to be another upgradable proxy and doesn't call enroot
      } else  if (tx.to == '0xBc7c5f21C632c5C7CA1Bfde7CBFf96254847d997') {
        //skip this one, seems to be another upgradable proxy and doesn't call enroot
      } else  if (txid == '0x6aae3a31c47958b172b660b08f36d7ba8d4be2dd2c1a5f48cb2033ffb41d7648') {
        //skip this one, doesn't call enroot
      } else if (txid == '0x674187c101c3f36b53d193c29fc91707bf56c704882a25c64f13663c33074204') {
        //skip this one, doesn't call enroot (a gnosis safe call to withdraw deposits)
      } else if (txid == '0x49bfafcf82303d7256bd32c34f10b82c91ecaa1a9fa922ee2e9e46b081fb6a6b') {
        //this is a gnosis safe with call to transfer deposits, no enroot
      } else if (txid == '0xdd185592d0d2a905fb21d5f0e34b03922baf4b799e5fff71b029a574dc954ed9') {
        //this is a gnosis safe with call to transfer deposits, no enroot
      } else if (txid == '0xce3dbb3d554938aefe7527bc3e5c1c32ef1b0915499d3b5fae273425ec41438f') {
        //this is a gnosis safe with call to transfer deposits, no enroot
      } else if (txid == '0x91b24dd15c93a1abe8c6641fea453406f553091929d34190f5842bfc8ebf4bf5') {
        //this is a gnosis safe with call to transfer deposits, no enroot
      } else if (txid == '0x41d94fb2bd6a4e90a4f801bfd0617b1a5f880e2396eda4ef3895451c8cee36b4') {
        //this is a gnosis safe with call to transfer deposits, no enroot
      } 
      else {
        console.log('investigate this tx: ', tx);
      }
    }

    if (decoded.includes("Error decoding arguments")) {
      const tx = await provider.getTransaction(txid);

      if (tx.id == '0x900364272524b136fd4f9b80ee4f4135babaadfa788316e597649f79471dc287') {
        addressesThatDidAnEnroot.push(tx.from);
      }
    }
  }

  console.log('addressesThatDidAnEnroot: ', addressesThatDidAnEnroot);

  console.log("done");
})();
