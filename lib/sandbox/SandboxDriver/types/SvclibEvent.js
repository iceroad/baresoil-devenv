module.exports = {
  name: 'SvclibEvent',
  type: 'object',
  fields: {
    service: {
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
