module.exports = {
  presets: ['bili/babel'],
  plugins: [
    ["@babel/plugin-proposal-private-methods", { "loose": true }],
    ["@babel/plugin-proposal-class-properties", { "loose": true }]
  ]
};
