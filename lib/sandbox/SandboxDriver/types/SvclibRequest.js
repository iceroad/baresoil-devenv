module.exports = {
  name: 'SvclibRequest',
  desc: 'Baresoil Service Library request.',
  type: 'object',
  fields: {
    requestId: {
      type: 'integer',
    },
    service: {
      type: 'alphanumeric',
      maxLength: 80,
    },
    function: {
      type: 'alphanumeric',
      maxLength: 80,
    },
    arguments: {
      type: 'any',
    },
  },
};
