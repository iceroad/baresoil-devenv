var _ = require('lodash')
  , assert = require('chai').assert
  , config = require('../../lib/config/default')
  , crypto = require('crypto')
  , fakedata = require('../fakedata')
  , fmt = require('util').format
  , fs = require('fs')
  , initLibrary = require('../../lib/types/initLibrary')
  , json = JSON.stringify
  , temp = require('temp').track()
  , sinon = require('sinon')
  , util = require('util')
  , Svclib = require('../../lib/svclib/Svclib')
  ;


describe('Svclib: Baresoil service library', function() {
  var svclib, emissions, baseConnection;

  before(function() {
    initLibrary();
  });

  beforeEach(function(cb) {
    baseConnection = fakedata.BaseConnection();
    svclib = new Svclib(_.merge({}, config, {
      dev: {
        data_root: temp.mkdirSync(),
        verbose: true,
      },
    }));
    emissions = [];
    svclib.on('*', emissions.push.bind(emissions));
    return svclib.start(cb);
  });

  afterEach(function(cb) {
    return svclib.stop(cb);
  });


  it('should route "svclib_request" to the correct module' , function(cb) {
    var kvdSetStub = sinon.stub(
        svclib.modules_.KVDataStore.$functions, 'set').yields();
    svclib.accept('svclib_request', baseConnection, {
      requestId: 3,
      service: 'KVDataStore',
      function: 'set',
      arguments: [
        {
          table: 'unit_test',
          key: 'test_key_' + _.random(1e10),
          value: _.random(),
        },
      ],
    });
    svclib.on('svclib_response', function(baseConnection, svclibResponse) {
      assert.isNotOk(svclibResponse.error);
      assert(kvdSetStub.calledOnce);
      svclib.modules_.KVDataStore.$functions.set.restore();
      return cb();
    });
  });


  it('should emit "svclib_interface" on start' , function(cb) {
    _.delay(function() {
      assert.strictEqual(emissions.length, 1);
      assert.strictEqual(emissions[0][0], 'svclib_interface');
      var svclibInterface = emissions[0][1];
      assert(_.isObject(svclibInterface));
      assert.deepEqual(svclibInterface, {
        "KVDataStore": {
          "get": 1,
          "set": 1,
          "update": 1
        },
        "RealtimeBus": {
          "broadcast": 1,
          "dropAll": 1,
          "listen": 1
        }
      });
      return cb();
    }, 10);
  });

});
