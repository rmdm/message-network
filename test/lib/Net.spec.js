describe('Net class', function () {

    var assert = require('assert')
    var sinon = require('sinon')

    var Net = require('../../lib/Net')
    var Node = require('../../lib/Node')
    var Gate = require('../../lib/Gate')
    var MemoryGate = require('../../lib/MemoryGate')

    var EventEmitter = require('events').EventEmitter

    var enet, node, gate

    beforeEach(function () {
        enet = Net()
        node = Node()
        gate = Gate()
    })

    describe('constructor', function () {

        it('returns an instance of Net class when called as a function', function () {
            assert(enet instanceof Net)
        })

    })

    describe('node method', function () {

        it('returns a connected node of the network by its name', function () {
            enet.connect('node', node)

            var result = enet.node('node')

            assert.equal(result, node)
        })

        it('returns null when a node is not connected to a network', function () {
            var netNode = enet.node('node')

            assert.strictEqual(netNode, null)
        })

    })

    describe('names method', function () {

        it('returns a connected node names of the network by node', function () {
            enet.connect('node', node)
            enet.connect('another-node', node)
            enet.connect('one-more-node', {})

            var names = enet.names(node).sort()

            assert.deepEqual(names, ['another-node', 'node'])
        })

    })

    describe('connect method', function () {

        it('connects a Node instance node', function () {
            enet.connect('node', node)
            var netNode = enet.node('node')

            assert.equal(netNode, node)
        })

        it('connects a Gate instance node', function () {
            enet.connect('gate', gate)

            assert.equal(enet._gates['gate'], gate)
        })

        it('listens on node "listen" method and sets its "as" parameter as passed node "name"', function () {
            var listen = sinon.stub(enet, 'listen')

            enet.connect('node', node)

            node.listen()

            assert(listen.calledWithMatch({as: 'node'}))
        })

        it('listens on node "send" method and sets its "as" parameter as passed node "name"', function () {
            var send = sinon.stub(enet, 'send')

            enet.connect('node', node)

            node.send()

            assert(send.calledWithMatch({as: 'node'}))
        })

        it('listens on node "unlisten" method and sets its "as" parameter as passed node "name"', function () {
            var unlisten = sinon.stub(enet, 'unlisten')

            enet.connect('node', node)

            node.unlisten()

            assert(unlisten.calledWithMatch({as: 'node'}))
        })

        it('links to another net through MemoryGate if passed node is of Net type', function () {
            var anotherNet = Net()

            enet.connect('node', anotherNet, {remoteGateName: 'gate'})

            var enetGate = enet.node('node')
            var anotherNetGate = anotherNet.node('gate')

            assert(enetGate instanceof MemoryGate)
            assert(anotherNetGate instanceof MemoryGate)
            assert.equal(enetGate._endpoint, anotherNetGate)
            assert.equal(anotherNetGate._endpoint, enetGate)
        })

        it('retriggers events of passed node into net if it is of EventEmitter type', function () {
            var send = sinon.stub(enet, 'send')
            var ee = new EventEmitter()

            enet.connect('node', ee, {events: ['event']})

            ee.emit('event', 'data')

            assert(send.calledWithMatch({
                as: 'node',
                to: '*',
                topic: 'event',
                data: 'data',
            }))
        })

        it('wraps passed node if it is not of Node type', function () {
            enet.connect('node', {iamnode: true})

            var netNode = enet.node('node')

            assert(netNode instanceof Node)
            assert.equal(netNode.iamnode, true)
        })

        it('returns a network itself', function () {
            var network = enet.connect('node', node)

            assert.equal(network, enet)
        })

        it('throws when a node is connected under an already used name', function () {
            var anotherNode = Node()

            enet.connect('node', node)

            assert.throws(function () {
                enet.connect('node', anotherNode)
            })
        })

        it('throws when a node name is not a string', function () {
            assert.throws(function () {
                enet.connect(1000, node)
            })
        })

        it('throws when a node is not an object', function () {

            assert.throws(function () {
                enet.connect('node', 10)
            })
        })

        it('throws when a node name is "*"', function () {
            assert.throws(function () {
                enet.connect('*', node)
            })
        })

        it('throws when a node name is ""', function () {
            assert.throws(function () {
                enet.connect('', node)
            })
        })

    })

    describe('disconnect method', function () {

        it('disconnects a node from a network', function () {
            enet.connect('node', node)
            enet.disconnect('node')
            var netNode = enet.node('node')

            assert.equal(netNode, null)
        })

        it('returns a network itself', function () {
            enet.connect('node', node)
            var network = enet.disconnect('node')

            assert.equal(network, enet)
        })

    })

    describe('reconnect method', function () {

        it('disconnects a node from a network and connects another one to it', function () {
            var anotherNode = Node()

            enet.connect('node', node)
            enet.reconnect('node', anotherNode)
            var netNode = enet.node('node')

            assert.equal(netNode, anotherNode)
            assert.notEqual(netNode, node)
        })

        it('returns a network itself', function () {
            var network = enet.reconnect('node', node)

            assert.equal(network, enet)
        })

    })

    describe('listen method', function () {

        it('registers a notification handler with a gate', function () {
            var handler = function () {}

            enet.listen({
                as: 'progressbar',
                to: {
                    gate: 'server',
                    node: 'task',
                },
                topic: 'progress',
                handler: handler,
            })

            assert.deepEqual(enet._handlers, {
                gates: {
                    'server': {
                        'task': {
                            'progressbar': {
                                'progress': [handler],
                            }
                        }
                    }
                },
                nodes: {},
            })
        })

        it('registers a notification handler without a gate', function () {
            var handler = function () {}

            enet.listen({
                as: 'progressbar',
                to: 'task',
                topic: 'progress',
                handler: handler,
            })

            assert.deepEqual(enet._handlers, {
                gates: {},
                nodes: {
                    'task': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    }
                },
            })
        })

        it('registers many notification handlers with gates', function () {
            var handler = function () {}

            enet.listen({
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

            assert.deepEqual(enet._handlers, {
                gates: {
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
                },
                nodes: {
                    'loader': {
                        'progressbar': {
                            'progress': [handler],
                        }
                    }
                },
            })
        })

        it('registers many gate node handlers in pairs', function () {
            var handler = function () {}

            enet.listen({
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

            assert.deepEqual(enet._handlers, {
                gates: {
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
                },
                nodes: {},
            })
        })

        it('registers notification handler on many topics', function () {
            var handler = function () {}

            enet.listen({
                as: 'a',
                to: 'b',
                topic: ['c', 'd'],
                handler: handler,
            })

            assert.deepEqual(enet._handlers, {
                gates: {},
                nodes: {
                    'b': {
                        'a': {
                            'c': [handler],
                            'd': [handler],
                        }
                    }
                }
            })
        })

        it('registers many notification handlers on many topics', function () {
            var handler1 = function () {}
            var handler2 = function () {}

            enet.listen({
                as: 'a',
                to: 'b',
                topic: ['c', 'd'],
                handler: [handler1, handler2],
            })

            assert.deepEqual(enet._handlers, {
                gates: {},
                nodes: {
                    'b': {
                        'a': {
                            'c': [handler1, handler2],
                            'd': [handler1, handler2],
                        }
                    }
                }
            })
        })

        it('registers notification handler on all topics', function () {
            var handler = function () {}

            enet.listen({
                as: 'a',
                to: 'b',
                topic: 'c',
                handler: handler,
            })

            enet.listen({
                as: 'a',
                to: 'b',
                topic: '*',
                handler: handler,
            })

            assert.deepEqual(enet._handlers, {
                gates: {},
                nodes: {
                    'b': {
                        'a': {
                            'c': [handler],
                            '*': [handler]
                        }
                    }
                }
            })

        })

    })

    describe('send method', function () {

        it('sends a message', function (done) {
            var handler = sinon.spy(function () {
                assert.equal(handler.firstCall.args[0], 50);
                done()
            })

            enet.listen({
                as: 'progressbar',
                to: 'task',
                topic: 'progress',
                handler: handler,
            })

            enet.send({
                as: 'task',
                to: 'progressbar',
                topic: 'progress',
                data: 50,
            })

        })

        it('sends a message to multiple message handlers', function (done) {

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

            enet.listen({
                as: 'progressbar',
                to: 'task',
                topic: 'progress',
                handler: handler,
            })

            enet.listen({
                as: 'anotherProgressbar',
                to: 'task',
                topic: 'progress',
                handler: anotherHandler,
            })

            enet.send({
                as: 'task',
                to: ['progressbar', 'anotherProgressbar'],
                topic: 'progress',
                data: 50,
            })

        })

        it('notifies multiple message handlers of the same topic', function (done) {
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

            enet.listen({
                as: 'a',
                to: 'b',
                topic: ['e', 'e1', 'e2'],
                handler: [handler, anotherHandler]
            })

            enet.send({
                as: 'b',
                to: {node: 'a'},
                topic: 'e',
                data: 'data',
            })

        })

        it('notifies handlers of all messages and specific of the current one', function () {
            var handler = sinon.spy(function () {
                assert(handler.called)
                if (anotherHandler.called) { return done }
            })
            var anotherHandler = sinon.spy(function () {
                assert(anotherHandler.called)
                if (handler.called) { return done }
            })

            enet.listen({
                as: 'a',
                to: 'b',
                topic: ['c'],
                handler: [handler],
            })

            enet.listen({
                as: 'a',
                to: 'b',
                topic: '*',
                handler: [anotherHandler],
            })

            enet.send({
                as: 'b',
                to: 'a',
                topic: 'c',
            })

        })

        it('notifies handlers of all topics and specific of the current one' +
                ' but not more than once per send call', function (done) {

            var handler = sinon.spy(function () {
                assert(handler.calledOnce)
                done()
            })

            enet.listen({
                as: 'a',
                to: 'b',
                topic: ['c'],
                handler: [handler],
            })

            enet.listen({
                as: 'a',
                to: 'b',
                topic: '*',
                handler: [handler],
            })

            enet.send({
                as: 'b',
                to: 'a',
                topic: 'c',
            })
        })

        it('notifies a node topic handler from a gate', function (done) {
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

            enet.listen({
                as: 'a',
                to: {
                    gate: 'g',
                    node: 'b',
                },
                topic: 'e',
                handler: handler,
            })

            enet.send({
                as: {
                    gate: 'g',
                    node: 'b',
                },
                to: 'a',
                topic: 'e',
            })

        })

        it('notifies all interested listeners', function (done) {
            var handler = sinon.spy(function () {
                assert(handler.called)
                if (anotherHandler.called) { done() }
            })
            var anotherHandler = sinon.spy(function () {
                assert(anotherHandler.called)
                if (handler.called) { done() }
            })

            enet.listen({
                as: 'a',
                to: 'b',
                topic: 'e',
                handler: handler,
            })

            enet.listen({
                as: 'c',
                to: 'b',
                topic: 'e',
                handler: anotherHandler,
            })

            enet.send({
                as: 'b',
                to: '*',
                topic: 'e',
                data: 'smth',
            })

        })

        it('notifies all interested listeners of all nodes', function (done) {

            var handler = sinon.spy(function () {
                assert(handler.calledWithMatch('smth', {
                    sender: {
                        node: 'b',
                    },
                    topic: 'e',
                }))
                done()
            })

            enet.listen({
                as: 'a',
                to: '*',
                topic: 'e',
                handler: handler,
            })

            enet.send({
                as: 'b',
                to: '*',
                topic: 'e',
                data: 'smth',
            })

        })

        it('notifies all interested nodes', function (done) {
            var handler = sinon.spy(function () {
                assert(handler.calledWithMatch({
                    node: ['a'],
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

            enet._gates['g'] = true

            enet.listen({
                as: 'g2',
                to: 'b',
                topic: 'e',
                handler: anotherHandler,
            })

            enet.listen({
                as: 'g',
                to: 'b',
                topic: 'e',
                handler: handler,
            })

            enet.send({
                as: 'b',
                to: {
                    gate: '*',
                    node: 'a',
                },
                topic: 'e',
            })

        })

        it('calls success handler on reply from listening handler', function (done) {
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

            enet.listen({
                as: 'calculator',
                to: 'scientist',
                topic: 'sum',
                handler: handler,
            })

            enet.send({
                as: 'scientist',
                to: 'calculator',
                topic: 'sum',
                data: [1, 2, 3, 4, 5],
                success: success,
            })

        })

        it('makes chat', function (done) {

            var chat = []

            var counter = 0

            enet.listen({
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

            enet.send({
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
                    enet.send({
                        as: 'pong',
                        to: 'test',
                        topic: 'done',
                    })
                },
            })

            enet.listen({
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

        it('redefines gate reply handler', function (done) {

            var thirdHandler = sinon.spy(function () {
                enet.send({
                    as: 'gate',
                    to: 'test',
                    topic: 'done',
                })
            })
            var secondHandler = sinon.spy(function (data, context) {
                context.reply(null, {success: thirdHandler})
            })
            var firstHandler = sinon.spy(function (data, context) {
                context.reply(null, {success: secondHandler})
            })

            enet._gates['gate'] = true

            enet.listen({
                as: 'gate',
                to: 'node',
                topic: 'test',
                handler: firstHandler,
            })

            enet.send({
                as: 'node',
                to: {
                    gate: 'gate',
                    node: 'gatenode',
                },
                topic: 'test',
                data: null,
                success: function replier (data, context) {
                    context.reply(null)
                },
            })

            enet.listen({
                as: 'test',
                to: '*',
                topic: 'done',
                handler: function () {
                    assert(firstHandler.calledWithMatch({
                        data: null,
                        node: ['gatenode']
                    }, {
                        sender: {
                            node: 'node',
                        },
                        topic: 'test',
                    }))
                    assert(secondHandler.calledWithMatch({
                        data: null,
                        node: ['gatenode']
                    }, {
                        sender: {
                            node: 'node',
                        },
                        topic: 'test',
                    }))
                    assert(thirdHandler.calledWithMatch({
                        data: null,
                        node: ['gatenode']
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

        it('calls handler bound to listening node instance', function (done) {
            var node = Node()
            var net = Net()

            net._nodes['node'] = node

            net.listen({
                as: 'node',
                to: 'other_node',
                topic: 'smth',
                handler: function () {
                    assert.equal(this, node)
                    done()
                }
            })

            net.send({
                as: 'other_node',
                to: 'node',
                topic: 'smth',
            })

        })

        it('calls success handler bound to sending node instance', function (done) {
            var other_node = Node()
            var net = Net()

            net._nodes['other_node'] = other_node

            net.listen({
                as: 'node',
                to: 'other_node',
                topic: 'smth',
                handler: function (data, context) {
                    context.reply()
                }
            })

            net.send({
                as: 'other_node',
                to: 'node',
                topic: 'smth',
                success: function () {
                    assert.equal(this, other_node)
                    done()
                }
            })

        })

        it('calls error handler bound to sending node instance', function (done) {
            var other_node = Node()
            var net = Net()

            net._nodes['other_node'] = other_node

            net.listen({
                as: 'node',
                to: 'other_node',
                topic: 'smth',
                handler: function (data, context) {
                    context.refuse()
                }
            })

            net.send({
                as: 'other_node',
                to: 'node',
                topic: 'smth',
                error: function () {
                    assert.equal(this, other_node)
                    done()
                }
            })

        })

        it('calls reply success handler bound to listening node instance', function (done) {
            var node = Node()
            var net = Net()

            net._nodes['node'] = node

            net.listen({
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

            net.send({
                as: 'other_node',
                to: 'node',
                topic: 'smth',
                success: function (data, context) {
                    context.reply()
                }
            })

        })

        it('calls reply error handler bound to listening node instance', function (done) {
            var node = Node()
            var net = Net()

            net._nodes['node'] = node

            net.listen({
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

            net.send({
                as: 'other_node',
                to: 'node',
                topic: 'smth',
                success: function (data, context) {
                    context.refuse()
                }
            })

        })

        it('throws when trying to send from one gate to another one', function () {
            var handler = sinon.spy()

            enet.listen({
                as: 'a',
                to: '*',
                topic: '*',
                handler: handler,
            })

            assert.throws(function () {
                enet.send({
                    as: {
                        gate: 'a',
                        node: 'a',
                    },
                    to: {
                        gate: 'a',
                        node: 'a',
                    },
                    topic: 'e',
                })
            })
        })

    })

    describe('unlisten method', function () {

        var enet, handler

        beforeEach(function () {
            enet = Net()
            handler = function () {}

            enet.listen({
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
            enet.unlisten({
                as: 'node',
                to: {
                    gate: ['a', 'b'],
                },
            })

            assert.deepEqual(enet._handlers, {
                gates: {
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
                },
                nodes: {},
            })
        })

        it('removes some handlers by node', function () {
            enet.unlisten({
                as: 'node',
                to: {
                    gate: ['a', 'b', 'c'],
                    node: ['x', 'z'],
                },
            })

            assert.deepEqual(enet._handlers, {
                gates: {
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
                },
                nodes: {},
            })
        })

        it('removes some handlers by nodes', function () {
            enet.unlisten({
                as: 'node',
                to: {
                    gate: ['a', 'b'],
                    node: ['x', 'z'],
                },
            })

            assert.deepEqual(enet._handlers, {
                gates: {
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
                },
                nodes: {},
            })
        })

        it('removes some handlers by topic', function () {
            enet.unlisten({
                as: 'node',
                to: {
                    gate: ['a', 'b', 'c'],
                    node: ['x', 'z'],
                },
                topic: 'e',
            })

            assert.deepEqual(enet._handlers, {
                gates: {
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
                },
                nodes: {},
            })
        })

        it('removes some handlers by topics', function () {
            var enet = Net()

            enet.listen({
                as: 'node',
                to: {
                    gate: ['a', 'b'],
                    node: ['x', 'y', 'z'],
                },
                topic: ['e1', 'e2', 'e3'],
                handler: handler,
            })

            enet.unlisten({
                as: 'node',
                to: {
                    gate: ['a'],
                    node: ['x', 'z'],
                },
                topic: ['e1', 'e2'],
            })

            assert.deepEqual(enet._handlers, {
                gates: {
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
                },
                nodes: {},
            })
        })

        it('removes some handlers by handlers', function () {
            var enet = Net()

            var handler1 = function () {}
            var handler2 = function () {}
            var handler3 = function () {}

            enet.listen({
                as: 'node',
                to: 'z',
                topic: 'e',
                handler: [handler1, handler2, handler3]
            })

            enet.unlisten({
                as: 'node',
                to: ['x', 'z'],
                topic: 'e',
                handler: [handler1, handler2],
            })

            assert.deepEqual(enet._handlers, {
                gates: {},
                nodes: {
                    z: {
                        node: {
                            e: [handler3],
                        }
                    },
                },
            })
        })

        it('reverts handlers to initial empty state', function () {
            var enet = Net()

            enet.listen({
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

            enet.unlisten({
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

            assert.deepEqual(enet._handlers, {
                gates: {},
                nodes: {},
            })
        })

        it('removes all listeners of all topics of a node, but not on specific topics', function () {
            var enet = Net()

            enet.listen({
                as: 'a',
                to: {
                    node: 'b',
                },
                topic: ['c'],
                handler: [handler],
            })

            enet.listen({
                as: 'a',
                to: 'b',
                topic: '*',
                handler: [handler],
            })

            enet.unlisten({
                as: 'a',
                to: 'b',
                topic: '*',
                handler: [handler],
            })

            assert.deepEqual(enet._handlers, {
                gates: {},
                nodes: {
                    'b': {
                        'a': {
                            'c': [handler],
                        }
                    }
                },
            })

        })

        it('throws when trying to remove some handlers by topic', function () {
            assert.throws(function () {
                enet.unlisten({
                    as: 'node',
                    topic: 'e',
                })
            })
        })

        it('throws when trying to remove some handlers by handler', function () {
            assert.throws(function () {
                enet.unlisten({
                    as: 'node',
                    handler: handler,
                })
            })
        })

    })

})

