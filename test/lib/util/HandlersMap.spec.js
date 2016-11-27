describe('HandlersMap class', function () {

    var assert = require('assert')
    var sinon = require('sinon')
    var HandlersMap = require('../../../lib/util/HandlersMap')

    var map

    beforeEach(function () {
        map = new HandlersMap
    })

    describe('add method', function () {

        it('registers a notification handler listening on a gate', function () {
            var handler = function () {}

            map.add({
                as: 'progressbar',
                to: {
                    gate: 'server',
                    node: 'task',
                },
                topic: 'progress',
                handler: handler,
            })

            assert(checkMap(map.gates, {
                'server': {
                    'task': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    }
                }
            }))
        })

        it('registers a notification handler listening on a node', function () {
            var handler = function () {}

            map.add({
                as: 'progressbar',
                to: 'task',
                topic: 'progress',
                handler: handler,
            })

            assert(checkMap(map.nodes, {
                'task': {
                    'progressbar': {
                        'progress': [handler],
                    }
                }
            }))
            assert(checkMap(map.gates, {}))
        })

        it('registers many notification handlers listening on gates', function () {
            var handler = function () {}

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
                handler: handler,
            })

            assert(checkMap(map.gates, {
                'server': {
                    'process': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    },
                },
                'client': {
                    'task': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    },
                }
            }))
            assert(checkMap(map.nodes, {
                'loader': {
                    'progressbar': {
                        'progress': [handler],
                    }
                }
            }))
        })

        it('registers many gate node handlers', function () {
            var handler = function () {}

            map.add({
                as: 'progressbar',
                to: [
                    {
                        gate: ['server', 'client'],
                        node: ['task', 'process'],
                    },
                ],
                topic: 'progress',
                handler: handler,
            })

            assert(checkMap(map.gates, {
                'server': {
                    'process': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    },
                    'task': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    },
                },
                'client': {
                    'process': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    },
                    'task': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    },
                }
            }))
            assert(checkMap(map.nodes, {}))
        })

        it('registers notification handler on many topics', function () {
            var handler = function () {}

            map.add({
                as: 'a',
                to: 'b',
                topic: ['c', 'd'],
                handler: handler,
            })

            assert(checkMap(map.nodes, {
                'b': {
                    'a': {
                        'c': [handler],
                        'd': [handler],
                    }
                }
            }))
            assert(checkMap(map.gates, {}))
        })

        it('registers many notification handlers on many topics', function () {
            var handler1 = function () {}
            var handler2 = function () {}

            map.add({
                as: 'a',
                to: 'b',
                topic: ['c', 'd'],
                handler: [handler1, handler2],
            })

            assert(checkMap(map.nodes, {
                'b': {
                    'a': {
                        'c': [handler1, handler2],
                        'd': [handler1, handler2],
                    }
                }
            }))
            assert(checkMap(map.gates, {}))
        })

        it('registers notification handler on all topics', function () {
            var handler = function () {}

            map.add({
                as: 'a',
                to: 'b',
                topic: 'c',
                handler: handler,
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: '*',
                handler: handler,
            })

            assert(checkMap(map.nodes, {
                'b': {
                    'a': {
                        'c': [handler],
                        '*': [handler]
                    }
                }
            }))
            assert(checkMap(map.gates, {}))

        })

    })

    describe('exec method', function () {

        it('calls handlers of a single destination', function (done) {
            var handler = sinon.spy(function () {
                assert.equal(handler.firstCall.args[0], 50);
                done()
            })

            map.add({
                as: 'progressbar',
                to: 'task',
                topic: 'progress',
                handler: handler,
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

            var handler = sinon.spy(function () {
                assert(handler.calledWithMatch(50, {
                    sender: { node: 'task' },
                    topic: 'progress',
                }))
                if (anotherHandler.called) { done() }
            })
            var anotherHandler = sinon.spy(function () {
                assert(anotherHandler.calledWithMatch(50, {
                    sender: { node: 'task' },
                    topic: 'progress',
                }))
                if (handler.called) { done() }
            })

            map.add({
                as: 'progressbar',
                to: 'task',
                topic: 'progress',
                handler: handler,
            })

            map.add({
                as: 'anotherProgressbar',
                to: 'task',
                topic: 'progress',
                handler: anotherHandler,
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

        it('calls multiple handlers of a single destination', function (done) {
            var handler = sinon.spy(function () {
                assert(handler.calledWithMatch('data', {
                    sender: { node: 'b' },
                    topic: 'e',
                }))
                if (anotherHandler.called) { done() }
            })

            var anotherHandler = sinon.spy(function () {
                assert(anotherHandler.calledWithMatch('data', {
                    sender: { node: 'b' },
                    topic: 'e',
                }))
                if (handler.called) { done() }
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: ['e', 'e1', 'e2'],
                handler: [handler, anotherHandler]
            })

            map.exec({
                as: 'b',
                to: {node: 'a'},
                topic: 'e',
                data: 'data',
            }, {
                gates: {},
                nodes: {
                    a: {},
                    b: {},
                }
            })

        })

        it('calls handlers of a single destinations listening on all topics and one specific', function () {
            var handler = sinon.spy(function () {
                assert(handler.called)
                if (anotherHandler.called) { return done }
            })
            var anotherHandler = sinon.spy(function () {
                assert(anotherHandler.called)
                if (handler.called) { return done }
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: ['c'],
                handler: [handler],
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: '*',
                handler: [anotherHandler],
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

            var handler = sinon.spy(function () {
                setTimeout(function () {
                    assert(handler.calledOnce)
                    done()
                }, 10)
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: ['c'],
                handler: [handler],
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: '*',
                handler: [handler],
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
            var handler = sinon.spy(function () {
                if (timeoutSet) { return }
                timeoutSet = true
                setTimeout(function () {
                    assert(handler.calledTwice)
                    done()
                }, 10)
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: ['c'],
                handler: [handler],
            })

            map.add({
                as: 'c',
                to: 'b',
                topic: '*',
                handler: [handler],
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
            var handler = sinon.spy(function () {
                if (timeoutSet) { return }
                timeoutSet = true
                setTimeout(function () {
                    assert(handler.calledTwice)
                    done()
                }, 10)
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: ['c', 'c'],
                handler: [handler],
            })

            map.add({
                as: 'c',
                to: 'b',
                topic: '*',
                handler: [handler],
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
            var handler = sinon.spy(function () {
                if (timeoutSet) { return }
                timeoutSet = true
                setTimeout(function () {
                    assert(handler.calledThrice)
                    done()
                }, 10)
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: ['c', 'c'],
                handler: [handler],
            })

            map.add({
                as: 'c',
                to: 'b',
                topic: '*',
                handler: [handler],
            })

            map.add({
                as: 'x',
                to: 'b',
                topic: 'c',
                handler: handler,
            })

            map.add({
                as: 'y',
                to: 'b',
                topic: 'c',
                handler: function () {},
            })

            map.add({
                as: 'z',
                to: 'b',
                topic: 'c',
                handler: function () {},
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
            var handler = sinon.spy(function () {
                assert(handler.calledWithMatch(undefined, {
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
                handler: handler,
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
                handler: function () {},
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
                handler: function (data, context) {
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
                handler: function (data, context) {
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
                handler: function (data, context) {
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
            var handler = sinon.spy(function () {
                assert(handler.called)
                if (anotherHandler.called) { done() }
            })
            var anotherHandler = sinon.spy(function () {
                assert(anotherHandler.called)
                if (handler.called) { done() }
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: 'e',
                handler: handler,
            })

            map.add({
                as: 'c',
                to: 'b',
                topic: 'e',
                handler: anotherHandler,
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

            var handler = sinon.spy(function () {
                assert(handler.calledWithMatch('smth', {
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
                handler: handler,
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
            var handler = sinon.spy(function () {
                assert(handler.calledWithMatch({
                    node: 'a',
                    data: undefined
                }, {
                    sender: {
                        node: 'b',
                    },
                    topic: 'e',
                }))
                assert(!anotherHandler.called)
                done()
            })

            var anotherHandler = sinon.spy(function () {
                assert(!anotherHandler.called)
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: 'e',
                handler: anotherHandler,
            })

            map.add({
                as: 'g',
                to: 'b',
                topic: 'e',
                handler: handler,
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
            var success = sinon.spy(function () {
                assert(success.calledWithMatch(15, {
                    topic: 'sum',
                    sender: {
                        node: 'calculator',
                    },
                }))
                done()
            })

            var handler = function sum (data, context) {
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
                handler: handler,
            })

            map.exec({
                as: 'scientist',
                to: 'calculator',
                topic: 'sum',
                data: [1, 2, 3, 4, 5],
                success: success,
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
                handler: function (data, context) {
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
                handler: function () {
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

            var thirdHandler = sinon.spy(function () {
                map.exec({
                    as: 'gate',
                    to: 'test',
                    topic: 'done',
                }, options)
            })
            var secondHandler = sinon.spy(function (data, context) {
                context.reply(null, {success: thirdHandler})
            })
            var firstHandler = sinon.spy(function (data, context) {
                context.reply(null, {success: secondHandler})
            })

            map.add({
                as: 'gate',
                to: 'node',
                topic: 'test',
                handler: firstHandler,
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
                handler: function () {
                    assert(firstHandler.calledWithMatch({
                        data: null,
                        node: 'gatenode'
                    }, {
                        sender: {
                            node: 'node',
                        },
                        topic: 'test',
                    }))
                    assert(secondHandler.calledWithMatch({
                        data: null,
                        node: 'gatenode'
                    }, {
                        sender: {
                            node: 'node',
                        },
                        topic: 'test',
                    }))
                    assert(thirdHandler.calledWithMatch({
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
                handler: function () {
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
                handler: function (data, context) {
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
                handler: function (data, context) {
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
                handler: function (data, context) {
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
                handler: function (data, context) {
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

        it('guarantees to call exec success and error handlers only once', function (done) {
            var success = sinon.spy()
            var error = sinon.spy()

            map.add({
                as: 'node',
                to: 'other_node',
                topic: 'smth',
                handler: function (data, context) {
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
                handler: function (data, context) {
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
                handler: function (data, context) {
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
                handler: function (data, context) {
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
                handler: function (data, context) {
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
            var handler = sinon.spy()

            map.add({
                as: 'a',
                to: '*',
                topic: '*',
                handler: handler,
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

    })

    describe('remove method', function () {

        var map, handler

        beforeEach(function () {
            map = new HandlersMap()
            handler = function () {}

            map.add({
                as: 'node',
                to: {
                    gate: ['a', 'b', 'c'],
                    node: ['x', 'y', 'z'],
                },
                topic: ['e'],
                handler: handler,
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
                            e: [handler],
                        }
                    },
                    y: {
                        node: {
                            e: [handler],
                        }
                    },
                    z: {
                        node: {
                            e: [handler],
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
                            e: [handler],
                        }
                    },
                },
                b: {
                    y: {
                        node: {
                            e: [handler],
                        }
                    },
                },
                c: {
                    y: {
                        node: {
                            e: [handler],
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
                            e: [handler],
                        }
                    },
                },
                b: {
                    y: {
                        node: {
                            e: [handler],
                        }
                    },
                },
                c: {
                    x: {
                        node: {
                            e: [handler],
                        }
                    },
                    y: {
                        node: {
                            e: [handler],
                        }
                    },
                    z: {
                        node: {
                            e: [handler],
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
                            e: [handler],
                        }
                    },
                },
                b: {
                    y: {
                        node: {
                            e: [handler],
                        }
                    },
                },
                c: {
                    y: {
                        node: {
                            e: [handler],
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
                handler: handler,
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
                            e3: [handler],
                        }
                    },
                    y: {
                        node: {
                            e1: [handler],
                            e2: [handler],
                            e3: [handler],
                        }
                    },
                    z: {
                        node: {
                            e3: [handler],
                        }
                    },
                },
                b: {
                    x: {
                        node: {
                            e1: [handler],
                            e2: [handler],
                            e3: [handler],
                        }
                    },
                    y: {
                        node: {
                            e1: [handler],
                            e2: [handler],
                            e3: [handler],
                        }
                    },
                    z: {
                        node: {
                            e1: [handler],
                            e2: [handler],
                            e3: [handler],
                        }
                    },
                },
            }))
            assert(checkMap(map.nodes, {}))
        })

        it('removes some handlers by handlers', function () {
            var map = new HandlersMap()

            var handler1 = function () {}
            var handler2 = function () {}
            var handler3 = function () {}

            map.add({
                as: 'node',
                to: 'z',
                topic: 'e',
                handler: [handler1, handler2, handler3]
            })

            map.remove({
                as: 'node',
                to: ['x', 'z'],
                topic: 'e',
                handler: [handler1, handler2],
            })

            assert(checkMap(map.nodes, {
                z: {
                    node: {
                        e: [handler3],
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
                handler: handler,
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
                handler: handler,
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
                handler: [handler],
            })

            map.add({
                as: 'a',
                to: 'b',
                topic: '*',
                handler: [handler],
            })

            map.remove({
                as: 'a',
                to: 'b',
                topic: '*',
                handler: [handler],
            })

            assert(checkMap(map.nodes, {
                'b': {
                    'a': {
                        'c': [handler],
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
                    handler: handler,
                })
            })
        })

    })

    function checkMap (map, values) {
        if (map.size !== Object.keys(values).length) { return false }

        for (var entry of map.entries()) {
            var key = entry[0],
                value = entry[1]
            if (value instanceof Map && !checkMap(value, values[key])) {
                return false
            }
            if (value instanceof Set && !checkSet(value, values[key])) {
                return false
            }
        }

        return true
    }

    function checkSet (set, values) {
        if (set.size !== values.length) { return false }
        var i = 0
        for (var v of set) {
            if (v !== values[i++]) { return false }
        }
        return true
    }

})
