'use strict'

import assert from 'assert'
import sinon from 'sinon'
import HandlersMap from '../../../lib/util/HandlersMap'

describe('HandlersMap class', function () {

    var map

    beforeEach(function () {
        map = new HandlersMap
    })

    describe('add method', function () {

        it('throws when passed params has no "as" param', function () {
            var success = sinon.spy()

            assert.throws(function () {
                map.add({
                    to: 'node',
                    topic: 'topic',
                    success: success,
                })
            })
        })

        it('throws when passed "as" param is not a string', function () {
            var success = sinon.spy()

            assert.throws(function () {
                map.add({
                    as: 103,
                    to: 'node',
                    topic: 'topic',
                    success: success,
                })
            })
        })

        it('throws when passed params has no "to" param', function () {
            var success = sinon.spy()

            assert.throws(function () {
                map.add({
                    as: 'gate',
                    topic: 'topic',
                    success: success,
                })
            })
        })

        it('throws when passed params has no "topic" param', function () {
            var success = sinon.spy()

            assert.throws(function () {
                map.add({
                    as: 'gate',
                    to: 'node',
                    success: success,
                })
            })
        })

        it('throws when passed params has no "handler" param', function () {
            assert.throws(function () {
                map.add({
                    as: 'gate',
                    to: 'node',
                    topic: 'topic',
                })
            })
        })

        it('registers a notification handler listening on a gate', function () {
            var success = function () {}
            var error = function () {}

            map.add({
                as: 'progressbar',
                to: {
                    gate: 'server',
                    node: 'task',
                },
                topic: 'progress',
                success: success,
                error: error,
            })

            assert(checkMap(map.gates, {
                'server': {
                    'task': {
                        'progressbar': {
                            'progress': [
                                {
                                    key: success,
                                    value: error,
                                }
                            ],
                        }
                    }
                }
            }))
        })

        it('registers a notification handler listening on a node', function () {
            var success = function () {}

            map.add({
                as: 'progressbar',
                to: 'task',
                topic: 'progress',
                success: success,
            })

            assert(checkMap(map.nodes, {
                'task': {
                    'progressbar': {
                        'progress': [
                            {
                                key: success,
                                value: undefined
                            }
                        ],
                    }
                }
            }))
            assert(checkMap(map.gates, {}))
        })

        it('registers many notification handlers listening on gates', function () {
            var success = function () {}

            map.add({
                as: 'progressbar',
                to: [
                    {
                        gate: 'server',
                        node: 'process',
                    },
                    {
                        gate: 'client',
                        node: 'task',
                    },
                    'loader',
                ],
                topic: 'progress',
                success: success,
            })

            assert(checkMap(map.gates, {
                'server': {
                    'process': {
                        'progressbar': {
                            'progress': [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                },
                'client': {
                    'task': {
                        'progressbar': {
                            'progress': [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                }
            }))
            assert(checkMap(map.nodes, {
                'loader': {
                    'progressbar': {
                        'progress': [
                            {
                                key: success,
                                value: undefined
                            }
                        ],
                    }
                }
            }))
        })

        it('registers many gate node handlers', function () {
            var success = function () {}

            map.add({
                as: 'progressbar',
                to: [
                    {
                        gate: ['server', 'client'],
                        node: ['task', 'process'],
                    },
                ],
                topic: 'progress',
                success: success,
            })

            assert(checkMap(map.gates, {
                'server': {
                    'process': {
                        'progressbar': {
                            'progress': [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                    'task': {
                        'progressbar': {
                            'progress': [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                },
                'client': {
                    'process': {
                        'progressbar': {
                            'progress': [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                    'task': {
                        'progressbar': {
                            'progress': [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                }
            }))
            assert(checkMap(map.nodes, {}))
        })

        it('registers notification handler on many topics', function () {
            var success = function () {}

            map.add({
                as: 'a',
                to: 'b',
                topic: ['c', 'd'],
                success: success,
            })

            assert(checkMap(map.nodes, {
                'b': {
                    'a': {
                        'c': [
                            {
                                key: success,
                                value: undefined
                            }
                        ],
                        'd': [
                            {
                                key: success,
                                value: undefined
                            }
                        ],
                    }
                }
            }))
            assert(checkMap(map.gates, {}))
        })

        it('registers notification handler on many topics', function () {
            var success = function () {}

            map.add({
                as: 'a',
                to: 'b',
                topic: ['c', 'd'],
                success: success,
            })

            assert(checkMap(map.nodes, {
                'b': {
                    'a': {
                        'c': [
                            {
                                key: success,
                                value: undefined,
                            }
                            ],
                        'd': [
                            {
                                key: success,
                                value: undefined,
                            }
                            ],
                    }
                }
            }))
            assert(checkMap(map.gates, {}))
        })

        it('registers notification handler on all topics', function () {
            var success = function () {}

            map.add({
                as: 'a',
                to: 'b',
                topic: 'c',
                success: success,
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: '*',
                success: success,
            })

            assert(checkMap(map.nodes, {
                'b': {
                    'a': {
                        'c': [
                            {
                                key: success,
                                value: undefined
                            }
                        ],
                        '*': [
                            {
                                key: success,
                                value: undefined
                            }
                        ]
                    }
                }
            }))
            assert(checkMap(map.gates, {}))

        })

    })

    describe('exec method', function () {

        it('throws when passed params has no "as" param', function () {
            assert.throws(function () {
                map.exec({
                    to: 'node',
                    topic: 'topic',
                })
            })
        })

        it('throws when passed params has no "to" param', function () {
            assert.throws(function () {
                map.exec({
                    as: 'gate',
                    topic: 'topic',
                })
            })
        })

        it('throws when passed params has no "topic" param', function () {
            assert.throws(function () {
                map.exec({
                    as: 'gate',
                    to: 'node',
                })
            })
        })

        it('calls handlers of a single destination', function (done) {
            var success = sinon.spy(function () {
                assert.equal(success.firstCall.args[0], 50);
                done()
            })

            map.add({
                as: 'progressbar',
                to: 'task',
                topic: 'progress',
                success: success,
            })

            map.exec({
                as: 'task',
                to: 'progressbar',
                topic: 'progress',
                data: 50,
            }, {
                gates: {},
                nodes: {
                    task: {},
                    progressbar: {}
                }
            })

        })

        it('calls handlers of multiple destinations', function (done) {

            var success = sinon.spy(function () {
                assert(success.calledWithMatch(50, {
                    sender: { node: 'task' },
                    topic: 'progress',
                }))
                if (anotherSuccess.called) { done() }
            })
            var anotherSuccess = sinon.spy(function () {
                assert(anotherSuccess.calledWithMatch(50, {
                    sender: { node: 'task' },
                    topic: 'progress',
                }))
                if (success.called) { done() }
            })

            map.add({
                as: 'progressbar',
                to: 'task',
                topic: 'progress',
                success: success,
            })

            map.add({
                as: 'anotherProgressbar',
                to: 'task',
                topic: 'progress',
                success: anotherSuccess,
            })

            map.exec({
                as: 'task',
                to: ['progressbar', 'anotherProgressbar'],
                topic: 'progress',
                data: 50,
            }, {
                gates: {},
                nodes: {
                    task: {},
                    progressbar: {},
                    anotherProgressbar: {},
                }
            })

        })

        it('calls handlers of a single destinations listening on all topics and one specific', function () {
            var success = sinon.spy(function () {
                assert(success.called)
                if (anotherSuccess.called) { return done }
            })
            var anotherSuccess = sinon.spy(function () {
                assert(anotherSuccess.called)
                if (success.called) { return done }
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: ['c'],
                success: success,
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: '*',
                success: anotherSuccess,
            })

            map.exec({
                as: 'b',
                to: 'a',
                topic: 'c',
            }, {
                gates: {},
                nodes: {
                    a: {},
                    b: {},
                }
            })

        })

        it('calls handlers of a single destination no more than once per exec', function (done) {

            var success = sinon.spy(function () {
                setTimeout(function () {
                    assert(success.calledOnce)
                    done()
                }, 10)
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: ['c'],
                success: success,
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: '*',
                success: success,
            })

            map.exec({
                as: 'b',
                to: 'a',
                topic: 'c',
            }, {
                gates: {},
                nodes: {
                    a: {},
                    b: {},
                },
            })
        })

        it('calls handlers of different destinations', function (done) {

            var timeoutSet = false
            var success = sinon.spy(function () {
                if (timeoutSet) { return }
                timeoutSet = true
                setTimeout(function () {
                    assert(success.calledTwice)
                    done()
                }, 10)
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: ['c'],
                success: success,
            })

            map.add({
                as: 'c',
                to: 'b',
                topic: '*',
                success: success,
            })

            map.exec({
                as: 'b',
                to: ['a', 'c'],
                topic: 'c',
            }, {
                gates: {},
                nodes: {
                    a: {},
                    b: {},
                    c: {},
                },
            })
        })

        it('calls handlers of different destinations once per destination per exec', function (done) {

            var timeoutSet = false
            var success = sinon.spy(function () {
                if (timeoutSet) { return }
                timeoutSet = true
                setTimeout(function () {
                    assert(success.calledTwice)
                    done()
                }, 10)
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: ['c', 'c'],
                success: success,
            })

            map.add({
                as: 'c',
                to: 'b',
                topic: '*',
                success: success,
            })

            map.exec({
                as: 'b',
                to: ['a', 'c', '*', 'c', 'c', 'a'],
                topic: 'c',
            }, {
                gates: {},
                nodes: {
                    a: {},
                    b: {},
                    c: {},
                },
            })
        })

        it('calls handlers of different gate and node destinations once per destination per exec', function (done) {

            var timeoutSet = false
            var success = sinon.spy(function () {
                if (timeoutSet) { return }
                timeoutSet = true
                setTimeout(function () {
                    assert.equal(success.args.length, 4)
                    done()
                }, 10)
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: ['c', 'c'],
                success: success,
            })

            map.add({
                as: 'c',
                to: 'b',
                topic: '*',
                success: success,
            })

            map.add({
                as: 'x',
                to: 'b',
                topic: 'c',
                success: success,
            })

            map.add({
                as: 'y',
                to: 'b',
                topic: 'c',
                success: function () {},
            })

            map.add({
                as: 'z',
                to: 'b',
                topic: 'c',
                success: function () {},
            })

            map.exec({
                as: 'b',
                to: [
                    'a', 'c', '*', 'c', 'c', 'a',
                    {
                        gate: 'x',
                        node: 'a',
                    },
                    {
                        gate: '*',
                        node: 'b',
                    },
                    {
                        gate: ['x', 'y', 'z', '*'],
                        node: ['a'],
                    },
                    {
                        gate: 'x',
                        node: ['a', 'b'],
                    }
                ],
                topic: 'c',
            }, {
                gates: {
                    x: {},
                    y: {},
                    z: {},
                },
                nodes: {
                    a: {},
                    c: {},
                    b: {},
                    x: {},
                    y: {},
                    z: {},
                },
            })
        })

        it('calls handler of a single destination listening on a gate', function (done) {
            var success = sinon.spy(function () {
                assert(success.calledWithMatch(undefined, {
                    sender: {
                        gate: 'g',
                        node: 'b',
                    },
                    topic: 'e',
                }))
                done()
            })

            map.add({
                as: 'a',
                to: {
                    gate: 'g',
                    node: 'b',
                },
                topic: 'e',
                success: success,
            })

            map.exec({
                as: {
                    gate: 'g',
                    node: 'b',
                },
                to: 'a',
                topic: 'e',
            }, {
                gates: {
                    g: {},
                },
                nodes: {
                    a: {},
                    g: {},
                }
            })

        })

        it('calls exec error handler if called node is not registered', function (done) {

            map.add({
                as: 'other_node',
                to: 'node',
                topic: 'msg',
                success: function () {},
            })

            map.exec({
                as: 'node',
                to: 'other_node',
                topic: 'msg',
                error: function (error, context) {
                    assert.equal(error.name, 'DisconnectedError')
                    assert.deepEqual(error.data, {remote: true})
                    done()
                },
            }, {
                gates: {},
                nodes: {
                    node: {},
                },
            })

        })

        it('calls exec error handler if called node is not responding within specifid timeout', function (done) {

            map.add({
                as: 'other_node',
                to: 'node',
                topic: 'msg',
                success: function (data, context) {
                    setTimeout(context.reply, 40)
                },
            })

            map.exec({
                as: 'node',
                to: 'other_node',
                topic: 'msg',
                success: function () {
                    done(new Error('Should not be called.'))
                },
                error: function (error, context) {
                    assert.equal(error.name, 'TimeoutError')
                    assert.deepEqual(error.data, {timeout: 20})
                    done()
                },
                options: {
                    timeout: 20,
                }
            }, {
                gates: {},
                nodes: {
                    node: {},
                    other_node: {},
                },
            })

        })

        it('calls exec success handler if called node is responding within specifid timeout', function (done) {

            map.add({
                as: 'other_node',
                to: 'node',
                topic: 'msg',
                success: function (data, context) {
                    context.reply()
                },
            })

            map.exec({
                as: 'node',
                to: 'other_node',
                topic: 'msg',
                success: function () {
                    setTimeout(done, 10)
                },
                error: function (error, context) {
                    done(new Error('Should not be called'))
                },
                options: {
                    timeout: 20,
                }
            }, {
                gates: {},
                nodes: {
                    node: {},
                    other_node: {},
                },
            })

        })

        it('calls reply error handler if replied node is not responding within specifid timeout', function (done) {

            map.add({
                as: 'other_node',
                to: 'node',
                topic: 'msg',
                success: function (data, context) {
                    context.reply(data, {
                        success: function () {
                            done(new Error('Should not be called'))
                        },
                        error: function (error) {
                            assert.equal(error.name, 'TimeoutError')
                            assert.deepEqual(error.data, {timeout: 20})
                            done()
                        },
                        options: {
                            timeout: 20,
                        }
                    })
                },
            })

            map.exec({
                as: 'node',
                to: 'other_node',
                topic: 'msg',
            }, {
                gates: {},
                nodes: {
                    node: {},
                    other_node: {},
                },
            })

        })

        it('calls handlers of multiple destinations by broadcast exec', function (done) {
            var success = sinon.spy(function () {
                assert(success.called)
                if (anotherSuccess.called) { done() }
            })
            var anotherSuccess = sinon.spy(function () {
                assert(anotherSuccess.called)
                if (success.called) { done() }
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: 'e',
                success: success,
            })

            map.add({
                as: 'c',
                to: 'b',
                topic: 'e',
                success: anotherSuccess,
            })

            map.exec({
                as: 'b',
                to: '*',
                topic: 'e',
                data: 'smth',
            }, {
                gates: {},
                nodes: {
                    a: {},
                    b: {},
                    c: {},
                }
            })

        })

        it('calls all handlers on broadcast exec', function (done) {

            var success = sinon.spy(function () {
                assert(success.calledWithMatch('smth', {
                    sender: {
                        node: 'b',
                    },
                    topic: 'e',
                }))
                done()
            })

            map.add({
                as: 'a',
                to: '*',
                topic: 'e',
                success: success,
            })

            map.exec({
                as: 'b',
                to: '*',
                topic: 'e',
                data: 'smth',
            }, {
                gates: {},
                nodes: {
                    a: {},
                    b: {},
                },
            })

        })

        it('calls only gate destination handlers', function (done) {
            var success = sinon.spy(function () {
                assert(success.calledWithMatch({
                    node: 'a',
                    data: undefined
                }, {
                    sender: {
                        node: 'b',
                    },
                    topic: 'e',
                }))
                assert(!anotherSuccess.called)
                done()
            })

            var anotherSuccess = sinon.spy(function () {
                assert(!anotherSuccess.called)
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: 'e',
                success: anotherSuccess,
            })

            map.add({
                as: 'g',
                to: 'b',
                topic: 'e',
                success: success,
            })

            map.exec({
                as: 'b',
                to: {
                    gate: '*',
                    node: 'a',
                },
                topic: 'e',
            }, {
                gates: {
                    g: {},
                },
                nodes: {
                    a: {},
                    b: {},
                    g: {},
                },
            })

        })

        it('calls exec success handler on reply from listening handler', function (done) {
            var execSuccess = sinon.spy(function () {
                assert(execSuccess.calledWithMatch(15, {
                    topic: 'sum',
                    sender: {
                        node: 'calculator',
                    },
                }))
                done()
            })

            var addSuccess = function sum (data, context) {
                var result = 0
                result = data.reduce(function (result, operand) {
                    result += operand
                    return result
                }, result)
                context.reply(result)
            }

            map.add({
                as: 'calculator',
                to: 'scientist',
                topic: 'sum',
                success: addSuccess,
            })

            map.exec({
                as: 'scientist',
                to: 'calculator',
                topic: 'sum',
                data: [1, 2, 3, 4, 5],
                success: execSuccess,
            }, {
                gates: {},
                nodes: {
                    calculator: {},
                    scientist: {},
                }
            })

        })

        it('makes chat', function (done) {

            var chat = []

            var counter = 0

            map.add({
                as: 'ping',
                to: 'pong',
                topic: 'turn',
                success: function (data, context) {
                    chat.push({
                        node: 'ping',
                        counter: counter++,
                    })
                    context.reply()
                }
            })

            map.exec({
                as: 'pong',
                to: 'ping',
                topic: 'turn',
                success: function (data, context) {
                    chat.push({
                        node: 'pong',
                        counter: counter++
                    })
                    if (counter <= 5) {
                        return context.reply()
                    }
                    map.exec({
                        as: 'pong',
                        to: 'test',
                        topic: 'done',
                    }, {
                        gates: {},
                        nodes: {
                            ping: {},
                            pong: {},
                            test: {},
                        },
                    })
                },
            }, {
                gates: {},
                nodes: {
                    ping: {},
                    pong: {},
                    test: {},
                },
            })

            map.add({
                as: 'test',
                to: '*',
                topic: 'done',
                success: function () {
                    assert.deepEqual(chat, [
                        { node: 'ping', counter: 0, },
                        { node: 'pong', counter: 1, },
                        { node: 'ping', counter: 2, },
                        { node: 'pong', counter: 3, },
                        { node: 'ping', counter: 4, },
                        { node: 'pong', counter: 5, },
                    ])
                    done()
                },
            })

        })

        it('set all callbacks bound to respective nodes of the chat', function (done) {

            var nodes = {
                ping: {},
                pong: {},
                test: {},
            }

            map.add({
                as: 'ping',
                to: 'pong',
                topic: 'turn',
                success: function (data, context) {
                     // 1)
                    assert.equal(this, nodes.ping)
                    context.reply({}, {
                        success: function (data, context) {
                             // 3)
                            assert.equal(this, nodes.ping)
                            context.refuse({}, {
                                error: function (data, context) {
                                     // 5)
                                    assert.equal(this, nodes.ping)
                                    context.reply()
                                }
                            })
                        },
                    })
                }
            })

            map.exec({
                as: 'pong',
                to: 'ping',
                topic: 'turn',
                success: function (data, context) {
                     // 2)
                    assert.equal(this, nodes.pong)
                    context.reply({}, {
                        success: function (data, context) {
                             // not called
                            assert.equal(this, nodes.pong)
                        },
                    })

                },
                error: function (data, context) {
                     // 4)
                    assert.equal(this, nodes.pong)
                    context.refuse({}, {
                        success: function (data, context) {
                            assert.equal(this, nodes.pong)
                            map.exec({
                                as: 'pong',
                                to: 'test',
                                topic: 'done',
                            }, {
                                gates: {},
                                nodes: nodes,
                            })
                        }
                    })
                }
            }, {
                gates: {},
                nodes: nodes,
            })

            map.add({
                as: 'test',
                to: '*',
                topic: 'done',
                success: function () {
                    done()
                },
            })

        })

        it('redefines gate destination reply handler in series', function (done) {

            var options = {
                gates: {
                    gate: {},
                },
                nodes: {
                    node: {},
                    gate: {},
                    test: {},
                },
            }

            var thirdSuccess = sinon.spy(function () {
                map.exec({
                    as: 'gate',
                    to: 'test',
                    topic: 'done',
                }, options)
            })
            var secondSuccess = sinon.spy(function (data, context) {
                context.reply(null, {success: thirdSuccess})
            })
            var firstSuccess = sinon.spy(function (data, context) {
                context.reply(null, {success: secondSuccess})
            })

            map.add({
                as: 'gate',
                to: 'node',
                topic: 'test',
                success: firstSuccess,
            })

            map.exec({
                as: 'node',
                to: {
                    gate: 'gate',
                    node: 'gatenode',
                },
                topic: 'test',
                data: null,
                success: function (data, context) {
                    context.reply(null)
                },
            }, options)

            map.add({
                as: 'test',
                to: '*',
                topic: 'done',
                success: function () {
                    assert(firstSuccess.calledWithMatch({
                        data: null,
                        node: 'gatenode'
                    }, {
                        sender: {
                            node: 'node',
                        },
                        topic: 'test',
                    }))
                    assert(secondSuccess.calledWithMatch({
                        data: null,
                        node: 'gatenode'
                    }, {
                        sender: {
                            node: 'node',
                        },
                        topic: 'test',
                    }))
                    assert(thirdSuccess.calledWithMatch({
                        data: null,
                        node: 'gatenode'
                    }, {
                        sender: {
                            node: 'node',
                        },
                        topic: 'test',
                    }))
                    done()
                },
            })

        })

        it('calls handler bound to listening destination', function (done) {
            var node = {}

            map.add({
                as: 'node',
                to: 'other_node',
                topic: 'smth',
                success: function () {
                    assert.equal(this, node)
                    done()
                }
            })

            map.exec({
                as: 'other_node',
                to: 'node',
                topic: 'smth',
            }, {
                gates: {},
                nodes: {
                    node: node,
                    other_node: {},
                }
            })

        })

        it('calls exec success handler bound to source', function (done) {
            var other_node = {}

            map.add({
                as: 'node',
                to: 'other_node',
                topic: 'smth',
                success: function (data, context) {
                    context.reply()
                }
            })

            map.exec({
                as: 'other_node',
                to: 'node',
                topic: 'smth',
                success: function () {
                    assert.equal(this, other_node)
                    done()
                }
            }, {
                gates: {},
                nodes: {
                    node: {},
                    other_node: other_node,
                }
            })

        })

        it('calls exec error handler bound to source', function (done) {
            var other_node = {}

            map.add({
                as: 'node',
                to: 'other_node',
                topic: 'smth',
                success: function (data, context) {
                    context.refuse()
                }
            })

            map.exec({
                as: 'other_node',
                to: 'node',
                topic: 'smth',
                error: function () {
                    assert.equal(this, other_node)
                    done()
                }
            }, {
                gates: {},
                nodes: {
                    node: {},
                    other_node: other_node,
                },
            })

        })

        it('calls reply success handler bound to destination', function (done) {
            var node = {}

            map.add({
                as: 'node',
                to: 'other_node',
                topic: 'smth',
                success: function (data, context) {
                    context.reply({}, {
                        success: function () {
                            assert.equal(this, node)
                            done()
                        }
                    })
                }
            })

            map.exec({
                as: 'other_node',
                to: 'node',
                topic: 'smth',
                success: function (data, context) {
                    context.reply()
                }
            }, {
                gates: {},
                nodes: {
                    node: node,
                    other_node: {},
                },
            })

        })

        it('calls reply error handler bound to listening node instance', function (done) {
            var node = {}

            map.add({
                as: 'node',
                to: 'other_node',
                topic: 'smth',
                success: function (data, context) {
                    context.reply({}, {
                        error: function () {
                            assert.equal(this, node)
                            done()
                        }
                    })
                }
            })

            map.exec({
                as: 'other_node',
                to: 'node',
                topic: 'smth',
                success: function (data, context) {
                    context.refuse()
                }
            }, {
                gates: {},
                nodes: {
                    node: node,
                    other_node: {},
                },
            })

        })

        it('calls reply error handler bound to listening node instance even after disconnect', function (done) {
            var nodes = {
                node: {},
                other_node: {},
            }

            map.add({
                as: 'node',
                to: 'other_node',
                topic: 'smth',
                success: function (data, context) {
                    delete nodes.other_node
                    context.reply({}, {
                        error: function () {
                            assert.equal(this, nodes.node)
                            done()
                        }
                    })
                }
            })

            map.exec({
                as: 'other_node',
                to: 'node',
                topic: 'smth',
                success: function (data, context) {
                    context.reply()
                }
            }, {
                gates: {},
                nodes: nodes,
            })

        })

        it('guarantees to call exec success and error handlers only once', function (done) {
            var success = sinon.spy()
            var error = sinon.spy()

            map.add({
                as: 'node',
                to: 'other_node',
                topic: 'smth',
                success: function (data, context) {
                    context.reply()
                    context.refuse()
                    context.reply()
                    context.refuse()
                    context.reply()
                    context.refuse()
                    context.reply()
                    context.refuse()
                    context.reply()
                    context.refuse()
                    setTimeout(function () {
                        assert(success.calledOnce)
                        assert(!error.called)
                        done()
                    }, 10)
                }
            })

            map.exec({
                as: 'other_node',
                to: 'node',
                topic: 'smth',
                success: success,
                error: error,
            }, {
                gates: {},
                nodes: {
                    node: {},
                    other_node: {},
                },
            })

        })

        it('guarantees to call exec error and success handlers only once', function (done) {
            var success = sinon.spy()
            var error = sinon.spy()

            map.add({
                as: 'node',
                to: 'other_node',
                topic: 'smth',
                success: function (data, context) {
                    context.refuse()
                    context.reply()
                    context.refuse()
                    context.reply()
                    context.refuse()
                    context.reply()
                    context.refuse()
                    context.reply()
                    context.refuse()
                    context.reply()
                    setTimeout(function () {
                        assert(error.calledOnce)
                        assert(!success.called)
                        done()
                    }, 10)
                }
            })

            map.exec({
                as: 'other_node',
                to: 'node',
                topic: 'smth',
                success: success,
                error: error,
            }, {
                gates: {},
                nodes: {
                    node: {},
                    other_node: {},
                },
            })

        })

        it('wraps all refuses as BaseError instance', function (done) {

            map.add({
                as: 'a',
                to: 'b',
                topic: 'c',
                success: function (data, context) {
                    if (data > 5) {
                        context.refuse({max: 5})
                    }
                }
            })

            map.exec({
                as: 'b',
                to: 'a',
                topic: 'c',
                data: 10,
                error: function (error) {
                    assert.equal(error.name, 'BaseError')
                    assert.deepEqual(error.data, {max: 5})
                    done()
                },
            }, {
                gates: {},
                nodes: {
                    a: {},
                    b: {},
                }
            })

        })

        it('wraps all refuse errors as BaseError instance', function (done) {

            map.add({
                as: 'a',
                to: 'b',
                topic: 'c',
                success: function (data, context) {
                    if (data > 5) {
                        context.refuse(new Error('greater than 5.'))
                    }
                }
            })

            map.exec({
                as: 'b',
                to: 'a',
                topic: 'c',
                data: 10,
                error: function (error) {
                    assert.equal(error.name, 'BaseError')
                    assert.deepEqual(error.message, 'greater than 5.')
                    done()
                },
            }, {
                gates: {},
                nodes: {
                    a: {},
                    b: {},
                }
            })

        })

        it('replies from reply error handler', function (done) {

            map.add({
                as: 'a',
                to: 'b',
                topic: 'e',
                success: function (data, context) {
                    context.reply(null, {
                        success: function () {
                            done()
                        },
                        error: function (data, context) {
                            context.reply(1)
                        },
                    })
                },
            })

            map.exec({
                as: 'b',
                to: 'a',
                topic: 'e',
                success: function (data, context) {
                    if (!data) { return context.refuse() }
                    context.reply()
                },
            }, {
                gates: {},
                nodes: {
                    a: {},
                    b: {},
                }
            })

        })

        it('throws when trying to send from one gate to another one', function () {
            var success = sinon.spy()

            map.add({
                as: 'a',
                to: '*',
                topic: '*',
                success: success,
            })

            assert.throws(function () {
                map.exec({
                    as: {
                        gate: 'a',
                        node: 'a',
                    },
                    to: {
                        gate: 'a',
                        node: 'a',
                    },
                    topic: 'e',
                }, {
                    gates: {
                        a: {},
                        a: {},
                    },
                    nodes: {
                        a: {},
                        a: {},
                    }
                })
            })
        })

        it('calls default listening node error handler on received error', function (done) {

            var success = sinon.spy()

            map.add({
                as: 'a',
                to: 'b',
                topic: 'e',
                success: function (data, context) {
                    context.reply()
                },
                error: function (error, context) {
                    done()
                },
            })

            map.exec({
                as: 'b',
                to: 'a',
                topic: 'e',
                success: function (data, context) {
                    context.refuse(4)
                },
            }, {
                gates: {},
                nodes: {
                    a: {},
                    b: {},
                }
            })

        })

    })

    describe('remove method', function () {

        var map, success

        beforeEach(function () {
            map = new HandlersMap()
            success = function () {}

            map.add({
                as: 'node',
                to: {
                    gate: ['a', 'b', 'c'],
                    node: ['x', 'y', 'z'],
                },
                topic: ['e'],
                success: success,
            })

        })

        it('removes some listeners by gate', function () {
            map.remove({
                as: 'node',
                to: {
                    gate: ['a', 'b'],
                },
            })

            assert(checkMap(map.gates, {
                c: {
                    x: {
                        node: {
                            e: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                    y: {
                        node: {
                            e: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                    z: {
                        node: {
                            e: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    }
                }
            }))
            assert(checkMap(map.nodes, {}))
        })

        it('removes some handlers by node', function () {
            map.remove({
                as: 'node',
                to: {
                    gate: ['a', 'b', 'c'],
                    node: ['x', 'z'],
                },
            })

            assert(checkMap(map.gates, {
                a: {
                    y: {
                        node: {
                            e: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                },
                b: {
                    y: {
                        node: {
                            e: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                },
                c: {
                    y: {
                        node: {
                            e: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                }
            }))
            assert(checkMap(map.nodes, {}))
        })

        it('removes some handlers by nodes', function () {
            map.remove({
                as: 'node',
                to: {
                    gate: ['a', 'b'],
                    node: ['x', 'z'],
                },
            })

            assert(checkMap(map.gates, {
                a: {
                    y: {
                        node: {
                            e: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                },
                b: {
                    y: {
                        node: {
                            e: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                },
                c: {
                    x: {
                        node: {
                            e: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                    y: {
                        node: {
                            e: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                    z: {
                        node: {
                            e: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                }
            }))

            assert(checkMap(map.nodes, {}))
        })

        it('removes some handlers by topic', function () {
            map.remove({
                as: 'node',
                to: {
                    gate: ['a', 'b', 'c'],
                    node: ['x', 'z'],
                },
                topic: 'e',
            })

            assert(checkMap(map.gates, {
                a: {
                    y: {
                        node: {
                            e: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                },
                b: {
                    y: {
                        node: {
                            e: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                },
                c: {
                    y: {
                        node: {
                            e: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                }
            }))
            assert(checkMap(map.nodes, {}))
        })

        it('removes some handlers by topics', function () {
            var map = new HandlersMap()

            map.add({
                as: 'node',
                to: {
                    gate: ['a', 'b'],
                    node: ['x', 'y', 'z'],
                },
                topic: ['e1', 'e2', 'e3'],
                success: success,
            })

            map.remove({
                as: 'node',
                to: {
                    gate: ['a'],
                    node: ['x', 'z'],
                },
                topic: ['e1', 'e2'],
            })

            assert(checkMap(map.gates, {
                a: {
                    x: {
                        node: {
                            e3: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                    y: {
                        node: {
                            e1: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                            e2: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                            e3: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                    z: {
                        node: {
                            e3: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                },
                b: {
                    x: {
                        node: {
                            e1: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                            e2: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                            e3: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                    y: {
                        node: {
                            e1: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                            e2: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                            e3: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                    z: {
                        node: {
                            e1: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                            e2: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                            e3: [
                                {
                                    key: success,
                                    value: undefined
                                }
                            ],
                        }
                    },
                },
            }))
            assert(checkMap(map.nodes, {}))
        })

        it('removes multiple handlers at once', function () {
            var map = new HandlersMap()

            var handler1 = function () {}
            var handler2 = function () {}
            var handler3 = function () {}

            map.add({
                as: 'node',
                to: 'z',
                topic: 'e',
                success: handler1,
            })

            map.add({
                as: 'node',
                to: 'z',
                topic: 'e',
                success: handler2,
            })

            map.add({
                as: 'node',
                to: 'z',
                topic: 'e',
                success: handler3,
            })

            map.remove({
                as: 'node',
                to: ['x', 'z'],
                topic: 'e',
                success: [handler1, handler2],
            })

            assert(checkMap(map.nodes, {
                z: {
                    node: {
                        e: [
                            {
                                key: handler3,
                                value: undefined,
                            }
                        ],
                    }
                },
            }))

            assert(checkMap(map.gates, {}))
        })

        it('reverts handlers to initial empty state', function () {
            var map = new HandlersMap()

            map.add({
                as: 'progressbar',
                to: [
                    {
                        gate: ['server'],
                        node: 'process',
                    },
                    {
                        gate: 'client',
                        node: ['task'],
                    },
                    'loader',
                ],
                topic: 'progress',
                success: success,
            })

            map.remove({
                as: 'progressbar',
                to: [
                    {
                        gate: ['server'],
                        node: 'process',
                    },
                    {
                        gate: 'client',
                        node: ['task'],
                    },
                    'loader',
                ],
                topic: 'progress',
                success: success,
            })

            assert(checkMap(map.gates, {}))
            assert(checkMap(map.nodes, {}))
        })

        it('removes all listeners of all topics of a node, but not on specific topics', function () {
            var map = new HandlersMap()

            map.add({
                as: 'a',
                to: {
                    node: 'b',
                },
                topic: ['c'],
                success: success,
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: '*',
                success: success,
            })

            map.remove({
                as: 'a',
                to: 'b',
                topic: '*',
                success: success,
            })

            assert(checkMap(map.nodes, {
                'b': {
                    'a': {
                        'c': [
                            {
                                key: success,
                                value: undefined
                            }
                        ],
                    }
                }
            }))
            assert(checkMap(map.gates, {}))

        })

        it('throws when trying to remove some handlers by topic only', function () {
            assert.throws(function () {
                map.remove({
                    as: 'node',
                    topic: 'e',
                })
            })
        })

        it('throws when trying to remove some handlers by handler only', function () {
            assert.throws(function () {
                map.remove({
                    as: 'node',
                    success: success,
                })
            })
        })

    })

    function checkMap (map, values) {
        if (map.size !== Object.keys(values).length) { return false }

        for (const [key, value] of map) {
            if (values instanceof Array) {
                return checkArray(values, key, value)
            }
            if (value instanceof Map && (!values[key] || !checkMap(value, values[key]))) {
                return false
            }
        }

        return true
    }

    function checkArray (values, k, v) {
        for (const entry of values) {
            if (entry.key === k && entry.value === v) {
                return true
            }
        }
        return false
    }

})
