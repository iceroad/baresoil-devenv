var _ = require('lodash')
  , assert = require('assert')
  , col = require('colors')
  , fmt = require('util').format
  , json = JSON.stringify
  ;

function log() {
  assert(this.isHub());
  var config = this.config_.dev;
  var args = Array.prototype.slice.call(arguments);
  assert(args.length, 'Logger called without arguments.');
  assert(_.isString(args[0]), 'First argument must be a string.');
  var cmd = args[0];

  var msg;
  switch(cmd) {
    case 'svclib_interface':
      // Ignore.
      break;


    case 'server_listening':
      if (!config.quiet) {
        msg = fmt(
            'Server is listening, point a browser at %s'.green,
            fmt('http://localhost:%d/', this.config_.server.port).bold);
      }
      break;


    case 'server_package':
      msg = fmt(
          'Server package updated. Current size: %s kb.'.blue,
          Math.floor(args[1].length / 1024).toString().bold);
      break;


    case 'http_request_incoming':
      var baseConnection = args[1];
      var httpRequest = args[2];
      msg = fmt(
          '[%s@%s] HTTP %s %s'.cyan,
          baseConnection.clientId,
          baseConnection.remoteAddress,
          httpRequest.method.bold,
          httpRequest.url.bold);
      break;


    case 'http_send_response':
      var baseConnection = args[1];
      var httpResponse = args[2];
      msg = fmt(
          '[%s@%s] HTTP => status: %s'.cyan,
          baseConnection.clientId,
          baseConnection.remoteAddress,
          httpResponse.statusCode.toString().bold);
      break;


    case 'ws_connection_started':
      var baseConnection = args[1];
      msg = fmt(
          '[%s@%s] Websocket connection started.'.yellow,
          baseConnection.clientId,
          baseConnection.remoteAddress);
      break;


    case 'ws_connection_ended':
      var baseConnection = args[1];
      msg = fmt(
          '[%s@%s] Websocket connection ended after %s seconds.'.yellow,
          baseConnection.clientId,
          baseConnection.remoteAddress,
          Math.ceil((Date.now() - baseConnection.connectedAt) / 1e3));
      break;


    case 'ws_message_incoming':
      var baseConnection = args[1];
      var rawMsgStr = json(args[2], null, 2).substr(0, 1024);
      msg = [
          fmt('[%s@%s] Received raw message, truncated message follows.'.yellow,
            baseConnection.clientId,
            baseConnection.remoteAddress),
          '─────────────────────────────────────────────────────────'.yellow,
          rawMsgStr.gray,
          '─────────────────────────────────────────────────────────'.yellow,
      ].join('\n');
      break;


    case 'user_event':
    case 'session_response':
    case 'rpc_response':
      var baseConnection = args[1];
      var rawMsgStr = json(args[2], null, 2).substr(0, 1024);
      msg = [
          fmt('[%s@%s] Outgoing message of type "%s", excerpt follows.'.yellow,
            baseConnection.clientId,
            baseConnection.remoteAddress, cmd),
          '─────────────────────────────────────────────────────────'.yellow,
          rawMsgStr.gray,
          '─────────────────────────────────────────────────────────'.yellow,
      ].join('\n');
      break;

    case 'svclib_request':
      var baseConnection = args[1];
      var svclibRequest = args[2];
      var rawMsgStr = json(args[2], null, 2).substr(0, 1024);
      msg = [
        fmt('[%s@%s] Service library request for "%s.%s", excerpt follows.'.cyan,
            baseConnection.clientId,
            baseConnection.remoteAddress,
            svclibRequest.service.bold,
            svclibRequest.function.bold),
        '─────────────────────────────────────────────────────────'.cyan,
        rawMsgStr.cyan.dim,
        '─────────────────────────────────────────────────────────'.cyan,
      ].join('\n');
      break;


    case 'svclib_response':
      var baseConnection = args[1];
      var svclibRequest = args[2];
      var rawMsgStr = json(args[2], null, 2).substr(0, 1024);
      msg = [
        fmt('[%s@%s] Service library response, excerpt follows.'.cyan,
            baseConnection.clientId,
            baseConnection.remoteAddress),
        '─────────────────────────────────────────────────────────'.cyan,
        rawMsgStr.cyan.dim,
        '─────────────────────────────────────────────────────────'.cyan,
      ].join('\n');
      break;


    case 'sandbox_exited':
      var baseConnection = args[1];
      var sbExitInfo = args[2];
      msg = [
        fmt(
          '[%s@%s] Sandbox exited with code=%s, signal=%s, stderr excerpt follows.'.blue,
          baseConnection.clientId, baseConnection.remoteAddress,
          sbExitInfo.code, sbExitInfo.signal),
      ].join('\n') + (
        sbExitInfo.stderr ? (
            '\n' +
            '─────────────────────────────────────────────────────────\n' +
            sbExitInfo.stderr.gray + '\n' +
            '─────────────────────────────────────────────────────────') : '');
      break;

    default:
      if (this.config_.dev.verbose) {
        msg = fmt('hub.accept: %s %s', args[0], json(args.slice(1)));
      }
      break;
  }

  if (msg) {
    var now = (new Date()).toISOString();
    console.log(now.dim + ' ' + msg);
  }
}


module.exports = log;
