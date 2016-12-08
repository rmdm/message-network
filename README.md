message-network
===

Highly scalable, modular, flexible, lightweight and performant solution for
evented interactions.

Description
===

**message-network** allows you to build a network of nodes that can interact by
sending messages to each other. **message-network** provides three models of
interaction:

* notification,
* request-response,
* chat,

where _notification_ is fire-and-forget interaction, no response is expected or
waited for, _request-response_, as its name implies, allows one node to ask
another one for response and _chat_ is much like _request-response_ with
multiple roundtrips.

For an interaction to occur both sides of the interaction have to declare theirs
participation. By default no nodes is listening on messages (though some nodes
may emit messages by default). Hence no interaction occurs by default. A message
can be sent to one (unicast message), many (multicast message) or all (broadcast
message) nodes of a network.

Message networks can be combined by using _gates_. A gate is a special kind of
a network node. This nodes, when receive messages, pass them to gate nodes of
another networks which in turn send the messages into destination network.
Networks by itself does not have names but by using (always) named gates they
can refer to other networks (including itself) by that names. It is possible to
transparently connect networks residing on different devices which makes
**message-network** a good basement for distributed architectures also.

Installation
===

```
npm install message-network
```

API
===

* [Net ()](#net)
  * [connect (name, node [, options])](#connect-name-node-options-net)
  * [disconnect (name)](#disconnect-name-net)
  * [reconnect (name, node [, options])](#reconnect-name-node-options-net)
  * [listen (params)](#listen-params-net)
  * [send (params)](#send-params-net)
  * [unlisten (params)](#unlisten-params-net)
  * [node (name)](#node-name-node)
  * [names (node)](#names-node-string)
* [Node ([properties])](#node)
  * [listen (params)](#listen-params-net-2)
  * [send (params)](#send-params-net)
  * [unlisten (params)](#unlisten-params-net)
* [Gate ([options])](#gate)
  * [listen (params)](#)
  * [_transfer (data)](#)
* [MemoryGate ([options])](#memorygate)
  * [link (memorygate)](#gate-link-memorygate)
  * [unlink ()](#gate-unlink-memorygate)
* [BaseError (message [, data])](#)
  * [data](#)
* [TimeoutError (message [, data])](#)
  * [data.timeout](#)
* [DisconnectedError (message [, data])](#)
  * [data.remote](#)
* [Handler function](#)
  * [Context](#)

### ```Net()```

#### ```.connect (name, node [, options]) -> Net```

Connects a **node** to the network under specified **name**. A network cannot
have more than one connected **node** under the same **name**. A **node** can be
connected to multiple message networks. A **node** can be connected to the
same network under different names.

An instance of one of the following classes can be passed in place of **node**:

* **Node**
* **Net**
* **EventEmitter**
* **Object**

Instances of **Node** is used as is. Passing an instance of **Net** is
an implicit way to create a **MemoryGate** node under specified **name** in the
current network that is linked to another **MemoryGate** node in the passed
network under name defined by **options.remoteGateName** option, which is
required in this case. If an **EventEmitter** is passed, an implicit Node is
created which listens on events specified by **options.events** option and
resends messages of the same topic name into the network. Passing an **Object**
instance is a shortcut of connecting a **Node** instance initialized with that
object.

#### ```.disconnect (name) -> Net```

Disconnects a node under specified **name** from the network.

#### ```.reconnect (name, node [, options]) -> Net```

Shorthand for calling [```.disconnect```](#) and [```.connect```](#)
sequentially.

#### ```.listen (params) -> Net```

Registers new handlers on messages sent from nodes specified by **params**.

**params** are:

* **as** - name of the node listening.
* **to** - names of nodes to listen to. Setting to **'*'** listens to all
  nodes.
  * **to.node** - names of nodes to listen to. Setting to **'*'** listens to all
  nodes.
  * **to.gate** - names of gates to listen to, **to.node** is required if
  **to.gate** is set. Setting to **'*'** listens to all gates.
* **topic** - names of topics of messages to listen on. Setting to **'*'**
  listens on all topics.
* **success** - a [handler](#) to execute on a message.
* **error** - optional default error [handler](#) to execute on reply error.

_Not used directly normally, but [through nodes](#listen-params-net)._

#### ```.send (params) -> Net```

Send a message to nodes specified by **params**.

**params** are:

* **as** - name of the node sending.
* **to** - names of nodes to send to. Setting to **'*'** sends to all
  nodes.
  * **to.node** - names of nodes to send to. Setting to **'*'** sends to all
  nodes.
  * **to.gate** - names of gate to send to, **to.node** is required if
  **to.gate** is set. Setting to **'*'** sends to all gates.
* **topic** - a name of a topic to send the message of.
* **data** - optional message payload.
* **success** - optional success [handler](#). Called when receiving node
  handler calls its [context's](#) **reply** method.
* **error** - optional error [handler](#). Called when receiving node handler
  calls its [context's](#) **refuse** method. Its first argument is always
  an instance of **BaseError** class.
* **options**
  * **options.timeout** - optional timeout in which response is expected. If
  timeout is expired, **error** handler is called with a **TimeoutError**.

_Not used directly normally, but [through nodes](#listen-params-net)._

#### ```.unlisten (params) -> Net```

Removes handlers on messages sent from nodes specified by **params**.

**params** are:

* **as** - name of the node listening.
* **to** - names of nodes to stop listen to. Setting to **'*'** stops
  listening to all nodes.
  * **to.node** - names of nodes to stop listen to. Setting to **'*'** stops
  listening to all nodes.
  * **to.gate** - names of gates to stop listen to, note that **to.node** is
  optional here, unlike in [```.listen```](#). Setting to **'*'** stops listening to
  all gates.
* **topic** - names of topics of messages to stop listen on. Setting to **'*'**
  stops listening on all topics.
* **success** - [handlers](#) to stop execute on message.

_Not used directly normally, but [through nodes](#listen-params-net)._

#### ```.node (name) -> Node```

Returns a node under specified **name**.

#### ```.names (node) -> String[]```

Returns a **node** names under which it is registered in the network.

### ```Node (properties)```

When **properties** object is passed its properties are set on newly created
**Node** instance.

#### ```.listen (params) -> Node```

Passes **params** to a network's [```.listen```](#) method with **params.as**
param set to **name** under which node is registered in the network.

#### ```.send (params) -> Node```

Passes **params** to a network's [```.send```](#) method with **params.as**
param set to **name** under which node is registered in the network.

#### ```.unlisten (params) -> Node```

Passes **params** to a network's [```.unlisten```](#) method with **params.as**
param set to **name** under which node is registered in the network.

### ```Gate(options)```

Extends **Node** class. Includes specific implementation for inter-network
event passing. Unlike **Node** constructor, accepts **options** object, not
**properties** one. Used as base class for actual **Gate** classes. Subclasses
must implement [```._transfer```](#) method.

**options** are:

* **MAX_HELD_CB_COUNT** - Number of callbacks to hold, wating for possible call
triggered by other network. Defaults to 1000.

#### ```.listen (params) -> Gate```

Overrides **Node** [```.listen```](#) method. Ignores passed **params.success**
param.

#### ```._transfer (data) * throws```

Always throws. Method to override for subclasses. Its single responsibility is
to pass **data** to other gate which in turn must call its [```.receive```](#)
method on receive.

#### ````.transfer (data)````

Should not be used directly. This method is used as [```.listen```](#) method
**params.success** param.

#### ````.receive (data)````

Should be used only within **Gate**'s subclass implementation. Receives **data**
[transfered](#) by other gate.

### ```MemoryGate([options])```

Extends **Gate** class. Accepts all the same options as **Gate** class does.
Includes specific implementation for inter-network event passing for the
networks in the same memory.

#### ```.link (memorygate) -> MemoryGate```

Sets link to other **MemoryGate** node connected to other network to pass inter-
network messages to.

#### ```.unlink () -> MemoryGate```

Unsets linked **MemoryGate** node.

### ```BaseError (message, data)```

Base error class.

#### ```.data```

Property set on an error instance passed on constructor

### ```TimeoutError (message, data)```

Thrown when a request is not respond within timeout.

#### ```data.timeout```

Value of expired timeout.

### ```DisconnectedError (message, data)```

Thrown when either sender or receiver is disconnected from the network.

#### ```data.remote```

Flag showing whether receiving or sending node is disconnected.

### ```Handler function```

A function of the following signature: ```function (data, context)```.

Function accepts message [payload](#) as its first param and message
[context](#) as its second param.

#### ```Context```

An object with the following properties:

* **sender** - name of the sender.
  * **sender.node** - name of the sender node.
  * **sender.gate** - name of the sender gate.
* **topic** - name of the message topic.
* **reply** - function accepting as its first argument **data** to send back to
  calling node success handler, and **options** as its second argument.
* **refuse** - function accepting as its first argument **error** to send back
to calling node error handler, and **options** as its second argument.

**options** of both context functions are similar to those of the **Node's**
[send](#) method and are the following:

* **success** - optional success [handler](#). Called when receiving node
  handler calls its [context's](#) **reply** method.
* **error** - optional error [handler](#). Called when receiving node handler
  calls its [context's](#) **refuse** method. Its first argument is always
  an instance of **BaseError** class.
* **options**
  * **options.timeout** - optional timeout in which response is expected. If
  timeout is expired, **error** handler is called with a **TimeoutError**.

Examples
===

### Ping-pong

```javascript
import {Net, Node} from 'message-network'

function Player (name, skill) {

  return Node({
    name: name,
    skill: skill,

    takeTurn: function (data, context) {
      const fault = Math.random() > this.skill
      if (fault) {
        console.log(this.name, 'out!')
        context.refuse()
      } else {
        console.log(this.name, 'in!')
        context.reply()
      }
    },

    callReferee: function (data, context) {
      const loser = context.sender.node
      this.send({
        to: 'referee',
        topic: 'out',
        data: loser,
      })
    },
  })

}

const match = Net()

const ping = Player('ping', 0.8)
const pong = Player('pong', 0.75)
const referee = Node()

match
  .connect('ping', ping)
  .connect('pong', pong)
  .connect('referee', referee)

ping.listen({
  to: 'pong',
  topic: 'turn',
  success: function (data, context) {
    this.takeTurn(data, context)
  },
  error: function (data, context) {
    this.callReferee(data, context)
  },
})

pong.send({
  to: 'ping',
  topic: 'turn',
  success: function (data, context) {
    this.takeTurn(data, context)
  },
  error: function (data, context) {
    this.callReferee(data, context)
  },
})

referee.listen({
  to: ['ping', 'pong'],
  topic: 'out',
  success: function (loser, context) {
    const winner = context.sender.node
    console.log('referee!', loser, 'has lost!')
    console.log('referee!', winner, 'has won!')
  }
})

// ping in!
// pong in!
// ping out!
// referee! ping has lost!
// referee! pong has won!

```

### Map-reduce
