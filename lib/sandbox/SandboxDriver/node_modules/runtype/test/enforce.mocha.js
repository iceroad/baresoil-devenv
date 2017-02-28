var _ = require('lodash')
  , assert = require('chai').assert
  , async = require('async')
  , def = require('..').schemaDef
  , enforce = require('..').enforce
  , types = require('..').library
  , fmt = require('util').format
  ;


describe('enforce(): wrap async functions with runtime type checking',
    function() {
  before(function() {
    types.SampleType = {
      type: 'object',
      fields: {
        testField: {
          type: 'string'
        }
      }
    }
    types.SampleReturnType = {
      type: 'literal',
      value: 'hello',
    };
  })

  it('should wrap a target function and its callback result', function(cb) {
    var sampleFunc = function(arg, cb) {
      assert.strictEqual(arg.testField, 'hello');
      return cb(null, arg.testField);
    };
    sampleFunc.$schema = {
      arguments: def.TypedArray([
        def.Type('SampleType'),
        def.Callback(),
      ]),
      callbackResult: def.TypedArray([
        def.Type('SampleReturnType'),
      ]),
    };
    var enforcedFunc = enforce(sampleFunc);

    return async.series([
      function(cb) {
        enforcedFunc(function(err) {
          assert.isOk(err);
          assert.match(
              err.message,
              /Function "sampleFunc" arguments: expected an array of length 2/i);
          return cb();
        });
      },

      function(cb) {
        enforcedFunc({testField: 'hello'}, function(err, result) {
          assert.isNotOk(err);
          assert.strictEqual(result, 'hello');
          return cb();
        });
      },

      function(cb) {
        enforcedFunc({testField: 'not_hello'}, function(err, result) {
          assert.isOk(err);
          assert.match(
              err.message,
              /expected \'not_hello\' to equal \'hello\'/i);
          assert.isUndefined(result);
          return cb();
        });
      },

    ], cb);
  });


  it('should pass errors through via the callback', function(cb) {
    var sampleFunc = function(cb) {
      return cb(new Error('no-go, bro'));
    };
    sampleFunc.$schema = {
      arguments: def.TypedArray([
        def.Callback(),
      ]),
      callbackResult: def.TypedArray([
      ]),
    };
    var enforcedFunc = enforce(sampleFunc);
    enforcedFunc(function(err, result) {
      assert.isOk(err);
      assert.match(err.message, /no-go, bro/);
      assert.isUndefined(result);
      return cb();
    });
  });


  it('should throw immediately on attempts to wrap untyped functions',
      function() {

    assert.throws(function() {
      enforce();
    }, /argument must be a function/i);

    assert.throws(function() {
      enforce(function() {});
    }, /does not have a \$schema property/i);

    assert.throws(function() {
      var sampleFunc = function() {};
      sampleFunc.$schema = {};
      enforce(sampleFunc);
    }, /does not have a \$schema.arguments property/i);

    assert.throws(function() {
      var sampleFunc = function() {};
      sampleFunc.$schema = {
        arguments: {}
      };
      enforce(sampleFunc);
    }, /does not have a \$schema.callbackResult property/i);

    assert.doesNotThrow(function() {
      var sampleFunc = function() {};
      sampleFunc.$schema = {
        arguments: {},
        callbackResult: {}
      };
      enforce(sampleFunc);
    });

    assert.throws(function() {
      var sampleFunc = function() {};
      sampleFunc.$schema = {
        arguments: {},
        callbackResult: {}
      };
      var enforced = enforce(sampleFunc);
      enforced();
    }, /require a callback/i);

    assert.throws(function() {
      var sampleFunc = function() {};
      sampleFunc.$schema = {
        arguments: {
          type: 'array',
          elements: [
            {type: 'integer'},
            {type: 'function'},
          ]
        },
        callbackResult: {}
      };
      var enforced = enforce(sampleFunc);
      enforced(1);
    }, /invoked without a callback/i);
  });
});

