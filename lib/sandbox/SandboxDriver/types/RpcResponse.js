module.exports = {
  name: 'RpcResponse',
  type: 'object',
  fields: {
    requestId: {
      type: 'integer'
    },
    error: {
      type: 'object',
      optional: true,
    },
    result: {
      type: 'any',
    },
  },
};
