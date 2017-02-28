var _ = require('lodash')
  , assert = require('assert')
  , codes = require('./codes')
  , util = require('util')
  ;


function PublicError(errcode, overrides) {
  assert(_.isString(errcode), 'Error code must be a string.');
  assert(codes[errcode], 'Unknown error code ' + errcode);
  Error.captureStackTrace(this, this.constructor);
  _.merge(this, _.cloneDeep(codes[errcode]), overrides);
  this.name = this.constructor.name;
  this.code = errcode;
};

PublicError.prototype.isPublicError = function() {
  return (this instanceof PublicError);
};

PublicError.fromNativeException = function(exc) {
  return new PublicError('internal', {
    exception: exc.message,
    exceptionStack: exc.stack.toString(),
  });
}

util.inherits(PublicError, Error);

module.exports = PublicError;
