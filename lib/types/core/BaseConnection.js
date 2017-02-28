var _ = require('lodash')
  , common = require('../common')
  ;

module.exports = {
  name: 'BaseConnection',
  desc: 'Client connection identifier.',
  type: 'object',
  fields: {
    appId: common.fields.AppId(),
    clientId: common.fields.ClientId(),
    hostname: common.fields.Hostname(),
    origin: common.fields.Origin(),
    remoteAddress: common.fields.RemoteAddress(),
    connectedAt: _.merge(common.fields.Timestamp(), {
      desc: 'Epoch timestamp when client connected (milliseconds).',
    }),
    protocol: {
      type: 'factor',
      factors: ['http', 'ws'],
      desc: 'Client protocol (HTTP request or Websocket connection).',
    },
  },
};
