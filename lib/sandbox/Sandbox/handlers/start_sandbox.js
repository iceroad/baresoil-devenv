const archive = require('../../../util/archive'),
  assert = require('assert'),
  async = require('async'),
  fse = require('fs-extra'),
  json = JSON.stringify,
  path = require('path'),
  states = require('../states'),
  spawn = require('child_process').spawn
  ;


module.exports = function SandboxStartSandbox(userlandBootstrap) {
  assert(this.isSandbox());

  if (this.status_) {
    return;
  }
  this.status_ = states.STARTING;

  const config = this.config_;
  const sieve = this.sieve_;
  const baseConnection = userlandBootstrap.baseConnection;
  const clientId = baseConnection.clientId;
  const driverPath = path.resolve(__dirname, '..', '..', 'SandboxDriver', 'main.js');

  return async.auto({
    wd: (cb) => {
      const sbWritable = path.join(config.dev.data_root, `sb-${clientId}`);
      fse.ensureDir(sbWritable, (err) => {
        if (err) return cb(err);
        this.wd_ = sbWritable;
        return cb(null, sbWritable);
      });
    },

    userland: ['wd', (deps, cb) => {
      const sbWritable = deps.wd;
      const pkgBuf = Buffer.from(userlandBootstrap.package, 'base64');
      archive.extractArchive(sbWritable, pkgBuf, cb);
    }],

    child: ['userland', (deps, cb) => {
      const options = {
        cwd: deps.wd,
        env: {
          BASE_CONNECTION: json(baseConnection),
          SVCLIB_INTERFACE: json(userlandBootstrap.svclibInterface),
        },
        stdio: 'pipe',
      };
      const child = this.child_ = spawn(process.execPath, [driverPath], options);
      child.stderr.on('data', (dataChunk) => {
        this.onSandboxStderr(dataChunk);
      });
      child.stdout.on('data', (dataChunk) => {
        sieve.observe(dataChunk.toString('utf-8'));
      });

      // Explicitly ignore various stream error events so that an EPIPE
      // 'unhandled error event' exception doesn't bring the whole process down.
      const ignore = () => {};
      child.on('error', ignore);
      child.stdout.on('error', ignore);
      child.stdin.on('error', ignore);
      child.stderr.on('error', ignore);

      // Cleanup after child and its child streams have ended. This is slightly
      // more elaborate than necessary to accomodate some edge cases where
      // stdio streams 'close' comes after process 'exit'.
      let count = 0, exitCode, exitSignal;
      const cleanupFn = () => {
        if (++count === 3) {
          sieve.close();
          this.onSandboxExit(exitCode, exitSignal);
        }
      };
      child.stdout.once('close', cleanupFn);
      child.stderr.once('close', cleanupFn);
      child.once('exit', (code, signal) => {
        exitCode = code || 0;
        exitSignal = signal || null;
        return cleanupFn();
      });

      return cb();
    }],
  });
};
