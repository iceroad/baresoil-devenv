const _ = require('lodash'),
  assert = require('assert'),
  col = require('colors'),
  json = JSON.stringify,
  jsonSummary = require('../util/json-summary')
  ;


function log(...args) {
  assert(this.isHub());
  assert(args.length, 'Logger called without arguments.');
  assert(_.isString(args[0]), 'First argument must be a string.');
  const config = this.config_;

  if (config.dev.quiet) {
    // Log nothing.
    return;
  }

  if (config.dev.verbose) {
    // Log everything.
    if (args.length >= 2 && args[1].remoteAddress) {
      args[1] = '(BaseConnection)';
    }
    console.log(jsonSummary(args));
    return;
  }

  // Selective logging for general-purpose (i.e., non debugging) development.
  const cmd = args[0];
  let msg, baseConnection, extra;
  switch (cmd) {
    //
    // Global messages not related to any client (GREEN).
    //
    case 'server_listening':
      if (!config.dev.externalServer) {
        msg = `
Preview server is ready, open this URL in a browser:

  http://localhost:${config.server.port}/
`.green.bold;
      }
      break;

    case 'server_package':
      if (config.dev.verbose) {
        msg = ('Server package updated. Current size: ' +
              `${col.bold(Math.ceil(args[1].length / 1024))} kb.`).green;
      }
      break;

    //
    // HTTP-related messages for verbose logging mode (CYAN).
    //
    case 'http_request_incoming':
      if (config.dev.verbose) {
        baseConnection = args[1];
        const httpRequest = args[2];
        msg = `HTTP request => ${httpRequest.method.bold}${httpRequest.url.bold}`.cyan;
      }
      break;

    case 'http_send_response':
      if (config.dev.verbose) {
        baseConnection = args[1];
        const httpResponse = args[2];
        msg = `HTTP response => status: ${col.bold(httpResponse.statusCode)}`.cyan;
      }
      break;

    //
    // Client connection, termination events.
    //
    case 'ws_connection_started':
      baseConnection = args[1];
      msg = `New Websocket connection from remote ${col.bold(baseConnection.remoteAddress)}.`.blue;
      break;

    case 'ws_connection_ended':
      baseConnection = args[1];
      msg = (
          'Websocket connection ended after ' +
          `${Math.ceil((Date.now() - baseConnection.connectedAt) / 1e3)}` +
          ' seconds.').blue;
      break;

    case 'sandbox_exited': {
      baseConnection = args[1];
      const sbExitInfo = args[2];
      msg = (
          `Sandbox exited with code=${sbExitInfo.code}, ` +
          `signal=${sbExitInfo.signal}.`).blue;
      extra = sbExitInfo.stderr;
      break;
    }

    //
    // Messages from sandbox to client
    //
    case 'user_event': {
      baseConnection = args[1];
      const userEvent = args[2];
      extra = json(userEvent.data);
      msg = `Outgoing user event "${col.bold(userEvent.name)}"`.yellow;
      break;
    }

    case 'session_response': {
      baseConnection = args[1];
      const sessionResponse = args[2];
      extra = json(sessionResponse);
      const success = _.get(sessionResponse, 'ok', false);
      msg = 'Session response '.yellow + (
          success ? 'granted'.green : 'denied'.red.bold);
      break;
    }

    case 'rpc_response':
      baseConnection = args[1];
      extra = json(args[2].arguments || args[2]);
      msg = `Function response "${col.bold(cmd)}"`.yellow;
      break;

    //
    // Messages from client to sandbox
    //
    case 'ws_message_incoming': {
      baseConnection = args[1];
      const inArray = args[2];
      const inCmd = inArray[0];
      switch (inCmd) {
        case 'session_request':
          extra = json(inArray[1]);
          msg = 'Session request'.yellow;
          break;

        case 'rpc_request':
          extra = json(inArray[1].arguments);
          msg = (
              `RPC request "${col.bold(inArray[1].requestId)}" for handler ` +
              `"${col.bold(inArray[1].function)}".`).yellow;
          break;

        default:
          break;
      }
      break;
    }

    //
    // Messages from sandbox to service library.
    //
    case 'svclib_request': {
      baseConnection = args[1];
      const svclibRequest = args[2] || {};
      extra = json(svclibRequest.arguments);
      msg = (
          `Svclib request "${col.bold(svclibRequest.requestId)}" for function ` +
          `"${col.bold(svclibRequest.service)}.` +
          `${col.bold(svclibRequest.function)}".`).yellow;
      break;
    }

    //
    // Messages from service library to sandbox (cyan).
    //
    case 'svclib_response': {
      baseConnection = args[1];
      const svclibResponse = args[2];
      const error = _.get(svclibResponse, 'error.message');
      extra = json(error || svclibResponse);
      msg = (
          `Svclib response "${col.bold(svclibResponse.requestId)}": ` +
          `${error ? error.red : 'ok'.green}`);
      break;
    }

    case 'svclib_event': {
      baseConnection = args[1];
      const svclibEvent = args[2] || {};
      extra = json(svclibEvent.data);
      msg = `Svclib event "${col.bold(svclibEvent.service)}.${col.bold(svclibEvent.name)}"`;
      break;
    }

    default:
      if (config.dev.verbose) {
        msg = jsonSummary(args);
        extra = json(args);
      }
      break;
  }

  if (msg || extra) {
    const clientInfo = baseConnection ?
        `[${baseConnection.clientId.substr(0, 6)}…]`.dim : null;
    const extraData = extra ? [
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
