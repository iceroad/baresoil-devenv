const _ = require('lodash'),
  assert = require('assert')
;


module.exports = function onRpcRequest(rpcRequest) {
  assert(this.isSandboxDriver());
  const respondFn = this.emit.bind(this, 'rpc_response');

  // Retrieve handler if it has been loaded.
  const apiFn = _.get(this.handlers, rpcRequest.function);
  if (!_.isFunction(apiFn)) {
    return respondFn({
      requestId: rpcRequest.requestId,
      error: {
        code: 'api_error:no_such_function',
        message: `No function "${rpcRequest.function}" found in API.`,
      },
    });
  }

  // Pass "arguments" field to handler function as first argument if defined.
  const fnArgs = [];
  if ('arguments' in rpcRequest) {
    fnArgs.push(rpcRequest.arguments);
  }
  fnArgs.push((err, result) => {
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
      result,
    });
  });

  // Apply function.
  try {
    return apiFn.call(this, ...fnArgs);
  } catch (e) {
    // Write exception with stack trace to sandbox log.
    console.error(e);

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
