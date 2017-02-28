var _ = require('lodash')
  , construct = require('runtype').construct
  , fmt = require('util').format
  , json = JSON.stringify
  , util = require('util')
  , EventEmitter = require('events')
  ;


function EventProcessor() {
  EventEmitter.call(this);

  //
  // Look for an emit/accept schema for the child object.
  //
  var $schema = this.$schema;
  if (!_.isObject($schema)) {
    throw new Error('No $schema defined on module.');
  }

  //
  // Monkey-patch the base EventEmitter "emit" function to
  //
  //   (a) emit a "*" catch-all event
  //   (b) match emissions to an output schema
  //
  var oldEmitFn = this.oldEmitFn_ = this.emit.bind(this);
  this.emit = function() {
    var args = Array.prototype.slice.call(arguments);
    if (_.some($schema.emits, function(typeDef) {
      try {
        var rv = construct(typeDef, args);
        return rv;
      } catch(e) { }
    })) {
      // At least 1 schema has matched the actual emission.
      oldEmitFn.apply(this, ['*', args]);
      return oldEmitFn.apply(this, args);
    } else {
      // Emit schema not matched.
      throw new Error(
          'Invalid call to emit(), no schema match for: ' + json(args, null, 2));
    }
  };
}


EventProcessor.prototype.accept = function() {
  var $schema = this.$schema;
  var args = Array.prototype.slice.call(arguments);
  var matchErrors = [];

  if (_.some($schema.accepts, function(typeDef) {
    try {
      var rv = construct(typeDef, args);
      return rv;
    } catch(e) {
      matchErrors.push(e.message);
    }
  })) {
    // At least 1 schema has matched the input.
    if (typeof this[args[0]] == 'function') {
      process.nextTick(function() {
        this[args[0]].apply(this, args.slice(1));
      }.bind(this));
      this.oldEmitFn_.apply(this, _.concat('$accept', args));
      return this;
    }
    throw new Error(fmt('No handler registered for input "%s"', args[0]));
  }

  // Emit schema not matched.
  throw new Error(fmt(
      'Invalid call to accept(), no schema match for: %s.\nMatch errors:\n%s.',
      json(args, null, 2), matchErrors.join('\n')));
};


util.inherits(EventProcessor, EventEmitter);


module.exports = EventProcessor;
