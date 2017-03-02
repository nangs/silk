module.exports = {
  rules: {
    'no-extraneous-dependencies': require('./no-extraneous-dependencies'),
  },
  configs: {
    recommended: {
      rules: {
        'silk/no-extraneous-dependencies': ['error', {
          devDependencies: ["**/test/**/*.js", "**/webpack.config.js"],
          optionalDependencies: true,
          peerDependencies: true,
          symlinkDependencies: true,
        }],
      },
    },
  },
};
