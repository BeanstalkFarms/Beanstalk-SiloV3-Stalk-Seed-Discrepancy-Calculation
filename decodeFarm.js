
const { network, ethers } = require("hardhat");


const decodeFarmData = async (decodedCallData, txid, beanstalkAbi, beanContract) => {
    decodedCallData = ethers.getBytes(decodedCallData);

    var selector = decodedCallData.slice(0, 4);
    var selectorHex = ethers.toQuantity(selector);

    //get function from selector name
    var funcName = await getFunctionNameFromSelector(selectorHex, beanstalkAbi);

    //strip out the selector from the decodedCallData, put into var called argData
    var argData = decodedCallData;
    //turn argData back into hex
    argData = ethers.hexlify(argData);

    //decode the arguments
    var args;
    try {
      args = beanContract.interface.decodeFunctionData(funcName, argData);
    } catch (error) {
      console.log('caught some error: ', error);
      console.log('error was for txid: ', txid);
      return "Error decoding arguments";
    }
    
    //copy args to regular array, otherwise it's immutable
    args = [...args];

    const justFunctionName = funcName.split("(")[0];

    if (justFunctionName == "convert") {
      //take the first arg and make it prettier
      args[0] = makeConvertPretty(args[0]);
    }

    //now that we have args, lets turn it into a string
    var argsString = args.map((arg) => {
      //if arg is a string, just return it
      if (typeof arg === "string") {
        return arg;
      }
      //if it's an array, iterate through and wrap in []
      else if (Array.isArray(arg)) {
        return (
          "[" +
          arg
            .map((item) => {
              return item.toString();
            })
            .join(", ") +
          "]"
        );
      } else {
        //otherwise, just return the string version
        return arg.toString();
      }
    });

    //join argsString with commas, except for last one
    argsString = argsString.join(", ");

    var fullArgumentCallAsString = justFunctionName + "(" + argsString + ")";

    return fullArgumentCallAsString;
  };


  async function getFunctionNameFromSelector(selector, beanstalkAbi) {
    try {
      const functionFragment = beanstalkAbi.find((item) => {
          //generate the selector from the function name
          var fullFunctionName = item.name + '(' + item.inputs.map((input) => input.type).join(',') + ')';
  
          //.id function does a keccak256
          var funcSelector = ethers.id(fullFunctionName);
          //get first 10 bytes
          funcSelector = funcSelector.slice(0, 10);
          return item.type === "function" && funcSelector === selector;
      });
  
      if (functionFragment) {
          var fullFunctionName = functionFragment.name + '(' + functionFragment.inputs.map((input) => input.type).join(',') + ')';
  
          return fullFunctionName;
      } else {
          return "Function not found for the given selector " + selector;
      }
    } catch (error) {
      console.log('caught some error: ', error);
      return "Error decoding selector";
    }
  }

  const decodeFarm = async (txid, provider, beanstalkAbi, beanContract) => {
    const tx = await provider.getTransaction(txid);
    
    var decodedCallData = ethers.getBytes(tx.data);
    var selector = decodedCallData.slice(0, 4);
    var selectorHex = ethers.toQuantity(selector);

    var funcName = await getFunctionNameFromSelector(selectorHex, beanstalkAbi);

    if (funcName == "farm(bytes[])") {
      //decode calldata in tx.data
      var decodedCallData = beanContract.interface.decodeFunctionData("farm", tx.data)[0][0];

      fullArgumentCallAsString = decodeFarmData(decodedCallData, txid, beanstalkAbi, beanContract);
      return fullArgumentCallAsString;
    } else {
      return "not a farm function " + txid;
    }
  };


  const makeConvertPretty = (convertData) => {
    //from the packed convertData, pull out first uint256
    convertData = ethers.getBytes(convertData);
    
    //get first uint256
    var firstUint = convertData.slice(0, 32);
    //convert from raw bytes to hex
    firstUint = ethers.hexlify(firstUint);
    //convert from hex to number
    firstUint = BigInt(firstUint);
    //convert firstUint to regular JS number
    firstUint = Number(firstUint);

    var prettyString = 'type = ' + getConvertKindString(firstUint);

    var typesAndNames = getTypesAndNamesFromConvertData(firstUint);

    //loop through typesAndNames, if it's a uint256, convert it to a string
    //if it's an address, convert it to a string
    for (var i = 1; i < typesAndNames.length; i++) {
        var type = typesAndNames[i][0];
        var name = typesAndNames[i][1];
        prettyString += ' ';
        if (type == 'uint256') {
            var amount = convertData.slice(32 * i, 32 * (i + 1));
            amount = BigInt(ethers.hexlify(amount));
            //format to 1e6 if name contains Bean
            if (name.includes('Bean')) {
                amount = ethers.formatUnits(amount.toString(), 6);
            }
            //format 1e6 if name includes LP
            if (name.includes('LP')) {
                amount = ethers.formatUnits(amount.toString(), 6);
            }
            amount = Number(amount);
            // console.log('uint256: ', amount);
            prettyString += name + ' = ' + amount.toString();
        } else if (type == 'address') {
            var address = convertData.slice(32 * i, 32 * (i + 1));
            address = ethers.hexlify(address);
            // console.log('address: ', address);
            prettyString += name + ' = ' + address;
        }
    }

    return prettyString;
}

const getTypesAndNamesFromConvertData = (convertKind) => {
  switch(convertKind) {
      case 0:
          return [["uint256", "CURVE_LP_TO_BEANS"], ["uint256", "amountLP"], ["uint256", "minBeans"], ["address", "pool"]];
      case 1:
          return [["uint256", "BEANS_TO_CURVE_LP"], ["uint256", "amountBeans"], ["uint256", "minLP"], ["address", "pool"]];
      case 2:
          return [["uint256", "UNRIPE_LP_TO_BEANS"], ["uint256", "amountLP"], ["uint256", "minBeans"]];
      case 3:
          return [["uint256", "UNRIPE_BEANS_TO_LP"], ["uint256", "amountBeans"], ["uint256", "minLP"]];
      case 5:
          return [["uint256", "BEANS_TO_WELL_LP"], ["uint256", "amountBeans"], ["uint256", "minLP"], ["address", "pool"]];
      case 6:
          return [["uint256", "WELL_LP_TO_BEANS"], ["uint256", "amountLP"], ["uint256", "minBeans"], ["address", "pool"]];
      default:
          return "UNKNOWN";
  }
}

const getConvertKindString = (convertKind) => {
  switch(convertKind) {
      case 0:
          return "BEANS_TO_CURVE_LP";
      case 1:
          return "CURVE_LP_TO_BEANS";
      case 2:
          return "UNRIPE_BEANS_TO_LP";
      case 3:
          return "UNRIPE_LP_TO_BEANS";
      case 4:
          return "LAMBDA_LAMBDA";
      case 5:
          return "BEANS_TO_WELL_LP";
      case 6:
          return "WELL_LP_TO_BEANS";
      default:
          return "UNKNOWN";
  }
}

module.exports = {
    decodeFarm,
    decodeFarmData
}