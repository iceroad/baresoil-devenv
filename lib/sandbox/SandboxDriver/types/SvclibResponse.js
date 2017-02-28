module.exports = {
  name: 'SvclibResponse',
  desc: 'Baresoil Service Library response.',
  type: 'object',
  fields: {
    requestId: {
      type: 'integer',
    },
    error: {
      type: 'any',
    },
    result: {
      type: 'any',
    },
  },
};
