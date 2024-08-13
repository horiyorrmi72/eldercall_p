const globals = require('globals');
const pluginJs = require('@eslint/js');

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs', // Use CommonJS modules
      globals: {
        ...globals.node, // Include Node.js globals
        ...globals.browser, // Include browser globals if needed
      },
    },
    rules: {
      'no-console': 'warn', // Warn about console.log statements
      indent: ['error', 2], // Enforce 2-space indentation
      quotes: ['error', 'single'], // Enforce single quotes
      semi: ['error', 'always'], // Require semicolons
    },
  },
  pluginJs.configs.recommended, // Use recommended rules from @eslint/js
];
