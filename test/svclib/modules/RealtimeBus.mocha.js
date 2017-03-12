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
          assert.strictEqual(svclibEvent.module, 'RealtimeBus');
          assert.strictEqual(svclibEvent.name, 'message');
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
          assert.strictEqual(svclibEvent.module, 'RealtimeBus');
          assert.strictEqual(svclibEvent.name, 'message');
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


  it('should drop all subscriptions on "sandbox_exited" events', function(cb) {
    this.slow(300);

    return async.series([
      // First call listen() to subscribe to a few channel.
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

      // Send a "sandbox_exited" event to the service library and wait a bit.
      function(cb) {
        svclib.accept('sandbox_exited', baseConnection, {
          code: 123
        });
        return _.delay(cb, 10);
      },

      // Send a broadcast on one of the channels and expect *no* "svclib_event"
      // within a reasonable timeframe.
      function(cb) {
        var cbOnce = _.once(cb);
        svclib.on('svclib_event', function() {
          // Received a "svclib_event" even though a sandbox_exit was sent.
          return cbOnce(new Error('unsubscribe on exit failed.'));
        });
        return SvclibRequest('RealtimeBus', 'broadcast', {
          channelList: [testChannel],
          message: 123
        }, function(baseConnection, svclibResponse) {
          // Ensure broadcast() returns without error.
          assert.isNotOk(svclibResponse.error);

          // Wait a reasonable time for any stray svclib_event messages to be
          // received before ending the test.
          _.delay(cbOnce, 10);
        });
      },

    ], cb);
  });

});
