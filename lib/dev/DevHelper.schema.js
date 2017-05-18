const def = require('runtype').schemaDef;

module.exports = {
  accept: {
    http_request_incoming: [
      def.Type('BaseConnection'),
      def.Type('object'),
    ],
  },
  emit: {
    server_package: [
      def.Type('base64_buffer'),
    ],
    http_send_response: [
      def.Type('BaseConnection'),
      def.Type('any'),
    ],
    project_error: [
      def.Type('any'),
    ],
    client_project_changed: [],
    server_project_changed: [],
  },
};
