const eslintrc = {
  extends: [
    'airbnb-base',
    'plugin:jest/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  env: {
    node: true,
    jasmine: true,
    jest: true,
    es6: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['markdown', 'jest', '@typescript-eslint'],
  // https://github.com/typescript-eslint/typescript-eslint/issues/46#issuecomment-470486034
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': [2, { args: 'none' }],
      },
    },
  ],
  rules: {
    camelcase: 'off',
    'no-console': 'off',
    'import/extensions': 'off',
  },
};

module.exports = eslintrc;
