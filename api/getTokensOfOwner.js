const contract = require("./contract.js")

module.exports = async (req, res) => {
    const {owner} = req.query
    const result = await contract.getTokenOfOwner(owner)
    return res.json(result)
}