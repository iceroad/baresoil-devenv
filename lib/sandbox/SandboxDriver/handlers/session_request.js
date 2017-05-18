const _ = require('lodash'),
  assert = require('assert')
;


module.exports = function SandboxDriverSessionRequest(sessionRequestArg) {
  assert(this.isSandboxDriver());

  const respondFn = _.once((sessionResponse) => {
    this.emit.call(this, 'session_response', sessionResponse);
  });

  // Execute $session handler, or terminate session by default.
  const apiFn = _.get(this.handlers, '$session');
  if (_.isFunction(apiFn)) {
    const callArgs = [sessionRequestArg || null, (err, result) => {
      if (err) {
        return respondFn({
          ok: false,
          error: err.message,
        });
      }
      return respondFn({
        ok: true,
        result,
      });
    }];

    try {
      apiFn.apply(this, callArgs);
    } catch (e) {
      console.error(e);
      return respondFn({
        ok: false,
        error: `Exception: ${e.message}`,
        stack: e.stack.toString(),
      });
    }
  } else {
    return respondFn({
      ok: true,
    });
  }
};
