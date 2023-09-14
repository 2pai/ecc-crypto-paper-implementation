const contract = require("./contract.js")

module.exports = async (req, res) => {
    const result = await contract.getOrderActive()
    return res.json(result)
}