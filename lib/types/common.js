var _ = require('lodash');


var CommonFields = {};

CommonFields.AppId = function() {
  return {
    type: 'integer',
    desc: 'Application identifier.',
    minValue: 1,
    maxValue: Number.MAX_SAFE_INTEGER,
  };
};

CommonFields.ClientId = function() {
  return {
    type: 'hex_buffer',
    desc: 'Globally unique client identifier.',
    minLength: 10,
    maxLength: 80,
  };
};


CommonFields.Hostname = function() {
  return {
    type: 'string',
    desc: 'Hostname requested by client in incoming HTTP request.',
    minLength: 6,
    maxLength: 64,
  };
};


CommonFields.RemoteAddress = function() {
  return {
    type: 'ip_address',
    desc: 'Client IP address.',
    minLength: 7,
    maxLength: 45,
  };
};


CommonFields.Origin = function() {
  return {
    type: 'string',
    optional: true,
    desc:
      'If the client is a web browser, the origin of the page requesting ' +
      'the connection. Should be treated as a user-generated value, since ' +
      'the HTTP Origin header can be easily spoofed from outside a browser ' +
      'environment.',
  };
};


CommonFields.Timestamp = function() {
  return {
    type: 'epoch_timestamp_ms',
  };
}


module.exports = {
  fields: CommonFields,
};
