var _ = require('lodash')
  , crypto = require('crypto')
  ;


exports.BaseConnection = function() {
  var r255 = _.random.bind(_, 255);
  return {
    appId: _.random(1000, Number.MAX_SAFE_INTEGER),
    remoteAddress: [r255(), r255(), r255(), r255()].join('.'),
    clientId: crypto.randomBytes(12).toString('hex'),
    connectedAt: Date.now(),
    hostname: 'localhost',
    origin: undefined,
    protocol: 'ws',
  };
};


exports.SvclibRequest = function() {
  return {
    requestId: _.random(1e5),
    service: 'KVDataStore',
    function: 'set',
    arguments: [{table: 'test', key: 'abc', value: 123}],
  };
}


exports.SvclibResponse = function() {
  return {
    requestId: _.random(0, 1e5),
    result: 'abcdef',
  };
}


exports.SvclibEvent = function() {
  return {
    service: 'RealtimeBus',
    eventName: 'channel_message',
    eventData: {
      channelId: 1234,
      message: {
        text: 'hello!',
        time: Date.now(),
      },
    },
  };
}


exports.SvclibInterface = function() {
  return {
    HotSauceGenerator: {
      jalapeno: 1,
    },
  };
};


exports.RpcRequest = function(fnName, fnArgs) {
  return ['rpc_request', {
    requestId: _.random(10, 100),
    function: fnName,
    arguments: fnArgs,
  }];
}
