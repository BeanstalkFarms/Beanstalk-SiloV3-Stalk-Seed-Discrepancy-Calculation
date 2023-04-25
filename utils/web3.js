var Web3 = require('web3');
const { Alchemy, Network, Utils } = require("alchemy-sdk");

const BEANSTALK_ADDRESS = '0xC1E088fC1323b20BCBee9bd1B9fC9546db5624C5' // Beanstalk's address
const MULTICALL_ADDRESS = '0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441'
const RPC_URL = '<RPC_URL>' // RPC URL
var web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL))

var beanstalkAbi = require('../abi/Beanstalk.json')
var multicallAbi = require('../abi/Multicall.json')

var beanstalk = new web3.eth.Contract(beanstalkAbi, BEANSTALK_ADDRESS)
var multicall = new web3.eth.Contract(multicallAbi, MULTICALL_ADDRESS)

const ALCHEMY_KEY = "ERW98ukfkBwf8Lca8F3VffpTAqzqFT88"

const config = {
    apiKey: ALCHEMY_KEY,
    network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(config);

exports.web3 = web3
exports.alchemy = alchemy
exports.beanstalk = beanstalk
exports.multicall = multicall
exports.BEANSTALK_ADDRESS = BEANSTALK_ADDRESS
exports.MULTICALL_ADDRESS = MULTICALL_ADDRESS