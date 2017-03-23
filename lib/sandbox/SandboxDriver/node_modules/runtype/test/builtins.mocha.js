var _ = require('lodash')
  , assert = require('chai').assert
  , builtins = require('..').builtins
  , def = require('..').schemaDef
  , fmt = require('util').format
  ;


describe('Primitive types', function() {


  it('should validate "alphanumeric"', function() {
    var fn = builtins.alphanumeric.bind({}, {
      type: 'alphanumeric',
    });
    assert.doesNotThrow(function() { fn('abcdef0123'); });
    assert.doesNotThrow(function() { fn('_'); });
    assert.doesNotThrow(function() { fn(''); });

    assert.throws(function() { fn('..1/12'); }, /outside the alphanumeric/i);
    assert.throws(function() { fn(' abc'); }, /outside the alphanumeric/i);
    assert.throws(function() { fn('0123?'); }, /outside the alphanumeric/i);
  });


  it('should validate "any"', function() {
    var fn = builtins.any.bind({}, {
      type: 'any',
      minSize: 5,
      maxSize: 40,
    });
    assert.doesNotThrow(function() { fn({nested: 'string'}); });
    assert.doesNotThrow(function() { fn('just a plain string > 10 chars'); });

    assert.throws(function() { fn({}); }, /too small/i);
    assert.throws(function() { fn(null); }, /too small/i);
    assert.throws(function() { fn(
        'just a plain string > 40 chars, above maxSize'); }, /too large/i);
  });


  it('should validate "base64_buffer"', function() {
    var fn = builtins.base64_buffer.bind({}, {
      type: 'base64_buffer'
    });

    assert.doesNotThrow(function() { fn('abcdef=='); });
    assert.doesNotThrow(function() { fn('abcdefg='); });
    assert.doesNotThrow(function() { fn('abcdefgh'); });
    assert.doesNotThrow(function() { fn('abcde==='); });

    assert.throws(function() { fn('abcdefghi'); }, /invalid Base64/i);
    assert.throws(function() { fn('cat and mouse'); }, /invalid Base64/i);
    assert.throws(function() { fn('"jsonstr"'); }, /invalid Base64/i);
    assert.throws(function() { fn('===='); }, /invalid Base64/i);

    fn = builtins.base64_buffer.bind({}, {
      type: 'base64_buffer',
      minLength: 5,
      maxLength: 8,
    });

    assert.doesNotThrow(function() { fn('abcdef=='); });
    assert.doesNotThrow(function() { fn('abcdefg='); });
    assert.throws(function() { fn('abcdefghefgh'); }, /<=/i);
    assert.throws(function() { fn('abcd', />=/); });

    fn = builtins.base64_buffer.bind({}, {
      type: 'base64_buffer',
    });
    assert.doesNotThrow(function() { fn(''); });
  });


  it('should validate "buffer"', function() {
    var fn = builtins.buffer.bind({}, {
      type: 'buffer',
      maxSize: 3,
    });

    assert.doesNotThrow(function() { fn(Buffer.from([0])); });
    assert.doesNotThrow(function() { fn(Buffer.from([0, 1, 2])); });

    assert.throws(function() { fn(Buffer.from([0, 1, 2, 4])); });
    assert.throws(function() { fn('abcdefghi'); }, /got string/i);
    assert.throws(function() { fn({}); }, /got object/i);
    assert.throws(function() { fn([]); }, /got array/i);
  });


  it('should validate "boolean"', function() {
    var fn = builtins.boolean.bind({}, {type: 'boolean'});

    assert.doesNotThrow(function() { fn(true); });
    assert.doesNotThrow(function() { fn(false); });

    assert.throws(function() { fn('0.0.0.'); }, /got string/i);
    assert.throws(function() { fn(); }, /got undefined/i);
    assert.throws(function() { fn('true'); }, /got string/i);
    assert.throws(function() { fn(1); }, /got number/i);
  });


  it('should validate "epoch_timestamp_ms"', function() {
    var fn = builtins.epoch_timestamp_ms.bind({}, {type: 'epoch_timestamp_ms'});

    assert.doesNotThrow(function() { fn(Date.now()); });
    assert.doesNotThrow(function() { fn(Date.now() + 1e5); });

    assert.throws(function() { fn((new Date())); }, /expected a number/i);
    assert.throws(function() { fn((new Date()).toISOString()); }, /expected a number/i);
    assert.throws(function() { fn('127.0.0.1.0'); }, /expected a number/i);
    assert.throws(function() { fn(1472581934); }, /distant past/i);
  });


  it('should validate "factor"', function() {
    var fn = builtins.factor.bind({}, {
      type: 'factor',
      factors: ['a', 'b', 'c'],
    });
    assert.doesNotThrow(function() { fn('a'); });
    assert.doesNotThrow(function() { fn('b'); });
    assert.doesNotThrow(function() { fn('c'); });
    assert.throws(function() { fn('d'); }, /not valid/i);
  });


  it('should validate "function"', function() {
    var fn = builtins.function.bind({}, {
      type: 'function',
    });
    assert.throws(function() { fn('a'); }, /expected a function/i);
    assert.throws(function() { fn(); }, /expected a function/i);
    assert.doesNotThrow(function() { fn(function() {}); });
  });


  it('should validate "hex_buffer"', function() {
    var fn = builtins.hex_buffer.bind({}, {
      type: 'hex_buffer',
    });

    assert.doesNotThrow(function() { fn('abcdef0123456789'); });
    assert.doesNotThrow(function() { fn('0'); });

    assert.throws(function() { fn(0); }, /expected a string/i);
    assert.throws(function() { fn('0xff'); }, /not in the hexadecimal/i);
    assert.throws(function() { fn('deadpork'); }, /not in the hexadecimal/i);

    fn = builtins.hex_buffer.bind({}, {
      type: 'hex_buffer',
      minLength: 2,
      maxLength: 4,
    });

    assert.doesNotThrow(function() { fn('abcdef'); });
    assert.doesNotThrow(function() { fn('abcdefab'); });

    assert.throws(function() { fn(0); }, /expected a string/i);
    assert.throws(function() { fn('0xff'); }, /not in the hexadecimal/i);
    assert.throws(function() { fn('deadpork'); }, /not in the hexadecimal/i);
  });


  it('should validate "integer"', function() {
    var fn = builtins.integer.bind({}, {
      type: 'integer',
      minValue: 10,
      maxValue: 100,
    });
    assert.doesNotThrow(function() { fn(10); });
    assert.doesNotThrow(function() { fn(100); });
    assert.throws(function() { fn(9); }, />=/i);
    assert.throws(function() { fn(101); }, /<=/i);
    assert.throws(function() { fn(11.104); }, /expected an integer/i);
  });


  it('should validate "ip_address"', function() {
    var fn = builtins.ip_address.bind({}, {type: 'ip_address'});

    assert.doesNotThrow(function() { fn('127.0.0.1'); });
    assert.doesNotThrow(function() { fn('1.1.1.1'); });
    assert.doesNotThrow(function() { fn('FF02:0:0:0:0:0:0:12'); });

    assert.throws(function() { fn('0.0.0.'); }, /not an ip address/i);
    assert.throws(function() { fn('a.b.c.d'); }, /not an ip address/i);
    assert.throws(function() { fn('127.0.0.1.0'); }, /not an ip address/i);
  });


  it('should validate "literal"', function() {
    var fn = builtins.literal.bind({}, {
      type: 'literal',
      value: 'abcd',
    });
    assert.doesNotThrow(function() { fn('abcd'); });
    assert.throws(function() { fn('abc'); }, /expected literal <abcd>/i);
  });


  it('should validate "number"', function() {
    var fn = builtins.number.bind({}, {
      type: 'number',
      minValue: 10.15,
      maxValue: 10.69,
    });
    assert.doesNotThrow(function() { fn(10.16); });
    assert.doesNotThrow(function() { fn(10.50); });
    assert.throws(function() { fn(10); }, />=/i);
    assert.throws(function() { fn(11); }, /<=/i);
  });


  it('should validate "string"', function() {
    var fn = builtins.string.bind({}, {
      type: 'string',
      minLength: 1,
      maxLength: 16,
    });
    assert.doesNotThrow(function() { fn('abcdef0123456789'); });
    assert.doesNotThrow(function() { fn('0'); });

    assert.throws(function() { fn(0); }, /expected a string/i);
    assert.throws(function() { fn(''); }, /too short/i);
    assert.throws(function() { fn('abcdef0123456789x'); }, /too long/i);
  });

});
