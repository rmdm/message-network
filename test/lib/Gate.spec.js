describe('Gate class', function () {

    var assert = require('assert')
    var Gate = require('../../lib/Gate')

    describe('transfer method', function () {

        it('throws an error', function () {
            var gate = Gate()

            assert.throws(function () {
                gate.transfer({})
            })
        })

    })

})
