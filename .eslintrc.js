module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
      '@typescript-eslint',
    ],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    env: {
        node: true,
    },
    rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-case-declarations': 'off',
        '@typescript-eslint/explicit-module-boundary-types': ['warn', {allowArgumentsExplicitlyTypedAsAny: true}],
        'no-constant-condition': ["error", { "checkLoops": false }]
    }
  };