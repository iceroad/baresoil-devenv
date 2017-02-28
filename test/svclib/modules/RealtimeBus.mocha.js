var _ = require('lodash')
  , assert = require('chai').assert
  , async = require('async')
  , config = require('../../../lib/config/default')
  , construct = require('runtype').construct
  , crypto = require('crypto')
  , fakedata = require('../../fakedata')
  , fmt = require('util').format
  , initLibrary = require('../../../lib/types/initLibrary')
  , json = JSON.stringify
  , temp = require('temp').track()
  , sinon = require('sinon')
  , util = require('util')
  , Svclib = require('../../../lib/svclib/Svclib')
  ;

describe('Svclib:RealtimeBus: real-time pub/sub message bus', function() {
  var svclib, baseConnection, SvclibRequest, testChannel, testMessage;
  var nextRequestId = 1;

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
    if (process.env.VERBOSE) {
      svclib.on('*', console.log);
      svclib.on('$accept', console.log);
    }

    testChannel = 'test_channel_' + _.random(0, 1e100);
    testMessage = crypto.randomBytes(80).toString('base64');

    SvclibRequest = function(service, fnName, args, cb) {
      var svclibRequest = construct('SvclibRequest', {
        requestId: nextRequestId++,
        service: service,
        function: fnName,
        arguments: args,
      });
      svclib.once('svclib_response', function(baseConnection, svclibResponse) {
        return cb(null, svclibResponse);
      });
      svclib.accept('svclib_request', baseConnection, svclibRequest);
    }
    svclib.start(cb);
  });

  afterEach(function(cb) {
    svclib.stop(cb);
  });


  this.slow(500);


  it('should correctly perform single-channel pub/sub echo', function(cb) {
    return async.series([
      // First call listen() to subscribe to a channel.
      function(cb) {
        return SvclibRequest('RealtimeBus', 'listen', [
          {
            channelId: testChannel,
          },
        ], function(baseConnection, svclibResponse) {
          // Ensure set() returned without error.
          assert.isNotOk(svclibResponse.error);
          return cb();
        });
      },
      // Now call broadcast, and expect to pick up an stdlib_event.
      function(cb) {
        svclib.on('svclib_event', function(baseConnection, svclibEvent) {
          assert.strictEqual(svclibEvent.name, 'channel_message');
          assert.deepEqual(svclibEvent.data, {
            channelId: testChannel,
            message: testMessage,
          });
          return cb();
        });
        return SvclibRequest('RealtimeBus', 'broadcast', {
          channelList: [testChannel],
          message: testMessage,
        }, function(baseConnection, svclibResponse) {
          // Ensure set() returned without error.
          assert.isNotOk(svclibResponse.error);
        });
      },
    ], cb);
  });


  it('should correctly perform multi-channel pub/sub echo', function(cb) {
    return async.series([
      // First call listen() to subscribe to two channels.
      function(cb) {
        return SvclibRequest('RealtimeBus', 'listen', [
          {
            channelId: testChannel,
          },
          {
            channelId: testChannel + ':2',
          },
        ], function(baseConnection, svclibResponse) {
          // Ensure set() returned without error.
          assert.isNotOk(svclibResponse.error);
          return cb();
        });
      },
      // Now call broadcast, and expect to pick up two stdlib_event instances.
      function(cb) {
        var msgCount = 0;
        svclib.on('svclib_event', function(baseConnection, svclibEvent) {
          assert.strictEqual(svclibEvent.name, 'channel_message');
          if (++msgCount === 2) {
            return cb();
          }
        });
        return SvclibRequest('RealtimeBus', 'broadcast', {
          channelList: [testChannel, testChannel + ':2'],
          message: testMessage,
        }, function(baseConnection, svclibResponse) {
          // Ensure set() returned without error.
          assert.isNotOk(svclibResponse.error);
        });
      },
    ], cb);
  });

});
