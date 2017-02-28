var _ = require('lodash')
  , assert = require('chai').assert
  , async = require('async')
  , config = require('../../lib/config/default')
  , fakedata = require('../fakedata')
  , fmt = require('util').format
  , fs = require('fs')
  , initLibrary = require('../../lib/types/initLibrary')
  , json = JSON.stringify
  , os = require('os')
  , path = require('path')
  , request = require('request').defaults({jar: true})
  , temp = require('temp').track()
  , DevHelper = require('../../lib/dev/DevHelper')
  , WebSocket = require('ws')
  ;


describe('Development helpers', function() {
  var devHelper, emissions, bc;
  var testProjectsDir = path.join(__dirname, '..', 'test_projects');

  this.timeout(5000);
  this.slow(2000);

  before(function() {
    initLibrary();
  });

  beforeEach(function(cb) {
    bc = fakedata.BaseConnection();
    devHelper = new DevHelper(_.merge({}, config, {
      dev: {
        fs_poll_ms: 50,
        project_root: path.join(testProjectsDir, 'minimal'),
      }
    }));
    emissions = [];
    devHelper.on('*', emissions.push.bind(emissions));
    if (process.env.VERBOSE) {
      devHelper.on('*', console.log);
    }
    return devHelper.start(cb);
  });

  afterEach(function(cb) {
    return devHelper.stop(cb);
  });


  it('should emit "server_package" after startup', function(cb) {
    devHelper.once('server_package', function(packageStr) {
      assert(packageStr);
      return cb();
    });
  });


  it('should emit "server_package" every time server project changes',
      function(cb) {
    // Create bogus temporary project that we can modify.
    var tmpdir = temp.mkdirSync();
    fs.mkdirSync(path.join(tmpdir, 'client'));
    fs.mkdirSync(path.join(tmpdir, 'server'));
    fs.writeFileSync(
        path.join(tmpdir, 'server', 'fn-test.js'), 'test', 'utf-8');
    var dh = new DevHelper(_.merge({}, config, {
      dev: {
        fs_poll_ms: 50,
        project_root: tmpdir,
      },
    }));
    dh.start(function(err) {
      if (err) return cb(err);
      dh.once('server_package', function(package) {
        // Received initial server package, make modification.
        fs.writeFileSync(
            path.join(tmpdir, 'server', 'fn-test.js'), 'cat', 'utf-8');
        dh.once('server_package', function() {
          return cb();
        })
      });
    })
  });


  it('should emit "client_project_changed" every time client project changes',
      function(cb) {
    // Create bogus temporary project that we can modify.
    var tmpdir = temp.mkdirSync();
    fs.mkdirSync(path.join(tmpdir, 'client'));
    fs.mkdirSync(path.join(tmpdir, 'server'));
    fs.writeFileSync(
        path.join(tmpdir, 'client', 'index.html'), 'test', 'utf-8');
    var dh = new DevHelper(_.merge({}, config, {
      dev: {
        fs_poll_ms: 50,
        project_root: tmpdir,
      },
    }));
    dh.start(function(err) {
      if (err) return cb(err);
      dh.once('client_project_changed', function(package) {
        // Received initial server package, make modification.
        fs.writeFileSync(
            path.join(tmpdir, 'client', 'index.html'), 'cat', 'utf-8');
        dh.once('client_project_changed', function() {
          dh.stop(cb);
        })
      });
    })
  });


  it('should support nonstandard directory names specified in baresoil.json',
      function(cb) {
    var dh = new DevHelper(_.merge({}, config, {
      dev: {
        fs_poll_ms: 50,
        project_root: path.join(testProjectsDir, 'nonstandard'),
      },
    }));
    var serverChanged, clientChanged;
    dh.once('server_project_changed', function() {
      serverChanged = true;
      if (serverChanged && clientChanged) {
        return dh.stop(cb);
      }
    });
    dh.once('client_project_changed', function() {
      clientChanged = true;
      if (serverChanged && clientChanged) {
        return dh.stop(cb);
      }
    });
    dh.once('project_error', function(err) {
      return cb(err);
    })
    dh.start(_.noop);
  });


  it('should respond to "http_request_incoming" messages by serving files ' +
     'from the client project', function(cb) {
    devHelper.once('client_project_changed', function() {
      async.series([

        // Root
        function(cb) {
          devHelper.accept('http_request_incoming', bc, {
            url: '/',
            cookies: {},
            files: {},
            fields: {},
            method: 'GET',
          });
          devHelper.once('http_send_response', function(resBc, httpResponse) {
            assert.deepEqual(bc, resBc);
            assert.strictEqual(httpResponse.statusCode, 200);
            return cb();
          });
        },

        // Image inside directory.
        function(cb) {
          devHelper.accept('http_request_incoming', bc, {
            url: '/img/sample.jpg',
            cookies: {},
            files: {},
            fields: {},
            method: 'GET',
          });
          devHelper.once('http_send_response', function(resBc, httpResponse) {
            assert.deepEqual(bc, resBc);
            assert.strictEqual(httpResponse.statusCode, 200);
            assert.strictEqual(
                httpResponse.headers['Content-Type'], 'image/jpeg');
            return cb();
          });
        },

      ], cb);
    });
  });


  it('should respond to "http_request_incoming" messages by serving 404s ' +
     'for bad links', function(cb) {
    devHelper.once('client_project_changed', function() {
      async.series([

        // Legitimate 404
        function(cb) {
          devHelper.accept('http_request_incoming', bc, {
            url: '/sample.jpg',
            cookies: {},
            files: {},
            fields: {},
            method: 'GET',
          });
          devHelper.once('http_send_response', function(resBc, httpResponse) {
            assert.deepEqual(bc, resBc);
            assert.strictEqual(httpResponse.statusCode, 404);
            return cb();
          });
        },

        // URL resolves outside source directory
        function(cb) {
          devHelper.accept('http_request_incoming', bc, {
            url: '/../../DevHelper.mocha.js',
            cookies: {},
            files: {},
            fields: {},
            method: 'GET',
          });
          devHelper.once('http_send_response', function(resBc, httpResponse) {
            assert.deepEqual(bc, resBc);
            assert.strictEqual(httpResponse.statusCode, 404);
            return cb();
          });
        },

      ], cb);
    });
  });
});
