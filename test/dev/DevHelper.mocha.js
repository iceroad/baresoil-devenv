/* eslint no-undef: "ignore" */
const _ = require('lodash'),
  assert = require('chai').assert,
  async = require('async'),
  config = require('../../lib/config/default'),
  fakedata = require('../fakedata'),
  fs = require('fs'),
  initLibrary = require('..//initLibrary'),
  json = JSON.stringify,
  path = require('path'),
  sinon = require('sinon'),
  temp = require('temp').track(),
  DevHelper = require('../../lib/dev/DevHelper'),
  WebSocket = require('ws')
  ;


global.WebSocket = WebSocket;


describe('Development helpers', function () {
  let devHelper, emissions, bc, mockServer;
  const testProjectsDir = path.join(__dirname, '..', 'test_projects');

  this.timeout(5000);
  this.slow(2000);

  beforeEach((cb) => {
    bc = fakedata.BaseConnection();
    const freshConfig = _.merge({}, config, {
      dev: {
        fs_poll_ms: 50,
        project_root: path.join(testProjectsDir, 'minimal'),
      },
    });
    mockServer = {
      bumpAllClients: sinon.stub(),
    };
    devHelper = new DevHelper(freshConfig, mockServer);
    emissions = [];
    devHelper.on('*', emissions.push.bind(emissions));
    if (process.env.VERBOSE) {
      devHelper.on('*', console.log);
    }
    return devHelper.start(cb);
  });

  afterEach(cb => devHelper.stop(cb));


  it('should emit "server_package" after startup', (cb) => {
    devHelper.once('server_package', (packageStr) => {
      assert(packageStr);
      return cb();
    });
  });


  it('should emit "server_package" every time server project changes',
      (cb) => {
    // Create bogus temporary project that we can modify.
        const tmpdir = temp.mkdirSync();
        fs.mkdirSync(path.join(tmpdir, 'client'));
        fs.mkdirSync(path.join(tmpdir, 'server'));
        fs.writeFileSync(
        path.join(tmpdir, 'server', 'fn-test.js'), 'test', 'utf-8');
        const dh = new DevHelper(_.merge({}, config, {
          dev: {
            fs_poll_ms: 50,
            project_root: tmpdir,
          },
        }), mockServer);
        dh.start((err) => {
          if (err) return cb(err);
          dh.once('server_package', () => {
        // Received initial server package, make modification.
            fs.writeFileSync(
            path.join(tmpdir, 'server', 'fn-test.js'), 'cat', 'utf-8');
            dh.once('server_package', () => cb());
          });
        });
      });


  it('should emit "client_project_changed" every time client project changes',
      (cb) => {
    // Create bogus temporary project that we can modify.
        const tmpdir = temp.mkdirSync();
        fs.mkdirSync(path.join(tmpdir, 'client'));
        fs.mkdirSync(path.join(tmpdir, 'server'));
        fs.writeFileSync(
        path.join(tmpdir, 'client', 'index.html'), 'test', 'utf-8');
        const dh = new DevHelper(_.merge({}, config, {
          dev: {
            fs_poll_ms: 50,
            project_root: tmpdir,
          },
        }), mockServer);
        dh.start((err) => {
          if (err) return cb(err);
          dh.once('client_project_changed', () => {
        // Received initial server package, make modification.
            fs.writeFileSync(
            path.join(tmpdir, 'client', 'index.html'), 'cat', 'utf-8');
            dh.once('client_project_changed', () => {
              dh.stop(cb);
            });
          });
        });
      });


  it('should support nonstandard directory names specified in baresoil.json',
      (cb) => {
        const dh = new DevHelper(_.merge({}, config, {
          dev: {
            fs_poll_ms: 50,
            project_root: path.join(testProjectsDir, 'nonstandard'),
          },
        }), mockServer);
        let serverChanged, clientChanged;
        dh.once('server_project_changed', () => {
          serverChanged = true;
          if (serverChanged && clientChanged) {
            return dh.stop(cb);
          }
        });
        dh.once('client_project_changed', () => {
          clientChanged = true;
          if (serverChanged && clientChanged) {
            return dh.stop(cb);
          }
        });
        dh.once('project_error', err => cb(err));
        dh.start(_.noop);
      });


  it('should respond to "http_request_incoming" messages by serving files ' +
     'from the client project', (cb) => {
    devHelper.once('client_project_changed', () => {
      async.series([

        // Server root -> index.html
        (cb) => {
          devHelper.accept('http_request_incoming', bc, {
            url: '/',
            cookies: {},
            files: {},
            fields: {},
            method: 'GET',
          });
          devHelper.once('http_send_response', (resBc, httpResponse) => {
            assert.deepEqual(bc, resBc);
            assert.strictEqual(
                httpResponse.headers['Content-Type'], 'text/html');
            assert.strictEqual(httpResponse.statusCode, 200);
            _.defer(cb);
          });
        },

        // Image inside directory.
        (cb) => {
          devHelper.accept('http_request_incoming', bc, {
            url: '/img/sample.jpg',
            cookies: {},
            files: {},
            fields: {},
            method: 'GET',
          });
          devHelper.once('http_send_response', (resBc, httpResponse) => {
            assert.deepEqual(bc, resBc);
            assert.strictEqual(httpResponse.statusCode, 200);
            assert.strictEqual(
                httpResponse.headers['Content-Type'], 'image/jpeg');
            _.defer(cb);
          });
        },

      ], cb);
    });
  });


  it('should respond to "http_request_incoming" messages by serving 404s ' +
     'for bad links', (cb) => {
    devHelper.once('client_project_changed', () => {
      async.series([

        // Legitimate 404
        (cb) => {
          devHelper.once('http_send_response', (resBc, httpResponse) => {
            assert.deepEqual(bc, resBc);
            assert.strictEqual(httpResponse.statusCode, 404);
            _.defer(cb);
          });
          devHelper.accept('http_request_incoming', bc, {
            url: '/sample.jpg',
            cookies: {},
            files: {},
            fields: {},
            method: 'GET',
          });
        },

        // URL resolves outside source directory
        (cb) => {
          devHelper.once('http_send_response', (resBc, httpResponse) => {
            assert.deepEqual(bc, resBc);
            assert.strictEqual(httpResponse.statusCode, 404);
            _.defer(cb);
          });
          devHelper.accept('http_request_incoming', bc, {
            url: '/../../DevHelper.mocha.js',
            cookies: {},
            files: {},
            fields: {},
            method: 'GET',
          });
        },
      ], cb);
    });
  });
});
