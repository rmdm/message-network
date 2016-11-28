'use strict'

import { inherits } from 'util'
import BaseError from './BaseError'

export default TimeoutError

inherits(TimeoutError, BaseError)

function TimeoutError (message, data) {
    BaseError.call(this, message, data)
    this.name = 'TimeoutError'
}
