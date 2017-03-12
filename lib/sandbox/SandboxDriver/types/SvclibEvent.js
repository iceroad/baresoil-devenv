module.exports = {
  name: 'SvclibEvent',
  type: 'object',
  fields: {
    module: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    data: {
      type: 'any',
      optional: true,
    },
  },
};
