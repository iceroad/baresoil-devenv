var _ = require('lodash')
  , assert = require('assert')
  , construct = require('runtype').construct
  , fmt = require('util').format
  ;


module.exports = function(baseConnection, svclibRequest) {
  assert(this.isSvclib());

  // Locate service module.
  var mod = this.modules_[svclibRequest.service];
  if (!mod || !_.isObject(mod)) {
    return this.emit('svclib_response', baseConnection, construct('SvclibResponse', {
      requestId: svclibRequest.requestId,
      error: {
        message: fmt('Unknown service "%s" requested.', svclibRequest.service),
      },
    }));
  }

  // Locate function inside module.
  var fn = mod.$functions[svclibRequest.function];
  if (!fn || !_.isFunction(fn)) {
    return this.emit('svclib_response', baseConnection, construct('SvclibResponse', {
      requestId: svclibRequest.requestId,
      error: {
        message: fmt(
            'Unknown function "%s.%s" requested.',
            svclibRequest.service, svclibRequest.function),
      },
    }));
  }

  // Match function input schema to svclibRequest 'arguments'.
  var fnSchema = fn.$schema;
  assert(_.isObject(fnSchema));
  if (!_.some(fnSchema.input, function(schemaDef) {
    try {
      construct(schemaDef, svclibRequest.arguments);
      return schemaDef;
    } catch(e) { }
  })) {
    return this.emit('svclib_response', baseConnection, construct('SvclibResponse', {
      requestId: svclibRequest.requestId,
      error: {
        message: fmt(
            'Invalid arguments for function "%s.%s".',
            svclibRequest.service, svclibRequest.function),
      },
    }));
  }

  // Call module function asynchronously.
  var args = [baseConnection, svclibRequest.arguments, function(err, result) {
    assert(this.isSvclib());

    var svclibResponse = {
      requestId: svclibRequest.requestId,
    };

    if (err) {
      svclibResponse.error = err;
    }

    if (result) {
      svclibResponse.result = result;
      if (!_.some(fnSchema.output, function(schemaDef) {
        try {
          construct(schemaDef, svclibResponse.result);
          return schemaDef;
        } catch(e) { }
      })) {
        return this.emit('svclib_response', baseConnection, construct('SvclibResponse', {
          requestId: svclibRequest.requestId,
          error: {
            message: fmt(
                'Invalid evaluation result for function "%s.%s".',
                svclibRequest.service, svclibRequest.function),
          },
        }));
      }
    }

    svclibResponse = construct('SvclibResponse', svclibResponse);
    return this.emit('svclib_response', baseConnection, svclibResponse);
  }.bind(this)];

  return fn.apply(this, args);
};
