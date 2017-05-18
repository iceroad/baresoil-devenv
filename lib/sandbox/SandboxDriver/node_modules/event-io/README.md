# event-io

An ES6 class that combines an event emitter, an event acceptor, and runtime type checking. Can be used to design purely event-driven classes, rather than just event-producing as is the case with node's built-in `EventEmitter`.

This implementation does not require node's `EventEmitter` interface.


## Install

    npm install event-io

## Usage

The library exports the `EventIO` class, which is intended to be inherited from. This exposes the `setAcceptHandlers` method, which maps event names to the function that will be invoked on `accept()` calls. Multiple calls to `setAcceptHandlers` will be additive, i.e., previous handlers are not removed.

    const EventIO = require('event-io');

    class MyClass extends EventIO {
      constructor() {
        super();
        this.setAcceptHandlers({
          event_type_1 (...evtArgs, cb) {
            // handle incoming event of type "event_type_1" by emitting
            // an event of type "event_type_2" synchronously.
            this.emit('event_type_2', ...evtArgs);
          },
          event_type_2 (...evtArgs) {
            this.emit('event_type_3', true);
          }
        });
      }
    }

Add an accept and emit schema to the class. See the `runtype` npm package for details on the format of schemas.

    MyClass.prototype.$schema = {
      accept: {
        event_type_1: [
          // type definition of first argument
          {
            type: 'string'
          },
          // type definition of second argument
          {
            type: 'integer'
          }
        ]
      },
      emit: {
        event_type_2: [
          // type definition of first argument
          {
            type: 'string'
          },
          // type definition of second argument
          {
            type: 'integer'
          }
        ],
        event_type_3: [
          // type definition of first argument
          {
            type: 'boolean'
          }
        ]
      }
    };

To use an instance of the class.

    const inst = new MyClass();
    inst.accept('event_type_1', 'first_arg', 3);

This will invoke the `event_type_1` handler function with an `evtArgs` value of `['first_arg', 3]`. The `this` context of the function call will be the instance of the class, i.e., `inst` in the example above.

All calls to `accept()` and `emit()` will be type-checked according to the schema, and exceptions thrown if the schema does not match.  `accept()` and `emit()` are both synchronous functions, which means that `emit` listeners will be invoked immediately (without waiting for the next tick).

To listen to events being emitted from `inst`, use the functions `on`, `once`, and `upto` to register event listeners, and `removeListener` and `removeAllListeners` to remove them.

## Error Handling

Runtime type checks will catch values passed to `emit` and `accept` that do not match the specified schema. Exceptions are thrown immediately, which means that calls to `emit` and `accept` should always be wrapped in `try...catch` blocks.

The caught exception will contain the following fields.

  * `message` (string): Human-readable description of error.
  * `eventName` (string): Event name that was supplied for emit.
