module.exports = {
    env: {
        es6: true,
        node: true
    },
    parserOptions: {
        'ecmaVersion': 2022,
        'sourceType': 'module'
    },
    extends: [
        'eslint:recommended',
        'google'
    ],
    rules: {
        'no-restricted-globals': ['error', 'name', 'length'],
        'prefer-arrow-callback': 'error',
        'quotes': ['error', 'single', { 'allowTemplateLiterals': true, 'avoidEscape': true }],
        'object-curly-spacing': ['error', 'always'],
        'indent': ['error', 4],
        'max-len': ['warn', { 'code': 120 }],
        'comma-dangle': ['warn', 'never'],
        'brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
        'block-spacing': ['error', 'always']
    },
    overrides: [
        {
            files: ['**/*.spec.*'],
            env: {
                mocha: true
            },
            rules: {}
        }
    ],
    globals: {},
    ignorePatterns: [
        'node_modules/',
        'dist/',
        '**/docs/',
        '**/*.test.js',
        '*template*'
    ]
};
