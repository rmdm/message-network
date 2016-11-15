var inherits = require('util').inherits

module.exports = BaseError

inherits(BaseError, Error)

function BaseError (message, data) {
    Error.call(this, message)
    this.name = 'BaseError'
    this.message = message
    this.data = data
}
