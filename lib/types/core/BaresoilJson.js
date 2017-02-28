module.exports = {
  name: 'BaresoilJson',
  desc: 'Schema for baresoil.json in user projects.',
  type: 'object',
  fields: {
    client: {
      type: 'object',
      optional: true,
      fields: {
        path: {
          type: 'string',
          optional: true,
        },
      },
    },
    server: {
      type: 'object',
      optional: true,
      fields: {
        path: {
          type: 'string',
          optional: true,
        },
      },
    },
  },
};
