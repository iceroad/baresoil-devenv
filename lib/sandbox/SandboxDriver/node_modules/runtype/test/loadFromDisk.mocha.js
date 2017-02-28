var _ = require('lodash')
  , assert = require('chai').assert
  , construct = require('..').construct
  , fmt = require('util').format
  , loadFromDisk = require('..').loadFromDisk
  , path = require('path')
  ;


describe('Type library', function() {
  it('should load type specifications from disk', function() {
    assert.throws(function() {
      construct('TypeOnDisk', {
        testField: 123
      });
    });
    loadFromDisk(path.join(__dirname, 'test_types'));
    assert.doesNotThrow(function() {
      construct('TypeOnDisk', {
        testField: 123
      });
    });
  });
});

