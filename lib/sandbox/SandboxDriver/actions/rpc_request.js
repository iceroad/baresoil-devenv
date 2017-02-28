var _ = require('lodash')
  , assert = require('assert')
  , fmt = require('util').format
  , json = JSON.stringify
  ;


module.exports = function(rpcRequest) {
  assert(this.isSandboxDriver());

  var respondFn = function(rpcResponse) {
    this.emit.call(this, 'rpc_response', rpcResponse);
  }.bind(this);

  // Retrieve handler if it has been loaded.
  var apiFn = _.get(this.handlers, rpcRequest.function);
  if (!_.isFunction(apiFn)) {
    return respondFn({
      requestId: rpcRequest.requestId,
      error: {
        code: 'api_error:no_such_function',
        message: fmt(
            'No function "%s" found in API.', rpcRequest.function),
      },
    });
  }

  // Pass "arguments" field to handler function as first argument.
  var fnArgs = _.filter([rpcRequest.arguments]);

  // Add a callback function to collect function call response.
  fnArgs.push(function(err, result) {
    if (err) {
      return respondFn({
        requestId: rpcRequest.requestId,
        error: {
          code: 'api_error:handler_error',
          message: _.toString(err.message),
          function: rpcRequest.function,
        },
      });
    }
    return respondFn({
      requestId: rpcRequest.requestId,
      result: result,
    });
  });

  // Apply function.
  try {
    return apiFn.apply(this, fnArgs);
  } catch(e) {
    // Synchronously thrown exception is usually invalid user input.
    return respondFn({
      requestId: rpcRequest.requestId,
      error: {
        code: 'api_error:exception',
        message: e.message.toString(),
        function: rpcRequest.function,
      },
    });
  }
};
