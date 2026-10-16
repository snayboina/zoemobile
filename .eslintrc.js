module.exports = {
  extends: ['expo', 'eslint:recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  env: {
    jest: true,
    node: true,
    es6: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
};
