module.exports = {
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
