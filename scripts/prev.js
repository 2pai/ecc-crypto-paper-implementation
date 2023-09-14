// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const fs = require('fs')
async function main() {


  const _secretURI = 'ipfs://QmbKL9bNuuVjCSERDEQTA81xZ64F59deLBETYCZFeZpyu1/'; 
  const _md5FileHash = 'a4400066b4fc8c7d9538bcb9e94aa2f3'; 
  const _price = hre.ethers.utils.parseEther("1");
  const _author = '0x0000000000000000000000000000000000000012'; 
  const _authorBps = '5000';

  const RoyaltyContract = await hre.ethers.getContractFactory("PRoyaltyContract");
  const royaltycontract = await RoyaltyContract.deploy(
    _secretURI, 
    _md5FileHash,  
    _price,
    _author,  
    _authorBps, 
  );

  await royaltycontract.deployed();
  console.log(
    `RoyaltyContract has been deployed to ${royaltycontract.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
