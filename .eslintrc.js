module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-native'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-native/all'
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
    'react-native/react-native': true
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
  }
};
