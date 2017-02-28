var _ = require('lodash')
  , assert = require('chai').assert
  , async = require('async')
  , col = require('colors')
  , construct = require('runtype').construct
  , config = require('../../../../lib/config')
  , crypto = require('crypto')
  , fakedata = require('../../../fakedata')
  , fmt = require('util').format
  , fs = require('fs')
  , initLibrary = require('../../../../lib/types/initLibrary')
  , json = JSON.stringify
  , temp = require('temp').track()
  , sinon = require('sinon')
  , util = require('util')
  , Svclib = require('../../../../lib/svclib/Svclib')
  ;


function Harness() {
}

Harness.prototype.init = function(cb) {
  initLibrary();
  return cb();
};


Harness.prototype.beforeEach = function(cb) {
  this.baseConnection = fakedata.BaseConnection();
  var svclib = this.svclib = new Svclib(_.merge({}, config, {
    dev: {
      data_root: temp.mkdirSync(),
      verbose: true,
      fs_flush_frequency_ms: 200,
    },
  }));

  var nextRequestId = 1;
  this.testKey = 'test, key 💩 ' + _.random(0, 1e10);
  this.testValue = crypto.randomBytes(20).toString('base64');
  this.SvclibRequest = function(service, fnName, args, cb) {
    var svclibRequest = construct('SvclibRequest', {
      requestId: nextRequestId++,
      service: service,
      function: fnName,
      arguments: args,
    });
    svclib.once('svclib_response', function(baseConnection, response) {
      return cb(response.error, response.result);
    });
    svclib.accept('svclib_request', this.baseConnection, svclibRequest);
  }

  return svclib.start(cb);
};

Harness.prototype.afterEach = function(cb) {
  this.svclib.stop(cb);
};

module.exports = Harness;
