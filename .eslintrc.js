const isProd = process.env.NODE_ENV === 'production'

module.exports = {
    parser: '@typescript-eslint/parser',
    root: true,
    env: {
        node: true,
        browser: true
    },
    plugins: [
        '@typescript-eslint'
    ],
    extends: [
        'plugin:@typescript-eslint/recommended',
        'eslint:recommended'
    ],
    rules: {
        'no-console': isProd ? 'error' : 'off',
        'no-debugger': isProd ? 'error' : 'off',
        '@typescript-eslint/ban-ts-comment': [ 'error' ],
        '@typescript-eslint/no-unused-vars': 'error',
        'no-unused-vars': 'off',
        semi: [ 'error', 'never' ],
        quotes: [ 'error', 'single' ],
        'object-curly-spacing': [ 'error', 'always' ],
        'array-bracket-spacing': [ 'error', 'always' ],
        'space-before-function-paren': [ 'error', 'always' ],
        '@typescript-eslint/no-var-requires': 0,
        indent: [ 'error', 4, { SwitchCase: 1 } ],
        'quote-props': [ 'error', 'as-needed' ],
        'object-property-newline': [ 'error' ],
        'key-spacing': [ 'error', { afterColon: true } ]
    },
    parserOptions: {
        parser: 'esprima',
    },
}
