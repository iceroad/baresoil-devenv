const _ = require('lodash'),
  config = require('../../../lib/config/default'),
  fakedata = require('../../fakedata'),
  initLibrary = require('../../initLibrary'),
  temp = require('temp').track(),
  EventEmitter = require('events'),
  Svclib = require('../../../lib/svclib/Svclib')
  ;


class Harness extends EventEmitter {
  before(cb) {
    return cb();
  }

  beforeEach(cb) {
    this.baseConnection = fakedata.BaseConnection();
    const svclib = this.svclib = new Svclib(_.merge({}, config, {
      dev: {
        data_root: temp.mkdirSync(),
        verbose: true,
      },
    }));

    svclib.on('*', (...evtArgs) => {
      this.emit(...evtArgs);
    });

    if (process.env.VERBOSE) {
      svclib.on('*', console.log);
      svclib.on('$accept', console.log);
    }

    return svclib.start(cb);
  }

  afterEach(cb) {
    this.svclib.stop(cb);
    this.removeAllListeners();
  }

  run(moduleName, functionName, args, cb) {
    this.runForUser(this.baseConnection, moduleName, functionName, args, cb);
  }

  runForUser(baseConnection, moduleName, functionName, args, cb) {
    const fn = this.svclib.modules_[moduleName].$functions[functionName];
    const ctx = this.svclib;
    fn.call(ctx, baseConnection, args, cb);
  }

  sendRawEvent(...args) {
    this.svclib.accept.call(this.svclib, ...args);
  }
}


module.exports = Harness;
