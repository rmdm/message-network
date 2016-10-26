var Node = require('./Node')
var inherits = require('util').inherits

module.exports = Gate

inherits(Gate, Node)

function Gate () {
    if (!(this instanceof Gate)) {
        return new Gate()
    }
    Node.call(this)
}

Gate.prototype.transfer = function (data) {
    throw new Error('"transfer" method is not implimented.')
}
