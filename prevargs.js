const hre = require("hardhat");
const fs = require('fs')
const {metadata} = JSON.parse(fs.readFileSync('metadata.json'))

const _secretURI = 'ipfs://QmbKL9bNuuVjCSERDEQTA81xZ64F59deLBETYCZFeZpyu1/';
const _md5FileHash = 'a4400066b4fc8c7d9538bcb9e94aa2f3'; 
const _price = hre.ethers.utils.parseEther("1");
const _author = '0x0000000000000000000000000000000000000012'; 
const _authorBps = '5000';

module.exports = [
    _secretURI, 
    _md5FileHash,  
    _price,
    _author,  
    _authorBps,  
]