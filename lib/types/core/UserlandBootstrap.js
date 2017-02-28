module.exports = {
  name: 'UserlandBootstrap',
  type: 'object',
  fields: {
    package: {
      type: 'base64_buffer'
    },
    svclibInterface: {
      type: 'object',
    },
    baseConnection: {
      type: 'BaseConnection',
    },
  },
};
