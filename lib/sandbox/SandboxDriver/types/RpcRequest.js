module.exports = {
  type: 'object',
  fields: {
    requestId: {
      type: 'integer'
    },
    function: {
      type: 'string',
      maxLength: 200,
    },
    arguments: {
      type: 'any',
    },
  },
};
