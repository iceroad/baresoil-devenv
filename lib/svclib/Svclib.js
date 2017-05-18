const _ = require('lodash'),
  assert = require('assert'),
  async = require('async'),
  AcceptHandlers = require('./handlers'),
  EventIO = require('event-io'),
  TypeLibrary = require('../types'),
  Schema = require('./Svclib.schema'),
  SvcLibModules = require('./modules')
  ;


class SvcLib extends EventIO {
  constructor(config, svcDeps) {
    super();
    this.config_ = config;
    this.svcDeps_ = svcDeps;

    // Load library modules.
    this.modules_ = _.mapValues(
        SvcLibModules, ModConstructor => new ModConstructor(config));

    // Set up EventIO.
    this.setAcceptHandlers(AcceptHandlers);
    this.extendTypeLibrary(TypeLibrary);
    this.$schema = Schema;
  }

  start(cb) {
    assert(this.isSvclib());

    // Generate start functions with dependencies and infrastructure.
    const startFns = _.mapValues(
        this.modules_, svcInst => svcInst.genStartWithDeps());
    _.extend(startFns, _.mapValues(this.svcDeps_, dep => cb => cb(null, dep)));

    // Use async.auto() to run dependency graph.
    async.auto(startFns, (err, result) => {
      if (err) return cb(err);

      // Export SvcLib interface.
      const SvcLibInterface = this.SvcLibInterface_ = _.mapValues(
              this.modules_, mod => _.mapValues(mod.$functions, () => 1));
      this.emit('svclib_interface', SvcLibInterface);

      // Re-emit SvcLib_events from EventEmitter modules.
      _.forEach(this.modules_, (mod) => {
        if (!_.isFunction(mod.on)) return;
        mod.on('svclib_event', (...evtArgs) => {
          evtArgs.splice(0, 0, 'svclib_event');
          this.emit(...evtArgs);
        });
      });

      return cb(null, result);
    });
  }

  stop(cb) {
    // Generate stop functions with dependencies.
    const stopFns = _.mapValues(
        this.modules_, svcInst => svcInst.genStopWithDeps());

    // Use async.auto() to run dependency graph.
    async.auto(stopFns, cb);
  }

  isSvclib() {
    return true;
  }
}


module.exports = SvcLib;
