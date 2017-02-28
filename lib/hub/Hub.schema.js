var def = require('runtype').schemaDef;

module.exports = {
  accepts: [
    def.TypedArray([
      def.Type('any'),
    ]),
    def.TypedArray([
      def.Type('any'),
      def.Type('any'),
    ]),
    def.TypedArray([
      def.Type('any'),
      def.Type('any'),
      def.Type('any'),
    ]),
  ],
  emits: [
    def.TypedArray([
      def.Type('any'),
    ]),
    def.TypedArray([
      def.Type('any'),
      def.Type('any'),
    ]),
    def.TypedArray([
      def.Type('any'),
      def.Type('any'),
      def.Type('any'),
    ]),
  ],
};
