var inherits = require('util').inherits
var BaseError = require('./BaseError')

module.exports = TimeoutError

inherits(TimeoutError, BaseError)

function TimeoutError (message, data) {
    BaseError.call(this, message, data)
    this.name = 'TimeoutError'
}
