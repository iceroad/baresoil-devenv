var _ = require('lodash')
  , assert = require('chai').assert
  , typename = require('../lib/typename')
  ;


describe('Type reflection', function() {

  it('should recognize Buffer', function() {
    assert.strictEqual('buffer', typename(Buffer.from([1, 2, 3])));
  });

  it('should recognize arrays', function() {
    assert.strictEqual('array', typename([1, 2, 3]));
  });

  it('should recognize object', function() {
    assert.strictEqual('object', typename({}));
  });

  it('should recognize boolean', function() {
    assert.strictEqual('boolean', typename(true));
  });

  it('should recognize undefined', function() {
    assert.strictEqual('undefined', typename(undefined));
  });

  it('should recognize null', function() {
    assert.strictEqual('null', typename(null));
  });

  it('should recognize function', function() {
    assert.strictEqual('function', typename(function() {}));
  });
});
