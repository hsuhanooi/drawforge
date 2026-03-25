module.exports = {
  env: {
    node: true,
    jest: true,
    es2022: true
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2022
  },
  rules: {
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
};
