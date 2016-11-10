<!--message-network
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
another one for response and _chat_ is much like _request-response_ but with
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

* [Net](#net)
  * [connect](#connect-name-node-options-net)
  * [disconnect](#disconnect-name-net)
  * [reconnect](#reconnect-name-node-options-net)
  * [listen](#listen-params-net)
  * [send](#send-params-net)
  * [unlisten](#unlisten-params-net)
  * [node](#node-name-node)
  * [names](#names-node-string)
* [Node](#node)
  * [listen](#listen-params-net-2)
  * [send](#send-params-net)
  * [unlisten](#unlisten-params-net)
* [Gate](#gate)
* [MemoryGate](#memorygate)

## ```Net()```

#### ```.connect (name, node [, options]) -> Net```

Connects a **node** to the network under specified **name**. A network cannot
have more than one connected **node** under the same **name**. A **node** can be
connected to multiple message networks. A **node** can be connected to the
same network under different names.

In place of **node** can be passed an instance of one of the following classes:

* **Node**
* **Net**
* **EventEmitter**
* **Object**

Instances of **Node** is used as is. Passing an instance of **Net** is
an implicit way to create a _memory gate node_ under specified **name** in the
current network that is linked to another _memory gate node_ in the passed
network under name defined by **options.gateName** option, which is required in
this case. If an **EventEmitter** is passed, an implicit Node is created
which listens on events specified by **options.events** option and resends
messages of the same name into the network. Passing an **Object** instance
is a shortcut of connecting a **Node** instance initialized with that object.

#### ```.disconnect (name) -> Net```

Disconnects a node under specified **name** from the network.

#### ```.reconnect (name, node [, options]) -> Net```

The result is equivalent to the sequence of calls of
**Net.prototype.disconnect** and **Net.prototype.connect**.

#### ```.listen (params) -> Net```

Registers new handlers on messages sent from nodes specified by **params**.

**params** are:

* **as** - name of the node listening.
* **to** - names of nodes to listen to.
  * **to.node** - names of nodes to listen to.
  * **to.gate** - names of gates to listen to, **to.node** is required if
  **to.gate** is set.
* **topic** - names of topics of messages to listen on.
* **handler** - handlers to execute on message ([handler params](#)).

_Not used directly normally, but [through nodes](#listen-params-net)._

#### ```.send (params) -> Net```

Send a message to nodes specified by **params**.

**params** are:

* **as** - name of the node sending.
* **to** - names of nodes to send to.
  * **to.node** - names of nodes to send to.
  * **to.gate** - names of gate to send to, **to.node** is required if
  **to.gate** is set.
* **topic** - a name of a topic to send the message of.
* **data** - optional message payload.
* **success** - optional success handler ([handler params](#)).
* **error** - optional error handler ([handler params](#)).
* **options**
  * **options.timeout**

_Not used directly normally, but [through nodes](#listen-params-net)._

#### ```.unlisten (params) -> Net```

Removes handlers on messages sent from nodes specified by **params**.

**params** are:

* **as** - name of the node listening.
* **to** - names of nodes to stop listen to.
  * **to.node** - names of nodes to stop listen to.
  * **to.gate** - names of gates to stop listen to, note that **to.node** is
  optional here, unlike in [.listen](#).
* **topic** - names of topics of messages to stop listen on.
* **handler** - handlers to stop execute on message ([handler params](#)).

_Not used directly normally, but [through nodes](#listen-params-net)._

#### ```.node (name) -> Node```

Returns a node under specified **name**.

#### ```.names (node) -> String[]```

Returns a **node** names under which it is registered in the network.

## ```Node(obj)```

When **obj** is passed its properties are set on newly created **Node**
instance.

#### ```.listen (params) -> Node```

Passes **params** to a network's [```.listen```](#) method with **params.as**
param set to **name** under which node is registered in the network.

#### ```.send (params) -> Node```

Passes **params** to a network's [```.send```](#) method with **params.as**
param set to **name** under which node is registered in the network.

#### ```.unlisten (params) -> Node```

Passes **params** to a network's [```.unlisten```](#) method with **params.as**
param set to **name** under which node is registered in the network.

## ```Gate(options)```

Extends **Node** class. Includes specific implementation for inter-network
event passing.

**options** are:

* **MAX_HELD_CB_COUNT** - Number of callbacks to hold, wating for possible call
triggered by other network.

#### ```.listen (params) -> Gate```

Overrides **Node** [.listen](#) method. Ignores passed **params.handler** param.

#### ```._transfer (data) * throws```

Method to override if new gate type is needed.

## ```MemoryGate()```

Extends **Gate** class. Includes specific implementation for inter-network
event passing for the networks in the same memory.

#### ```.link (memorygate) -> MemoryGate```

Sets link to other **MemoryGate** node connected to other network to pass inter-
network messages to.

#### ```.unlink () -> MemoryGate```

Unsets link to other **MemoryGate** node.

## TimeoutError ()

Thrown when a request is not responded within timeout.

## UnreachableNodeError ()

Thrown when sending new request or notification to destination node when that
node does not exist.

#### Handler function

```function (data, context)```

A function accepting message payload as its first param and message
[context](#) as its second param.

#### Context

An object with the following properties:

* **sender**
  * **sender.node**
  * **sender.gate**
* **topic**
* **reply**
* **refuse**

Examples
===

### Ping-pong example

### Map-reduce example
-->
