const crypto = require('crypto')
const eliptic = require('elliptic')
const BN = require('bn.js')
const fs = require('fs');
const { btoa } = require('buffer');
const { base64 } = require('ethers/lib/utils');
const ec = new eliptic.ec('secp256k1');

const G = ec.g;
const N = ec.n;

const metadata = fs.readFileSync('./privateKey.json','utf8')

let {privateKey, k} = JSON.parse(metadata)


privateKey = new BN(privateKey,16)
k = new BN(k,16)


const publicKey = G.mul(privateKey)

const encrypt = (pub, messages) => {
    const result = messages.map(msgPoint => {
        /*
            To encrypt, we use elgamal crypto
            the equation:
                𝐶1 = 𝑘.𝐺
                𝐶2 = 𝑀 + 𝑘.Q
            M = point of char in ec
            Q = public key
        */
        C1 = G.mul(k)
        C2 = msgPoint.add(pub.mul(k))
        return {
            C1,
            C2
        }
    })
    return result
}
function decrypt(msgPoint, privKey) {
    const solution = msgPoint.map(point => {
        const {C1, C2} = point
        /*
            Message = C2 - d.C1 where d = private key
            for subtracting, use equation 𝑃 – 𝑄 = 𝑃 + (−𝑄)
        */
        return C2.add(C1.mul(privKey).neg())
    })
    return solution
}

const ascii = (c) => c.charCodeAt(0)+1;
const arrAsciiToText = (c) => c.reduce((a,b) => a + String.fromCharCode(b-1), '')
const strToArrayAscii = (str) => str.split('').map(c => (ascii(c)))

const encode = (str) => {
    const strAscii = strToArrayAscii(str)
    /*
        In mapping string to the curve, we convert the string input to ascii char.
        For every char, we increment the value by +1 and multiply the value with G.
        The result of multiplication is return as an object and stored as array
    */
    const strPoint = strAscii.map(c => {
        return G.mul(c)
    })

    return strPoint;
}
const decode = (strPoint) => {

    /*
        Initiate ascii table that conduct X,Y by multiplying G point with n 
        where n is 1..255, we modify the ascii by starting index from 1 to avoid
        G.mul(0) that return infinity.  
    */
    const pointTable = [...Array(255).keys()].map(pt => {
        const p = pt + 1
        const point = G.mul(p)
        return {x:point.getX().toString(),y:point.getY().toString(), point: p}
    })
    /*
        Check the x,y on ascii table and return the point as return.
    */ 
    const asciiMap = strPoint.map(c => {
        let result 
        pointTable.map(k => {
        if(k.x == c.getX().toString() && k.y == c.getY().toString()) {
            result = k.point
        } 
       })
       return result
    })

    return arrAsciiToText(asciiMap)
}

function serialize(points) {
    const result = points.map(res => {

        return {C1: {x: res.C1.getX(), y: res.C1.getY()}, C2:{x: res.C2.getX(),y: res.C2.getY()}}
    })
    return Buffer.from(JSON.stringify({data:result,n:points.length})).toString('base64')
}
function deserialize (encoded) {
    const decodedData = new Buffer.from(encoded,'base64').toString()
    const {data, n} = JSON.parse(decodedData)
    const points = data.map(r => {
        const {C1, C2} = r
        return {
            C1: ec.curve.point(
                new BN(C1.x,16),
                new BN(C1.y,16)
            ),
            C2: ec.curve.point(
                new BN(C2.x,16),
                new BN(C2.y,16)
            )
        }
    })
    return points
}
const ipfsURI = 'ipfs://QmbKL9bNuuVjCSERDEQTA81xZ64F59deLBETYCZFeZpyu1/'
const ecd = encode(ipfsURI)

const encrypted = encrypt(publicKey, ecd)
const serialized = serialize(encrypted)
fs.writeFileSync('metadata.json', JSON.stringify({metadata:serialized}))
console.log('done metadata.json')