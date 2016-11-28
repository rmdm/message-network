'use strict'

import { inherits } from 'util'
import BaseError from './BaseError'

export default DisconnectedError

inherits(DisconnectedError, BaseError)

function DisconnectedError (message, data) {
    BaseError.call(this, message, data)
    this.name = 'DisconnectedError'
}
