var _ = require('lodash')
  , assert = require('chai').assert
  , construct = require('..').construct
  , types = require('..').library
  , fmt = require('util').format
  ;


describe('construct(): check a value against a schema', function() {
  var sampleType;

  before(() => {
    types.SampleType = {
      type: 'object',
      fields: {
        testField: {
          type: 'string'
        }
      }
    }
    sampleType = {
      testField: 'hello'
    };
  })

  it('should construct primitive values', function() {
    assert.strictEqual(123, construct({
      type: 'integer',
    }, 123));
    assert.strictEqual(123.45, construct({
      type: 'number',
    }, 123.45));
    assert.strictEqual(123, construct({
      type: 'literal',
      value: 123
    }, 123));
    assert.strictEqual('abcd', construct({
      type: 'string',
    }, 'abcd'));
  });


  it('should construct from explicit and library typedefs', function() {
    var stImplicit = construct('SampleType', sampleType);
    var stExplicit = construct(types.SampleType, sampleType);
    assert.deepEqual(stImplicit, stExplicit);
  });


  it('should throw on unrecognized fields', function() {
    var badSampleType = _.clone(sampleType);
    badSampleType.newField = 123;
    assert.throws(function() { construct('SampleType', badsampleType); });
  });


  it('should throw on unrecognized types', function() {
    assert.throws(function() { construct('InvalidType', sampleType); });
    assert.throws(function() { construct({
      type: 'object',
      fields: {
        badref: {
          type: 'BadReference'
        },
      },
    }, {badref: 123}); }, /unknown type/i);
  });


  it('should throw on invalid type specifications', function() {
    assert.throws(function() { construct(123, {}); });
    assert.throws(function() { construct({type: 123}, {}); });
  }, /invalid type definition/i);


  it('should throw on missing fields', function() {
    var badSampleType = _.clone(sampleType);
    delete badSampleType.testField;
    assert.throws(
        function() { construct('SampleType', badSampleType); },
        /expected a string, got undefined/i);
  });


 it('should ignore missing, optional fields', function() {
    var optionalType = {
      type: 'object',
      fields: {
        opto: {
          optional: true,
          type: 'integer'
        }
      }
    }
    assert.doesNotThrow(function() { construct(optionalType, {}); });
  });


  it('should construct nested named fields', function() {
    var nestedTypeDef = {
      type: 'object',
      fields: {
        SampleType: {
          type: 'SampleType',
        },
      },
    };
    var nested = construct(nestedTypeDef, {SampleType: sampleType});
    assert.deepEqual(nested, {SampleType: sampleType});
  });


  it('should validate ad-hoc nested schemas', function() {
    var fn = construct.bind({}, {
      type: 'object',
      fields: {
        abc: {
          type: 'literal',
          value: 123,
        },
        def: {
          type: 'object',
          fields: {
            defInner: {
              type: 'string',
            },
          },
        },
      },
    });

    assert.doesNotThrow(function() {
      var rv = fn({
        abc: 123,
        def: {
          defInner: 'ghi'
        },
      });
      assert.deepEqual(rv, {
        abc: 123,
        def: {
          defInner: 'ghi',
        },
      });
    });

    assert.throws(function() {
      var rv = fn({
        abc: 1234,
        def: {
          defInner: 'ghi'
        },
      });
    });

    assert.throws(function() {
      var rv = fn({
        abc: 123,
        def: {
          defInner: null
        },
      });
    });
  });


  it('should construct uniformly typed arrays', function() {
    var uniformTyped = {
      type: 'array',
      elementType: 'SampleType',
      minElements: 3,
      maxElements: 4,
    };
    assert.doesNotThrow(function() {
      construct(uniformTyped, [sampleType, sampleType, sampleType]);
      construct(uniformTyped, [sampleType, sampleType, sampleType, sampleType]);
    });
    assert.throws(function() {
      construct(uniformTyped, [sampleType, sampleType, sampleType, sampleType, sampleType]);
    }, /<=/i);
    assert.throws(function() {
      construct(uniformTyped, [sampleType, sampleType]);
    }, />=/i);
    var badSampleType = _.clone(sampleType);
    delete badSampleType.testField;
    assert.throws(function() {
      construct(uniformTyped, [sampleType, sampleType, badSampleType]);
    }, /Index 2.testField: expected a string, got undefined./i);
  });


  it('should construct per-index typed arrays', function() {
    var perIndexTyped = {
      type: 'array',
      elements: [
        { type: 'literal', value: 'a_literal_string' },
        { type: 'SampleType' },
      ],
    };
    assert.doesNotThrow(function() {
      construct(perIndexTyped, ['a_literal_string', sampleType]);
    });
    assert.throws(function() {
      construct(perIndexTyped, [sampleType, sampleType]);
    }, /Index 0/i);
    assert.throws(function() {
      construct(perIndexTyped, [sampleType]);
    }, /expected an array of length 2/i);
    assert.throws(function() {
      construct(perIndexTyped);
    }, /expected an array/i);
  });


  it('should pass-through untyped arrays', function() {
    var untyped = {
      type: 'array',
    };
    assert.doesNotThrow(function() {
      construct(untyped, ['a_literal_string', sampleType]);
      construct(untyped, [sampleType, sampleType]);
      construct(untyped, [sampleType]);
      construct(untyped, []);
    });
  });
});

