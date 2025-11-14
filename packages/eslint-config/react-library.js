module.exports = {
  extends: [
    './base.js',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/jsx-runtime',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/prop-types': 'off',
    'react-hooks/exhaustive-deps': 'warn',
  },
  env: {
    browser: true,
    es2022: true,
  },
}
