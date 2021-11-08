module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
    mocha: true,
  },
  extends: ['plugin:react/recommended', 'airbnb', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
  },
  plugins: ['react', 'jsx-a11y'],
  rules: {
    'prettier/prettier': ['error'],
    'react/prop-types': 0,
  },
};
