module.exports = {
  input: 'src/index.ts',
  presets: ['bili/babel'],
  output: {
    format: ['esm', 'cjs', 'umd-min'],
    moduleName: 'JanusPhoneKit',
    fileName({ format }) {
      return `janus-phone-kit.${format}.js`
    }
  },
  globals: {},
};
