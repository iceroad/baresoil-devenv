var _ = require('lodash')
  , assert = require('chai').assert
  , async = require('async')
  , config = require('../../lib/config/default')
  , fmt = require('util').format
  , initLibrary = require('../../lib/types/initLibrary')
  , json = JSON.stringify
  , request = require('request').defaults({jar: true})
  , HttpServer = require('../../lib/server/HttpServer')
  , WebSocket = require('ws')
  ;

function TextBuffer(string) {
  return Buffer.from(string, 'utf-8').toString('base64');
}

describe('HttpServer', function() {
  var server, endpoint, emissions;

  this.slow(400);

  before(function() {
    initLibrary();
  });

  beforeEach(function(cb) {
    server = new HttpServer(_.merge({}, config, {
      server: {
        port: 9086,
      },
    }));
    emissions = [];
    server.on('*', emissions.push.bind(emissions));
    if (process.env.VERBOSE) {
      server.on('*', console.log);
    }
    return server.listen(function(err) {
      if (err) return cb(er);
      endpoint = _.first(server.getEndpoints());
      return cb();
    });
  });

  afterEach(function(cb) {
    return server.stop(cb);
  });


  it('should emit "server_listening" or "server_error" on listen()',
      function(cb) {
    assert.deepEqual(_.map(emissions, _.first), ['server_listening']);
    server.listen(function(err, endpoints) {
      assert.isOk(err);
      assert.isNotOk(endpoints);
      assert.deepEqual(_.map(emissions, _.first), [
          'server_listening',
          'server_error']);
      return cb();
    });
  });


  it('should emit "http_request_incoming" events and accept ' +
     '"http_send_response" inputs', function(cb) {
    // requests module options with a cookie jar
    var cookieJar = request.jar();
    cookieJar.setCookie(request.cookie('data=1234'), endpoint.url);
    var reqOptions = {
      jar: cookieJar,
      url: endpoint.url,
      headers: {
        'User-Agent': 'testagent',
        'Custom-Header': 'Some text here'
      },
    };

    // Make HTTP request
    request(reqOptions, function (error, response, body) {
      if (error) {
        return cb(error);
      }
      assert.strictEqual(response.statusCode, 509);
      assert.strictEqual(body, 'Plain text body.');
      assert.deepEqual(_.map(emissions, _.first), [
          'server_listening',
          'http_request_incoming']);
      assert.deepEqual(emissions[1][2], {
        'cookies': {
          'data': '1234',
        },
        'fields': {},
        'files': [],
        'headers': {
          'connection': 'close',
          'cookie': 'data=1234',
          'custom-header': 'Some text here',
          'host': '127.0.0.1:9086',
          'user-agent': 'testagent',
        },
        'method': 'GET',
        'url': '/',
      });
      return cb();
    });

    // Send HTTP response
    _.delay(function() {
      var baseConnection = _.last(emissions)[1];
      var clientId = baseConnection.clientId;
      server.accept('http_send_response', baseConnection, {
        statusCode: 509,
        body: TextBuffer('Plain text body.'),
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }, 100);
  });


  it('should emit "ws_connection_started" and "ws_connection_ended" events ' +
     'on Websocket connects/disconnects', function(cb) {
    var ws = new WebSocket(endpoint.wsUrl);
    ws.once('open', function() {
      ws.close();
      _.delay(function() {
        assert.deepEqual(_.map(emissions, _.first), [
            'server_listening',
            'ws_connection_started',
            'ws_connection_ended']);
        return cb();
      }, 50);
    });
  });


  it('should emit "ws_message_incoming" events on incoming WebSocket frames ' +
     'that follow basic protocol', function(cb) {
    var ws = new WebSocket(endpoint.wsUrl);
    ws.once('open', function() {
      ws.send(json(['session_request', 123]));
      _.delay(function() {
        ws.close();
        _.delay(function() {
          assert.deepEqual(_.map(emissions, _.first), [
              'server_listening',
              'ws_connection_started',
              'ws_message_incoming',
              'ws_connection_ended']);
          assert.deepEqual(emissions[2][2], ['session_request', 123]);
          return cb();
        }, 50);
      }, 50);
    });
  });


  it('should immediately terminate clients that do not obey data frame syntax',
      function(cb) {
    var ws = new WebSocket(endpoint.wsUrl);
    ws.once('open', function() {
      ws.send('random garbage string here');
      _.delay(function() {
        assert.deepEqual(_.map(emissions, _.first), [
            'server_listening',
            'ws_connection_started',
            // NOTE: no ws_message_incoming here
            'ws_connection_ended']);
        return cb();
      }, 50);
    });
  });


  it('should accept the "ws_end_connection" input and terminate a connected ' +
     'websocket', function(cb) {
    var ws = new WebSocket(endpoint.wsUrl);
    ws.once('open', function() {
      _.delay(function() {
        var baseConnection = _.last(emissions)[1];  // "ws_connection_started"
        server.accept('ws_end_connection', baseConnection, {
          message: 'error message',
        });
      }, 10);
      ws.once('close', function() {
        return cb();
      });
    });
  });


  it('should accept the "ws_send_message" input and forward the message to a ' +
     'connected websocket',
      function(cb) {
    var ws = new WebSocket(endpoint.wsUrl);
    ws.once('open', function() {
      _.delay(function() {
        var baseConnection = _.last(emissions)[1];  // "ws_connection_started"
        server.accept('ws_send_message', baseConnection, ['testing_123']);
      }, 10);
      ws.once('message', function(msgStr) {
        var msgFrame = JSON.parse(msgStr);
        assert.deepEqual(msgFrame, ['testing_123']);
        return cb();
      });
    });
  });



});
