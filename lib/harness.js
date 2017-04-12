const _ = require('lodash')
  , assert = require('assert')
  , async = require('async')
  , config = require('./config/default')
  , json = JSON.stringify
  , path = require('path')
  , EventEmitter = require('events')
  , Svclib = require('./svclib/Svclib')
  , SandboxDriver = require('./sandbox/SandboxDriver')
  ;


class Harness extends EventEmitter {
  constructor (serverPackageDirectory) {
    super();
    process.env.BASE_CONNECTION = json({});
    process.env.TEST = 'true';
    process.env.SVCLIB_INTERFACE = json({});
    this.sbDriver_ = new SandboxDriver(config);
    this.svclib_ = new Svclib(config);
    this.sbDriver_.loadHandlers(serverPackageDirectory);
    this.rpc_ = {
      callbacks: {},
      nextId: 1,
    };
  }

  start (cb) {
    this.svclib_.start((err) => {
      if (err) return cb(err);
      this.sbDriver_.svclib = this.svclib_;
      return cb(null, this.sbDriver_);
    });
    this.sbDriver_.on('user_event', (userEvent) => {
      this.emit('user_event', userEvent.name, userEvent.data);
    });
    this.sbDriver_.on('rpc_response', (rpcResponse) => {
      const requestId = rpcResponse.requestId;
      assert(this.rpc_.callbacks[requestId], 'Got response for non-existent RPC.');
      const cb = this.rpc_.callbacks[requestId];
      delete this.rpc_.callbacks[requestId];
      return cb(rpcResponse.error, rpcResponse.result);
    });
  }

  stop (cb) {
    this.sbDriver_.accept('shutdown');
    _.delay(() => {
      this.svclib_.stop(cb);
    }, 500);
  }

  run (fnName, fnArgs, cb) {
    const requestId = this.rpc_.nextId++;
    this.rpc_.callbacks[requestId] = cb;
    this.sbDriver_.accept('rpc_request', {
      requestId: requestId,
      function: fnName,
      arguments: fnArgs
    });
  }
}


module.exports = Harness;
