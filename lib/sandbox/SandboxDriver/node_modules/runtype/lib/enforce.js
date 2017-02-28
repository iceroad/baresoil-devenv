var _ = require('lodash')
  , assert = require('assert')
  , construct = require('./construct')
  , fmt = require('util').format
  ;


function enforce(targetFunction) {
  if (!_.isFunction(targetFunction)) {
    throw new Error('argument must be a function');
  }
  var schema = targetFunction.$schema;
  if (!schema || !_.isObject(schema)) {
    throw new Error('argument does not have a $schema property');
  }
  var schemaArgs = schema.arguments;
  if (!schemaArgs || !_.isObject(schemaArgs)) {
    throw new Error('argument does not have a $schema.arguments property');
  }
  var schemaCbResult = schema.callbackResult;
  if (!schemaCbResult || !_.isObject(schemaCbResult)) {
    throw new Error('argument does not have a $schema.callbackResult property');
  }

  return function() {
    var args = Array.prototype.slice.call(arguments);
    if (!args.length) {
      throw new Error(fmt(
          'Function "%s" invoked without arguments, require a callback.',
          targetFunction.name));
    }

    //
    // Splice callback out of arguments array.
    //
    var originalCb = _.last(args);
    if (!_.isFunction(originalCb)) {
      throw new Error(fmt(
          'Function "%s" invoked without a callback as the last argument.',
          targetFunction.name));
    }

    //
    // Type-check arguments against "arguments" schema, invoke callback with
    // schema validation errors.
    //
    var errorPrefix = fmt('Function "%s" arguments', targetFunction.name);
    try {
      construct(schemaArgs, args, errorPrefix);
    } catch(e) {
      return originalCb(e);
    }

    //
    // Replace callback argument with an intercepting callback function.
    //
    args.splice(args.length - 1, 1);
    args.push(function() {
      var args = Array.prototype.slice.call(arguments);
      var err = args.length ? args[0] : undefined;
      var results = args.length > 1 ? args.slice(1) : undefined;

      if (err) {
        // Pass errors through unfiltered.
        return originalCb(err);
      }

      // Type-check results.
      var errorPrefix = fmt('Function "%s" callback result', targetFunction.name);
      try {
        construct(schemaCbResult, results, errorPrefix);
      } catch(e) {
        return originalCb(e);
      }

      // Invoke original callback with arguments.
      return originalCb.apply({}, args);
    });

    //
    // Invoke target function, pass exceptions to callback.
    //
    var rv;
    try {
      rv = targetFunction.apply(this, args);
    } catch(e) {
      return originalCb(e);
    }
    return rv;
  };
};


module.exports = enforce;
