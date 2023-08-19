const isProd = process.env.NODE_ENV === 'production'
module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [],
  rules: {
    'no-console': isProd ? 'error' : 'off',
    'no-debugger': isProd ? 'error' : 'off',
  },
  parserOptions: {
    parser: 'esprima',
  },
};
