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

    try {
      MatchesSomeSchema($schema.emits, args);
    } catch(e) {
      // emits schema not matched.
      throw new Error(fmt('Invalid emission: %s', e.message));
    }

    // At least 1 schema has matched the actual emission.
    oldEmitFn.apply(this, ['*', args]);
    return oldEmitFn.apply(this, args);
  };
}


EventProcessor.prototype.accept = function() {
  var $schema = this.$schema;
  var args = Array.prototype.slice.call(arguments);

  try {
    MatchesSomeSchema($schema.accepts, args);
  } catch(e) {
    // accepts schema not matched.
    throw new Error(fmt('Invalid input: %s', e.message));
  }

  // At least 1 schema has matched the input.
  if (typeof this[args[0]] == 'function') {
    process.nextTick(function() {
      this[args[0]].apply(this, args.slice(1));
    }.bind(this));
    this.oldEmitFn_.apply(this, _.concat('$accept', args));
    return this;
  }
  throw new Error(fmt('No handler registered for input "%s"', args[0]));
};


util.inherits(EventProcessor, EventEmitter);


//
// Match a value against a list of schema.
//
function MatchesSomeSchema(schemaList, value) {
  var bestError;

  for (var i = 0; i < schemaList.length; i++) {
    var schema = schemaList[i];
    var matchError;
    try {
      construct(schema, value);
    } catch(e) {
      matchError = e;
      continue;
    }
    matchError = undefined;
    break;
  }

  if (!matchError) {
    // This schema matches the value.
    return;
  }

  // Special-case matching of some schema/value pairs for better errors.
  if (schema.type === 'array' &&
      schema.elements.length &&
      schema.elements[0].type === 'literal' &&
      _.isArray(value) && value.length &&
      _.isString(value[0]) &&
      value[0] === schema.elements[0].value) {
    bestError = matchError;
  } else {
    if (!bestError) {
      bestError = matchError;
    }
  }

  throw bestError;
}


module.exports = EventProcessor;
