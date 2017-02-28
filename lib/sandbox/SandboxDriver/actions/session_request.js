var _ = require('lodash')
  , assert = require('assert')
  ;


module.exports = function(sessionRequestArg) {
  assert(this.isSandboxDriver());

  var respondFn = (function(sessionResponse) {
    this.emit.call(this, 'session_response', sessionResponse);
  }).bind(this);

  // Execute $session handler, or terminate session by default.
  var apiFn = _.get(this.handlers, '$session');
  if (_.isFunction(apiFn)) {
    var callArgs = [sessionRequestArg || null, function(err, result) {
      if (err) {
        return respondFn({
          ok: false,
          error: err.message,
        });
      }
      return respondFn({
        ok: true,
        result: result,
      });
    }];

    try {
      apiFn.apply(this, callArgs);
    } catch(e) {
      return respondFn({
        ok: false,
        error: 'Exception: ' + e.message,
        stack: e.stack
      });
    }
  } else {
    return respondFn({
      ok: true,
    });
  }
};
