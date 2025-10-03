module.exports = {
  parserOptions: {
    ecmaVersion: 2018,
  },
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  rules: {
    // Enforce return statements in callbacks of array methods
    'array-callback-return': 'error',
    
    // Disallow use of console (we want console.log in Cloud Functions)
    'no-console': 'off',
    
    // Disallow use of variables before they are defined
    'no-use-before-define': ['error', { 'functions': false }],
    
    // Enforce consistent spacing
    'indent': ['error', 2],
    'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
    'semi': ['error', 'always'],
    
    // Require arrow functions as callbacks
    'prefer-arrow-callback': 'error',
    
    // Disallow restricted globals
    'no-restricted-globals': ['error', 'name', 'length'],
    
    // Enforce valid JSDoc comments
    'valid-jsdoc': 'off',
    
    // Disallow unused variables
    'no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_' 
    }],
  },
  overrides: [
    {
      files: ['**/*.spec.*'],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};