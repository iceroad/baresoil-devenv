var _ = require('lodash')
  , assert = require('chai').assert
  , config = require('../../lib/config/default')
  , construct = require('runtype').construct
  , crypto = require('crypto')
  , fakedata = require('../fakedata')
  , fmt = require('util').format
  , fs = require('fs')
  , initLibrary = require('../../lib/types/initLibrary')
  , json = JSON.stringify
  , sinon = require('sinon')
  , util = require('util')
  , temp = require('temp').track()
  , Sandbox = require('../../lib/sandbox/Sandbox')
  , HttpServer = require('../../lib/server/HttpServer')
  , Svclib = require('../../lib/svclib/Svclib')
  , Hub = require('../../lib/hub/Hub')
  ;


describe('Hub', function() {
  var hub, emissions, baseConnection;
  var listenStub, startStub, stopStub, rpcRequestStub, wsSendStub;
  var svclibResponseStub, svclibEventStub, svcReqStub;

  before(function() {
    initLibrary();
  });

  beforeEach(function(cb) {
    baseConnection = fakedata.BaseConnection();

    rpcRequestStub = sinon.stub(Sandbox.prototype, 'rpc_request').returns();
    svclibResponseStub = sinon.stub(Sandbox.prototype, 'svclib_response').returns();
    svclibEventStub = sinon.stub(Sandbox.prototype, 'svclib_event').returns();
    startStub = sinon.stub(Sandbox.prototype, 'start_sandbox').returns();
    stopStub = sinon.stub(Sandbox.prototype, 'stop_sandbox').returns();
    listenStub = sinon.stub(HttpServer.prototype, 'listen').yields();
    wsSendStub = sinon.stub(HttpServer.prototype, 'ws_send_message').returns();
    svcReqStub = sinon.stub(Svclib.prototype, 'svclib_request').returns();

    hub = new Hub(_.merge({}, config, {
      dev: {
        data_root: temp.mkdirSync(),
        verbose: true,
      },
    }));
    emissions = [];
    hub.on('*', emissions.push.bind(emissions));
    hub.svclibInterface_ = fakedata.SvclibInterface();
    hub.serverPackage_ = crypto.randomBytes(64).toString('base64');
    return hub.start(cb);
  });

  afterEach(function(cb) {
    Sandbox.prototype.start_sandbox.restore();
    Sandbox.prototype.stop_sandbox.restore();
    Sandbox.prototype.rpc_request.restore();
    Sandbox.prototype.svclib_response.restore();
    Sandbox.prototype.svclib_event.restore();
    HttpServer.prototype.listen.restore();
    HttpServer.prototype.ws_send_message.restore();
    Svclib.prototype.svclib_request.restore();
    return hub.stop(cb);
  });


  it('should spawn a single new sandbox on "ws_connection_start" for a ' +
      'new client' , function(cb) {
    hub.accept('ws_connection_started', baseConnection);
    hub.accept('ws_connection_started', baseConnection);
    hub.accept('ws_connection_started', baseConnection);
    hub.accept('ws_connection_started', fakedata.BaseConnection());
    _.delay(function() {
      assert(listenStub.calledOnce);
      assert(startStub.calledTwice);
      return cb();
    }, 10);
  });


  it('should destroy a client\'s sandbox on "ws_connection_end"', function(cb) {
    hub.accept('ws_connection_started', baseConnection);
    _.delay(function() {
      hub.accept('ws_connection_ended', baseConnection);
      hub.accept('ws_connection_ended', baseConnection);
      _.delay(function() {
        assert(startStub.calledOnce);
        assert(stopStub.calledTwice);
        return cb();
      }, 10);
    }, 10);
  });


  it('should route "ws_message_incoming" to sandbox "rpc_request"', function(cb) {
    hub.accept('ws_connection_started', baseConnection);
    _.delay(function() {
      assert(startStub.calledOnce);
      hub.accept(
          'ws_message_incoming', baseConnection, fakedata.RpcRequest('echo'));
      _.delay(function() {
        assert(rpcRequestStub.calledOnce);
        return cb();
      }, 10);
    }, 10);
  });


  it('should pass "rpc_response" messages from the sandbox ' +
     'to the client', function(cb) {
    hub.accept('ws_connection_started', baseConnection);
    _.delay(function() {
      assert(startStub.calledOnce);
      hub.accept('rpc_response', baseConnection, {requestId: 1, result: []});
      _.delay(function() {
        assert(wsSendStub.calledOnce);
        assert.deepEqual(wsSendStub.args[0][1], [
            'rpc_response', {requestId: 1, result: []}]);
        return cb();
      }, 10);
    }, 10);
  });


  it('should pass "user_event" messages from the sandbox ' +
     'to the client', function(cb) {
    hub.accept('ws_connection_started', baseConnection);
    _.delay(function() {
      assert(startStub.calledOnce);
      hub.accept('user_event', baseConnection, {evtName: 'testing'});
      _.delay(function() {
        assert(wsSendStub.calledOnce);
        assert.deepEqual(wsSendStub.args[0][1], [
            'user_event', {evtName: 'testing'}]);
        return cb();
      }, 10);
    }, 10);
  });


  it('should not pass "svclib_request" messages to the client ', function(cb) {
    hub.accept('ws_connection_started', baseConnection);
    _.delay(function() {
      assert(startStub.calledOnce);
      hub.accept('svclib_request', baseConnection, fakedata.SvclibRequest());
      _.delay(function() {
        assert(wsSendStub.notCalled);
        assert(svcReqStub.calledOnce);
        return cb();
      }, 10);
    }, 10);
  });


  it('should pass "svclib_request" messages to the service library', function(cb) {
    hub.accept('svclib_request', baseConnection, fakedata.SvclibRequest());
    _.delay(function() {
      assert(svcReqStub.calledOnce);
      return cb();
    }, 10);
  });


  it('should pass "svclib_response" messages to the sandbox', function(cb) {
    hub.accept('ws_connection_started', baseConnection);
    hub.accept('svclib_response', baseConnection, fakedata.SvclibResponse());
    _.delay(function() {
      assert(svclibResponseStub.calledOnce);
      return cb();
    }, 10);
  });


  it('should pass "svclib_event" messages to the sandbox', function(cb) {
    hub.accept('ws_connection_started', baseConnection);
    hub.accept('svclib_event', baseConnection, fakedata.SvclibEvent());
    _.delay(function() {
      assert(svclibEventStub.calledOnce);
      return cb();
    }, 10);
  });


});
