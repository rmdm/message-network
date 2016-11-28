'use strict'

import { inherits } from 'util'

export default BaseError

inherits(BaseError, Error)

function BaseError (message, data) {
    Error.call(this, message)
    this.name = 'BaseError'
    this.message = message
    this.data = data
}
