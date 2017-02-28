var _ = require('lodash')
  , archive = require('../../../util/archive')
  , assert = require('assert')
  , async = require('async')
  , fse = require('fs-extra')
  , json = JSON.stringify
  , path = require('path')
  , states = require('../states')
  , spawn = require('child_process').spawn
  ;

module.exports = function(userlandBootstrap) {
  assert(this.isSandbox());

  if (this.status_) {
    return;
  }
  this.status_ = states.STARTING;

  var sbRef = this;
  var config = this.config_;
  var sieve = this.sieve_;
  var emitFn = this.emit.bind(this);
  var baseConnection = userlandBootstrap.baseConnection;
  var clientId = baseConnection.clientId;
  var driverPath = path.join(__dirname, '..', '..', 'SandboxDriver', 'main.js');

  return async.auto({
    wd: function(cb) {
      var sbWritable = path.join(config.dev.data_root, 'sb-' + clientId);
      fse.ensureDir(sbWritable, function(err) {
        if (err) return cb(err);
        sbRef.wd_ = sbWritable;
        return cb(null, sbWritable);
      });
    },

    userland: ['wd', function(deps, cb) {
      var sbWritable = deps.wd;
      var package = Buffer.from(userlandBootstrap.package, 'base64');
      archive.extractArchive(sbWritable, package, cb);
    }],

    child: ['userland', function(deps, cb) {
      var nodeCmd = 'node ' + json(driverPath);
      var options = {
        cwd: deps.wd,
        env: {
          BASE_CONNECTION: json(baseConnection),
          SVCLIB_INTERFACE: json(userlandBootstrap.svclibInterface),
        },
        stdio: 'pipe',
        shell: true,
      };
      var child = this.child_ = spawn(nodeCmd, options);
      child.stderr.on('data', function(dataChunk) {
        this.onSandboxStderr.call(this, dataChunk);
      }.bind(this));
      child.stdout.on('data', function(dataChunk) {
        sieve.observe.call(sieve, dataChunk.toString('utf-8'));
      });

      // Cleanup after child and its child streams have ended. This is slightly
      // more elaborate than necessary to accomodate some edge cases where
      // stdio streams 'close' comes after process 'exit'.
      var count = 0, exitCode, exitSignal;
      var cleanupFn = function() {
        if (++count === 3) {
          sieve.close();
          this.onSandboxExit.call(this, exitCode, exitSignal);
        }
      }.bind(this);
      child.stdout.once('close', cleanupFn);
      child.stderr.once('close', cleanupFn);
      child.once('exit', function(code, signal) {
        exitCode = code || 0;
        exitSignal = signal || null;
        return cleanupFn();
      });
      return cb();
    }.bind(this)],
  });
};
