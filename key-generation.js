const crypto = require('crypto')
const eliptic = require('elliptic')
const BN = require('bn.js')
const fs = require('fs')
const ec = new eliptic.ec('secp256k1');

const N = ec.n;

let privateKey, k
do {
    privateKey = new BN(crypto.randomBytes(Math.ceil(N.bitLength() / 8)))
    k = new BN(crypto.randomBytes(Math.ceil(N.bitLength() / 8)))
    fs.writeFileSync('privateKey.json',JSON.stringify({privateKey,k}))

} while (privateKey.isZero() || k.isZero() || privateKey.cmp(N) >= 0)

