/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("hardhat-tracer")
module.exports = {
  solidity: "0.7.3",
  networks: {
    hardhat: {
      blockGasLimit: 7000000000000000,
    }
  }
};
