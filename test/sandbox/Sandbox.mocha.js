/* eslint no-undef: "ignore" */
const _ = require('lodash'),
  archive = require('../../lib/util/archive'),
  assert = require('chai').assert,
  async = require('async'),
  config = require('../../lib/config/default'),
  fakedata = require('../fakedata'),
  initLibrary = require('../initLibrary'),
  json = JSON.stringify,
  path = require('path'),
  temp = require('temp').track(),
  Sandbox = require('../../lib/sandbox/Sandbox')
  ;


describe('Sandbox', function () {
  let sandbox, tarball, emissions, baseConnection;
  const svclibInterface = fakedata.SvclibInterface();

  this.slow(1200);
  this.timeout(5000);

  before((cb) => {
    archive.makeArchive(path.join(__dirname, '..', 'test_projects',
        'minimal', 'server'), (err, tgz) => {
      if (err) return cb(err);
      tarball = tgz;
      return cb();
    });
  });

  beforeEach((cb) => {
    baseConnection = fakedata.BaseConnection();
    sandbox = new Sandbox(_.merge({}, config, {
      dev: {
        data_root: temp.mkdirSync(),
        verbose: true,
      },
    }));
    emissions = [];
    sandbox.on('*', (...argsArray) => {
      if (process.env.VERBOSE) {
        console.log(json(argsArray));
      }
      emissions.push(argsArray);
    });
    sandbox.accept('start_sandbox', {
      package: tarball.toString('base64'),
      baseConnection,
      svclibInterface,
    });
    sandbox.on('sandbox_stderr', (stderrStr) => {
      if (process.env.VERBOSE) {
        console.error(stderrStr);
      }
    });
    return sandbox.once('sandbox_started', cb);
  });

  afterEach((cb) => {
    if (!sandbox.isRunning()) {
      return cb();
    }
    sandbox.accept('stop_sandbox');
    sandbox.once('sandbox_exited', cb);
  });


  it('should spawn the test userland and be able to run RPC requests',
      (cb) => {
        async.series([
      // Version 1: implicit conversion of fnArgs to array.
          (cb) => {
            sandbox.accept('rpc_request', {
              requestId: 1,
              function: 'echo',
              arguments: 123,
            });
            sandbox.once('rpc_response', (rpcResponse) => {
              assert.deepEqual(rpcResponse, {
                requestId: 1,
                result: 123,
              });
              _.defer(cb);
            });
          },

      // Version 2: implicit fnArgs array.
          (cb) => {
            sandbox.accept('rpc_request', {
              requestId: 2,
              function: 'echo',
              arguments: [123],
            });
            sandbox.once('rpc_response', (rpcResponse) => {
              assert.deepEqual(rpcResponse, {
                requestId: 2,
                result: [123],
              });
              _.defer(cb);
            });
          },
        ], cb);
      });


  it('should emit "sandbox_stdout" and "sandbox_stderr" events',
      (cb) => {
        sandbox.accept('rpc_request', {
          requestId: 1,
          function: 'test-logs',
          arguments: 123,
        });
        sandbox.once('sandbox_exited', (rpcResponse) => {
          _.delay(() => {
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
      (cb) => {
        _.delay(() => {
          sandbox.accept('stop_sandbox');
        }, 20);
        sandbox.once('sandbox_exited', () => {
          return cb();
        });
      });


  it('should buffer messages until the sandbox starts', (cb) => {
    // Special-case construction of a new sandbox in order to test buffering
    // within the same call frame (the test harness sandbox has already been
    // initialized by this point, and so cannot be used).
    const sb = new Sandbox(_.merge({}, config, {
      dev: {
        data_root: temp.mkdirSync(),
        verbose: true,
      },
    }));
    sb.accept('start_sandbox', {
      package: tarball.toString('base64'),
      baseConnection: fakedata.BaseConnection(),
      svclibInterface,
    });
    sb.accept('rpc_request', {
      function: 'echo',
      arguments: 'hello',
      requestId: 1,
    });
    sb.once('rpc_response', (rpcResponse) => {
      assert.deepEqual(rpcResponse.result, 'hello');
      sb.accept('stop_sandbox');
      sb.once('sandbox_exited', () => {
        return cb();
      });
    });
  });


  it('should stubify svclib interface', (cb) => {
    sandbox.accept('rpc_request', {
      function: 'get-svclib-interface',
      requestId: 1,
    });
    sandbox.once('rpc_response', (rpcResponse) => {
      assert.isUndefined(rpcResponse.error);
      assert.strictEqual(rpcResponse.result.HotSauceGenerator.jalapeno, 1);
      return cb();
    });
  });


  it('should emit "user_event" sandbox events', (cb) => {
    sandbox.accept('rpc_request', {
      function: 'emit-user-event',
      requestId: 1,
    });
    sandbox.once('user_event', (userEvent) => {
      assert.deepEqual(userEvent, { name:'test_event', data:{ testing:123 } });
      return cb();
    });
  });
});
