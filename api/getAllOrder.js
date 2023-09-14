const contract = require("./contract.js")

module.exports = async (req, res) => {
    const result = await contract.getAllOrder()
    return res.json(result)
}