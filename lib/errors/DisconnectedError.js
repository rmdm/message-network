var inherits = require('util').inherits
var BaseError = require('./BaseError')

module.exports = DisconnectedError

inherits(DisconnectedError, BaseError)

function DisconnectedError (message, data) {
    BaseError.call(this, message, data)
    this.name = 'DisconnectedError'
}
