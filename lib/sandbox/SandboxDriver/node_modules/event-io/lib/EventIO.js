const _ = require('lodash'),
  assert = require('assert'),
  construct = require('runtype').construct,
  library = require('runtype').library
  ;


class EventIO {
  constructor() {
    this.reset();
  }

  reset() {
    this.$acceptHandlers = {};   // event name -> handler function
    this.$emitListeners = {};    // event name -> event listeners
    this.$strictSchema = true;   // require schema for all accept() and emit()
  }

  extendTypeLibrary(newTypes) {
    _.extend(library, newTypes);
  }

  setStrictSchemaMode(strictMode) {
    assert(_.isBoolean(strictMode), 'require boolean');
    this.$strictSchema = strictMode;
  }

  setAcceptHandlers(handlerMap) {
    assert(_.isObject(handlerMap));
    const acceptHandlers = this.$acceptHandlers;
    _.forEach(handlerMap, (handlerFn, eventName) => {
      assert(_.isString(eventName), 'Expected string event name.');
      if (!handlerFn) {
        delete acceptHandlers[eventName];
      } else {
        assert(
            _.isFunction(handlerFn),
            `Handler "${eventName}" requires a function definition.`);
        acceptHandlers[eventName] = handlerFn;
      }
    });
  }

  on(eventName, handlerFn) {
    assert(_.isString(eventName), 'Expected string event name.');
    assert(_.isFunction(handlerFn), 'Expected handler function.');
    return this.upto(-1, eventName, handlerFn);
  }

  once(eventName, handlerFn) {
    return this.upto(1, eventName, handlerFn);
  }

  upto(eventCount, eventName, handlerFn) {
    const listeners = this.$emitListeners;
    listeners[eventName] = listeners[eventName] || [];
    listeners[eventName].push({
      fn: handlerFn,
      count: eventCount,
    });
    return handlerFn;
  }

  removeListener(eventName, handlerFn) {
    assert(_.isString(eventName), 'Expected string event name.');
    assert(_.isFunction(handlerFn), 'Expected handler function.');
    let listeners = this.$emitListeners;
    assert(eventName in listeners, `Unregistered event "${eventName}".`);
    listeners = listeners[eventName];
    let nRemoved = 0;
    for (let i = 0; i < listeners.length; i += 1) {
      if (listeners[i].fn === handlerFn) {
        listeners.splice(i, 1);
        i -= 1;
        nRemoved += 1;
      }
    }
    assert(nRemoved, `No such handler for event "${eventName}".`);
    return nRemoved;
  }

  removeEventListener(eventName, handlerFn) {
    return this.removeListener(eventName, handlerFn);
  }

  removeAllListeners(eventName) {
    let nRemoved = 0;

    if (_.isUndefined(eventName)) {
      // Remove all listeners for all events.
      nRemoved = _.sum(_.map(_.values(this.$emitListeners), _.size));
      this.$emitListeners = {};
      return nRemoved;
    }

    // Remove all listeners for a specific event type.
    assert(_.isString(eventName), 'Expected string event name.');
    const listeners = this.$emitListeners;
    if (_.isArray(listeners[eventName])) {
      nRemoved = listeners[eventName].length;
    }
    delete listeners[eventName];
    return nRemoved;
  }

  accept(eventName, ...argsArray) {
    assert(_.isString(eventName), 'Expected string event name.');

    //
    // Check for schema for this event.
    //
    let acceptSchema;
    if (_.isObject(this.$schema) && _.isObject(this.$schema.accept)) {
      acceptSchema = this.$schema.accept[eventName];
    }
    if (acceptSchema) {
      //
      // Validate argsArray against schema, throw on errors.
      //
      assert(
          _.isArray(acceptSchema),
          `Non-array schema found for accept event "${eventName}".`);
      try {
        construct({ type: 'array', elements: acceptSchema }, argsArray);
      } catch (e) {
        const errorMsg = e.message.toString();
        const except = new Error(
            `Invalid data for accept event "${eventName}": ${errorMsg}`);
        except.eventName = eventName;
        except.direction = 'accept';
        throw except;
      }
    } else {
      //
      // No schema, only allow in non-strict mode.
      //
      if (this.$strictSchema) {
        const except = new Error(`No schema for accept event "${eventName}".`);
        except.eventName = eventName;
        except.direction = 'accept';
        throw except;
      }
    }

    //
    // Get accept handler function for this event and execute it.
    //
    assert(
        eventName in this.$acceptHandlers,
        `No registered handler for accept event "${eventName}".`);
    const handlerFn = this.$acceptHandlers[eventName].bind(this);
    const rv = handlerFn(...argsArray);

    //
    // Invoke all listeners for catch-all "$accept" event.
    //
    const listeners = this.$emitListeners.$accept;
    if (listeners) {
      for (let i = 0; i < listeners.length; i += 1) {
        const listener = listeners[i];
        listener.fn(eventName, ...argsArray);
        if (listener.count !== -1) {
          listener.count -= 1;
          if (listener.count === 0) {
            listeners.splice(i, 1);
            i -= 1;
          }
        }
      }
      if (!listeners.length) {
        delete this.$emitListeners.$accept;
      }
    }

    return rv;
  }

  emit(eventName, ...argsArray) {
    assert(_.isString(eventName), 'Expected string event name.');

    //
    // Check for schema for this event.
    //
    let emitSchema;
    if (_.isObject(this.$schema) && _.isObject(this.$schema.emit)) {
      emitSchema = this.$schema.emit[eventName];
    }
    if (emitSchema) {
      //
      // Validate argsArray against schema, throw on errors.
      //
      assert(
          _.isArray(emitSchema),
          `Non-array schema found for emit event "${eventName}".`);
      try {
        construct({ type: 'array', elements: emitSchema }, argsArray);
      } catch (e) {
        const errorMsg = e.message.toString();
        const except = new Error(
            `Invalid data for emit event "${eventName}": ${errorMsg}`);
        except.eventName = eventName;
        except.direction = 'emit';
        throw except;
      }
    } else {
      //
      // No schema, only allow in non-strict mode.
      //
      if (this.$strictSchema) {
        const except = new Error(`No schema for emit event "${eventName}".`);
        except.eventName = eventName;
        except.direction = 'emit';
        throw except;
      }
    }

    //
    // Invoke all listeners for eventName synchronously.
    //
    let listeners = this.$emitListeners[eventName];
    if (listeners) {
      for (let i = 0; i < listeners.length; i += 1) {
        const listener = listeners[i];
        listener.fn(...argsArray);
        if (listener.count !== -1) {
          listener.count -= 1;
          if (listener.count === 0) {
            listeners.splice(i, 1);
            i -= 1;
          }
        }
      }
      if (!listeners.length) {
        delete this.$emitListeners[eventName];
      }
    }

    //
    // Invoke all listeners for catch-all "*" event.
    //
    listeners = this.$emitListeners['*'];
    if (listeners) {
      for (let i = 0; i < listeners.length; i += 1) {
        const listener = listeners[i];
        listener.fn(eventName, ...argsArray);
        if (listener.count !== -1) {
          listener.count -= 1;
          if (listener.count === 0) {
            listeners.splice(i, 1);
            i -= 1;
          }
        }
      }
      if (!listeners.length) {
        delete this.$emitListeners['*'];
      }
    }
  }
}


module.exports = EventIO;
