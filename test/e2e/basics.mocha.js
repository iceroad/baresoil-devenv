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
  , path = require('path')
  , request = require('request')
  , sinon = require('sinon')
  , util = require('util')
  , temp = require('temp').track()
  , Hub = require('../../lib/hub/Hub')
  , WebSocket = require('ws')
  ;


describe('End-to-end integration', function() {
  var hub, emissions, baseConnection;

  this.slow(3000);
  this.timeout(5000);

  before(function() {
    initLibrary();
  });

  beforeEach(function(cb) {
    baseConnection = fakedata.BaseConnection();
    hub = new Hub(_.merge({}, config, {
      dev: {
        fs_poll_ms: 10,
        project_root: path.join(__dirname, '..', 'test_projects', 'minimal'),
        data_root: temp.mkdirSync(),
        verbose: true,
      },
    }));
    emissions = [];
    hub.on('*', function(argsArray) {
      emissions.push(argsArray);
      if (process.env.VERBOSE) {
        console.log('hub.emit:' + json(argsArray));
      }
    });
    if (process.env.VERBOSE) {
      hub.on('$accept', function() {
        var argsArray = Array.prototype.slice.call(arguments);
        console.log('hub.accept:' + json(argsArray));
      });
    }
    return hub.start(cb);
  });

  afterEach(function(cb) {
    return hub.stop(cb);
  });


  it('should serve files from the client project' , function(cb) {
    var endpointUrl = _.first(hub.getEndpoints()).url;
    var reqOptions = {
      url: endpointUrl,
      method: 'GET',
    };
    request(reqOptions, function (error, response, body) {
      if (error) {
        return cb(error);
      }
      assert.strictEqual(200, response.statusCode);
      assert.match(body, /sentinel/i);

      reqOptions = {
        url: endpointUrl + 'badfile.txt',
        method: 'GET',
      };
      request(reqOptions, function (error, response, body) {
        if (error) {
          return cb(error);
        }
        assert.strictEqual(404, response.statusCode);
        return cb();
      });
    });
  });


  it('should run "session_request" and return "session_response"', function(cb) {
    var endpointUrl = _.first(hub.getEndpoints()).wsUrl;
    var ws = new WebSocket(endpointUrl);
    ws.once('open', function() {
      ws.send(json(['session_request', {
        someData: 123,
      }]));
      ws.once('message', function(msg) {
        var frame = JSON.parse(msg);
        assert.deepEqual(frame[1].result, { someAuthData: 'something' });
        return cb();
      });
    });
  });


  it('should run "rpc_request" messages to the sandbox and return ' +
     'the corressponding "rpc_response" reply' , function(cb) {
    var endpointUrl = _.first(hub.getEndpoints()).wsUrl;
    var ws = new WebSocket(endpointUrl);
    ws.once('open', function() {
      ws.send(json(['rpc_request', {
        requestId: 1,
        function: 'uppercase',
        arguments: 'hello',
      }]));
      ws.once('message', function(msg) {
        var frame = JSON.parse(msg);
        assert.deepEqual(frame[1].result, 'HELLO');
        return cb();
      });
    });
  });


  it('should allow server handlers to use service library functions using ' +
     '"svclib_request" and "svclib_response"' , function(cb) {
    var endpointUrl = _.first(hub.getEndpoints()).wsUrl;
    var ws = new WebSocket(endpointUrl);
    ws.once('open', function() {
      ws.send(json(['rpc_request', {
        requestId: 4,
        function: 'test_svclib',
      }]));
      ws.once('message', function(msg) {
        var frame = JSON.parse(msg);
        assert.strictEqual('rpc_response', frame[0]);
        var items = frame[1].result;
        assert.isTrue(items[0].exists);
        assert.isDefined(items[0].valueId);
        return cb();
      });
    });
  });

});
