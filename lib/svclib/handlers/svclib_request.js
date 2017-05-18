const _ = require('lodash'),
  assert = require('assert'),
  construct = require('runtype').construct
  ;


module.exports = function SvclibSvclibRequest(baseConnection, svclibRequest) {
  assert(this.isSvclib());

  // Locate service module.
  const mod = this.modules_[svclibRequest.service];
  if (!mod || !_.isObject(mod)) {
    return this.emit('svclib_response', baseConnection, construct('SvclibResponse', {
      requestId: svclibRequest.requestId,
      error: {
        message: `Unknown service "${svclibRequest.service}" requested.`,
      },
    }));
  }

  // Locate function inside module.
  const fn = mod.$functions[svclibRequest.function];
  if (!fn || !_.isFunction(fn)) {
    this.emit('svclib_response', baseConnection, construct('SvclibResponse', {
      requestId: svclibRequest.requestId,
      error: {
        message:
            `Unknown function "${svclibRequest.service}.` +
            `${svclibRequest.function}" requested.`,
      },
    }));
    return;
  }

  // Call module function asynchronously.
  const args = svclibRequest.arguments;
  args.splice(0, 0, baseConnection);
  args.push((err, result) => {
    const svclibResponse = {
      requestId: svclibRequest.requestId,
    };
    if (err) {
      svclibResponse.error = err;
    }
    if (result) {
      svclibResponse.result = result;
    }

    return this.emit('svclib_response', baseConnection, svclibResponse);
  });

  let rv;
  try {
    rv = fn.call(this, ...args);
  } catch (e) {
    this.emit('svclib_response', baseConnection, construct('SvclibResponse', {
      requestId: svclibRequest.requestId,
      error: {
        code: 'internal',
        message:
            `Exception calling "${svclibRequest.service}.` +
            `${svclibRequest.function}": ${e.message}.`,
      },
    }));
  }

  return rv;
};
