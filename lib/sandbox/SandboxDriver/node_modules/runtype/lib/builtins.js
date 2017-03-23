// Built-in type validators.
//
var _ = require('lodash')
  , assert = require('assert')
  , fmt = require('util').format
  , typename = require('./typename')
  , util = require('util')
  , ErrorMessage = require('./ErrorMessage')
  ;


var BUILTINS = module.exports = {

  alphanumeric: function(typeDef, typeArg, errorPrefix) {
    assert(_.isObject(typeDef), 'Type definition must be an object.');
    BUILTINS.string(typeDef, typeArg, errorPrefix);
    if (!typeArg.match(/^[a-z0-9_]*$/i)) {
      throw ErrorMessage(errorPrefix, 'outside the alphanumeric character set.');
    }
    return typeArg;
  },


  any: function(typeDef, typeArg, errorPrefix) {
    assert(_.isObject(typeDef), 'Type definition must be an object.');
    if (typeDef.maxSize || typeDef.minSize) {
      // Must serialize to measure length.
      var serLength = JSON.stringify(typeArg).length;
      if (typeDef.minSize && serLength < typeDef.minSize) {
        throw ErrorMessage(errorPrefix, 'serialized size too small.');
      }
      if (typeDef.maxSize && serLength > typeDef.maxSize) {
        throw ErrorMessage(errorPrefix, 'serialized size too large.');
      }
    }
    return typeArg;
  },


  base64_buffer: function(typeDef, typeArg, errorPrefix) {
    assert(_.isObject(typeDef), 'Type definition must be an object.');
    BUILTINS.string(typeDef, typeArg, errorPrefix);
    if (typeArg.length % 4 !== 0) {
      throw ErrorMessage(errorPrefix, 'invalid Base64 string (length).');
    }
    if (typeArg === '') return typeArg;
    if (!typeArg.match(/^[A-Za-z0-9\+/]+={0,3}$/)) {
      throw ErrorMessage(errorPrefix, 'invalid Base64 string (character set).');
    }
    return typeArg;
  },


  boolean: function(typeDef, typeArg, errorPrefix) {
    if (!_.isBoolean(typeArg)) {
      throw ErrorMessage(errorPrefix, fmt(
          'expected a boolean, got %s.', typename(typeArg)));
    }
    return typeArg;
  },


  buffer: function(typeDef, typeArg, errorPrefix) {
    assert(_.isObject(typeDef), 'Type definition must be an object.');
    if (!Buffer.isBuffer(typeArg)) {
      throw ErrorMessage(errorPrefix, fmt(
          'expected a buffer, got %s.',  typename(typeArg)));
    }
    if (typeDef.minSize && typeArg.length < typeDef.minSize) {
      throw ErrorMessage(errorPrefix, fmt(
          'buffer too small, require >= %d bytes.', typeDef.minSize));
    }
    if (typeDef.maxSize && typeArg.length > typeDef.maxSize) {
      throw ErrorMessage(errorPrefix, fmt(
          'buffer too large, require <= %d bytes.', typeDef.maxSize));
    }
    return typeArg;
  },


  epoch_timestamp_ms: function(typeDef, typeArg, errorPrefix) {
    BUILTINS.integer(typeDef, typeArg, errorPrefix);

    //
    // NOTE: it is more important to detect timestamps incorrectly coded in
    // epoch seconds instead of milliseconds than it is to accomodate epoch
    // timestamps in the past, relative to some reasonable time marker.
    //
    // Any timestamp prior to MIN_EPOCH will be considered a mis-typed value.
    //
    var MIN_EPOCH_MS = 631152000000;  // Mon, 01 Jan 1990 00:00:00 GMT
    if (typeArg < MIN_EPOCH_MS) {
      throw ErrorMessage(errorPrefix, fmt(
        'timestamp %d is in the distant past, rejecting timestamp.', typeArg));
    }
    return typeArg;
  },


  factor: function(typeDef, typeArg, errorPrefix) {
    BUILTINS.string(typeDef, typeArg, errorPrefix);
    if (!_.find(typeDef.factors, function(f) { return f === typeArg; })) {
      throw ErrorMessage(errorPrefix, fmt(
        'factor "%s" is not valid.', typeArg));
    }
    return typeArg;
  },


  function: function(typeDef, typeArg, errorPrefix) {
    if (!_.isFunction(typeArg)) {
      throw ErrorMessage(errorPrefix, 'expected a function.', typeArg);
    }
    return typeArg;
  },


  hex_buffer: function(typeDef, typeArg, errorPrefix) {
    // Multiply length constraints by 2 for a hex string.
    var td = _.cloneDeep(typeDef);
    if (td.minLength) td.minLength *= 2;
    if (td.maxLength) td.maxLength *= 2;
    BUILTINS.string(td, typeArg, errorPrefix);
    if (!typeArg.match(/^[a-f0-9]+$/i)) {
      throw ErrorMessage(errorPrefix, fmt('not in the hexadecimal character set.'));
    }
    return typeArg;
  },


  integer: function(typeDef, typeArg, errorPrefix) {
    assert(_.isObject(typeDef), 'Type definition must be an object.');
    BUILTINS.number(typeDef, typeArg, errorPrefix);
    if (!_.isInteger(typeArg)) {
      throw ErrorMessage(errorPrefix, fmt(
          'expected an integer, got %s.', typename(typeArg)));
    }
    return typeArg;
  },


  ip_address: function(typeDef, typeArg, errorPrefix) {
    assert(_.isObject(typeDef), 'Type definition must be an object.');
    BUILTINS.string(typeDef, typeArg, errorPrefix);
    var isIPv6 = typeArg.match(/^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i);
    var isIPv4 = typeArg.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/);
    if (!isIPv4 && !isIPv6) {
      throw ErrorMessage(errorPrefix, 'not an IP address.');
    }
    return typeArg;
  },


  literal: function(typeDef, typeArg, errorPrefix) {
    assert(_.isObject(typeDef), 'Type definition must be an object.');
    if (typeArg !== typeDef.value) {
      throw ErrorMessage(errorPrefix, fmt(
          'expected literal <%s>, got %s.',
          typeDef.value, typeArg));
    }
    return typeArg;
  },


  number: function(typeDef, typeArg, errorPrefix) {
    assert(_.isObject(typeDef), 'Type definition must be an object.');
    if (!_.isNumber(typeArg)) {
      throw ErrorMessage(errorPrefix, fmt(
          'expected a number, got %s.', typename(typeArg)));
    }
    if ('minValue' in typeDef) {
      if (typeArg < typeDef.minValue) {
        throw ErrorMessage(errorPrefix, fmt(
          'expected a number >= %d, got %d.', typeDef.minValue, typeArg));
      }
    }
    if ('maxValue' in typeDef) {
      if (typeArg > typeDef.maxValue) {
        throw ErrorMessage(errorPrefix, fmt(
          'expected a number <= %d, got %d.', typeDef.maxValue, typeArg));
      }
    }
    return typeArg;
  },


  string: function(typeDef, typeArg, errorPrefix) {
    assert(_.isObject(typeDef), 'Type definition must be an object.');
    if (!_.isString(typeArg)) {
      throw ErrorMessage(errorPrefix, fmt(
          'expected a string, got %s.', typename(typeArg)));
    }
    if (typeDef.minLength && typeArg.length < typeDef.minLength) {
      throw ErrorMessage(errorPrefix, fmt(
          'string too short, require >= %d characters.', typeDef.minLength));
    }
    if (typeDef.maxLength && typeArg.length > typeDef.maxLength) {
      throw ErrorMessage(errorPrefix, fmt(
          'string too long, require <= %d characters.', typeDef.maxLength));
    }
    return typeArg;
  },

};
