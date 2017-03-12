var _ = require('lodash')
  , archive = require('../../lib/util/archive')
  , assert = require('chai').assert
  , async = require('async')
  , config = require('../../lib/config/default')
  , crypto = require('crypto')
  , fakedata = require('../fakedata')
  , fmt = require('util').format
  , fs = require('fs')
  , initLibrary = require('../../lib/types/initLibrary')
  , json = JSON.stringify
  , path = require('path')
  , temp = require('temp').track()
  , Sandbox = require('../../lib/sandbox/Sandbox')
  ;


describe('Sandbox', function() {
  var sandbox, tarball, emissions, baseConnection;
  var svclibInterface = fakedata.SvclibInterface();

  this.slow(1200);
  this.timeout(5000);

  before(function(cb) {
    initLibrary();
    archive.makeArchive(path.join(__dirname, '..', 'test_projects',
        'minimal', 'server'), function(err, tgz) {
      if (err) return cb(err);
      tarball = tgz;
      return cb();
    });
  });

  beforeEach(function(cb) {
    baseConnection = fakedata.BaseConnection();
    sandbox = new Sandbox(_.merge({}, config, {
      dev: {
        data_root: temp.mkdirSync(),
        verbose: true,
      },
    }));
    emissions = [];
    sandbox.on('*', function(argsArray) {
      if (process.env.VERBOSE) {
        console.log(json(argsArray));
      }
      emissions.push(argsArray);
    });
    sandbox.accept('start_sandbox', {
      package: tarball.toString('base64'),
      baseConnection: baseConnection,
      svclibInterface: svclibInterface,
    });
    sandbox.on('sandbox_stderr', function(stderrStr) {
      if (process.env.VERBOSE) {
        console.error(stderrStr);
      }
    });
    return sandbox.once('sandbox_started', cb);
  });

  afterEach(function(cb) {
    if (!sandbox.isRunning()) {
      return cb();
    }
    sandbox.accept('stop_sandbox');
    sandbox.once('sandbox_exited', cb);
  });


  it('should spawn the test userland and be able to run RPC requests',
      function(cb) {
    async.series([
      // Version 1: implicit conversion of fnArgs to array.
      function(cb) {
        sandbox.accept('rpc_request', {
          requestId: 1,
          function: 'echo',
          arguments: 123,
        });
        sandbox.once('rpc_response', function(rpcResponse) {
          assert.deepEqual(rpcResponse, {
            requestId: 1,
            result: 123,
          });
          return cb();
        });
      },

      // Version 2: implicit fnArgs array.
      function(cb) {
        sandbox.accept('rpc_request', {
          requestId: 2,
          function: 'echo',
          arguments: [123],
        });
        sandbox.once('rpc_response', function(rpcResponse) {
          assert.deepEqual(rpcResponse, {
            requestId: 2,
            result: [123],
          });
          return cb();
        });
      },
    ], cb);
  });


  it('should emit "sandbox_stdout" and "sandbox_stderr" events',
      function(cb) {
    sandbox.accept('rpc_request', {
      requestId: 1,
      function: 'test-logs',
      arguments: 123,
    });
    sandbox.once('sandbox_exited', function(rpcResponse) {
      _.delay(function() {
        assert.deepEqual(_.sortBy(_.uniq(_.map(emissions, _.first))), [
          // Must be in sorted order below
          'rpc_response',
          'sandbox_exited',
          'sandbox_started',
          'sandbox_stderr',
          'sandbox_stdout',
        ]);
        return cb();
      }, 50);
    });
  });


  it('should emit "sandbox_exited" events on receiving "stop_sandbox"',
      function(cb) {
    _.delay(function() {
      sandbox.accept('stop_sandbox');
    }, 20);
    sandbox.once('sandbox_exited', function() {
      return cb();
    });
  });


  it('should buffer messages until the sandbox starts', function(cb) {
    // Special-case construction of a new sandbox in order to test buffering
    // within the same call frame (the test harness sandbox has already been
    // initialized by this point, and so cannot be used).
    var sb = new Sandbox(_.merge({}, config, {
      dev: {
        data_root: temp.mkdirSync(),
        verbose: true,
      },
    }));
    sb.accept('start_sandbox', {
      package: tarball.toString('base64'),
      baseConnection: fakedata.BaseConnection(),
      svclibInterface: svclibInterface,
    });
    sb.accept('rpc_request', {
      function: 'echo',
      arguments: 'hello',
      requestId: 1,
    });
    sb.once('rpc_response', function(rpcResponse) {
      assert.deepEqual(rpcResponse.result, 'hello');
      sb.accept('stop_sandbox');
      sb.once('sandbox_exited', function() {
        return cb();
      });
    });
  });


  it('should stubify svclib interface', function(cb) {
    sandbox.accept('rpc_request', {
      function: 'get-svclib-interface',
      requestId: 1,
    });
    sandbox.once('rpc_response', function(rpcResponse) {
      assert.isUndefined(rpcResponse.error);
      assert.deepEqual(rpcResponse.result, svclibInterface);
      return cb();
    });
  });


  it('should emit "user_event" sandbox events', function(cb) {
    sandbox.accept('rpc_request', {
      function: 'emit-user-event',
      requestId: 1,
    });
    sandbox.once('user_event', function(userEvent) {
      assert.deepEqual(userEvent, {"name":"test_event","data":{"testing":123}});
      return cb();
    });
  });

});
