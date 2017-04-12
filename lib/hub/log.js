var _ = require('lodash')
  , assert = require('assert')
  , col = require('colors')
  , fmt = require('util').format
  , json = JSON.stringify
  ;


function log() {
  assert(this.isHub());
  const args = Array.prototype.slice.call(arguments);
  assert(args.length, 'Logger called without arguments.');
  assert(_.isString(args[0]), 'First argument must be a string.');
  const config = this.config_;

  if (config.dev.quiet) {
    return;
  }

  const cmd = args[0];
  var msg, baseConnection, extra;

  switch(cmd) {
    //
    // Global messages not related to any client (GREEN).
    //
    case 'server_listening':
      if (!config.dev.externalServer) {
        msg = fmt(
          'Server is listening, point a browser at %s'.green,
          fmt('http://localhost:%d/', config.server.port).bold);
      }
      break;

    case 'server_package':
      if (config.dev.verbose) {
        msg = fmt(
            'Server package updated. Current size: %s kb.'.green,
            Math.floor(args[1].length / 1024).toString().bold);
      }
      break;

    //
    // HTTP-related messages for verbose logging mode (CYAN).
    //
    case 'http_request_incoming':
      if (config.dev.verbose) {
        baseConnection = args[1];
        const httpRequest = args[2];
        msg = fmt(
            'HTTP %s %s'.cyan,
            httpRequest.method.bold, httpRequest.url.bold);
      }
      break;

    case 'http_send_response':
      if (config.dev.verbose) {
        baseConnection = args[1];
        const httpRequest = args[2];
        msg = fmt(
            'HTTP response => status: %s'.cyan,
            httpResponse.statusCode.toString().bold);
      }
      break;

    //
    // Client connection, termination events.
    //
    case 'ws_connection_started':
      baseConnection = args[1];
      msg = fmt(
          'Websocket connection from remote %s.'.blue,
          baseConnection.remoteAddress.bold);
      break;

    case 'ws_connection_ended':
      baseConnection = args[1];
      msg = fmt(
          'Websocket connection ended after %s seconds.'.blue,
          Math.ceil((Date.now() - baseConnection.connectedAt) / 1e3));
      break;

    case 'sandbox_exited':
      baseConnection = args[1];
      let sbExitInfo = args[2];
      msg = fmt(
          'Sandbox exited with code=%s, signal=%s.'.blue,
          sbExitInfo.code, sbExitInfo.signal),
      extra = sbExitInfo.stderr;
      break;

    //
    // Messages from sandbox to client
    //
    case 'user_event':
      baseConnection = args[1];
      let userEvent = args[2];
      extra = json(userEvent.data);
      msg = fmt('Outgoing user event "%s"'.yellow, userEvent.name.bold);
      break;

    case 'session_response':
      baseConnection = args[1];
      let sessionResponse = args[2];
      extra = json(sessionResponse);
      let success = _.get(sessionResponse, 'ok', false);
      msg = 'Session response '.yellow + (
          success ? 'granted'.green : 'denied'.red.bold);
      break;

    case 'rpc_response':
      baseConnection = args[1];
      extra = json(args[2].arguments || args[2]);
      msg = fmt('Function response "%s"'.yellow, cmd.bold);
      break;

    //
    // Messages from client to sandbox
    //
    case 'ws_message_incoming':
      baseConnection = args[1];
      let inArray = args[2];
      let inCmd = inArray[0];
      switch (inCmd) {
        case 'session_request':
          extra = json(inArray[1]);
          msg = 'Session request'.yellow;
          break;

        case 'rpc_request':
          extra = json(inArray[1].arguments);
          msg = fmt(
              'Function request %s for "%s"'.yellow,
              _.toString(inArray[1].requestId).bold,
              _.toString(inArray[1].function).bold);
          break;
      }
      break;

    //
    // Messages from sandbox to service library.
    //
    case 'svclib_request':
      baseConnection = args[1];
      let svclibRequest = args[2] || {};
      extra = json(svclibRequest.arguments);
      msg = fmt('Service request %s: %s.%s'.cyan,
            _.toString(svclibRequest.requestId).bold,
            _.toString(svclibRequest.service).bold,
            _.toString(svclibRequest.function).bold);
      break;

    //
    // Messages from service library to sandbox (cyan).
    //
    case 'svclib_response':
      baseConnection = args[1];
      let svclibResponse = args[2];
      let error = _.get(svclibResponse, 'error.message');
      extra = json(error ? error : svclibResponse);
      msg = fmt('Service response %s: %s'.cyan,
              _.toString(svclibResponse.requestId).bold,
              error ? error.red : 'ok'.green);
      break;

    case 'svclib_event':
      baseConnection = args[1];
      let svclibEvent = args[2] || {};
      extra = json(svclibEvent.data);
      msg = fmt('Service event %s.%s'.cyan,
            _.toString(svclibEvent.service).bold,
            _.toString(svclibEvent.name).bold);
      break;

    //
    // Default
    //
    default:
      if (config.dev.verbose) {
        extra = json(args);
      }
      break;
  }

  if (msg || extra) {
    var clientInfo = baseConnection ?
      fmt('[%s]'.dim, baseConnection.clientId.substr(0, 6)) : null;
    var extraData = extra ? [
      extra.substr(0, config.dev.dataPreview).gray,
    ].join('') : null;
    console.log(_.filter([
      clientInfo,
      msg,
      extraData,
    ]).join(' '));
  }
}

module.exports = log;
