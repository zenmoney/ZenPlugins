module.exports = {
  parser: '@babel/eslint-parser',
  parserOptions: { requireConfigFile: false, babelOptions: { configFile: './.babelrc' } },
  plugins: [
    'github'
  ],
  extends: [
    'standard',
    'plugin:import/errors'
  ],
  globals: {
    console: 'readonly',
    ZenMoney: 'readonly',
    fetch: 'readonly',
    TemporaryError: 'readonly',
    InvalidPreferencesError: 'readonly'
  },
  overrides: [
    {
      files: [
        '**/*.test.js',
        '**/__tests__/**/*.js'
      ],
      plugins: ['jest'],
      env: {
        jest: true
      }
    },
    {
      files: [
        '*.ts'
      ],
      env: { jest: true },
      parser: '@typescript-eslint/parser',
      parserOptions: { project: './tsconfig.json' },
      plugins: ['@typescript-eslint', 'github', 'jest'],
      settings: {
        'import/resolver': {
          typescript: {
            alwaysTryTypes: true,
            project: './tsconfig.json'
          }
        }
      },
      extends: [
        'plugin:@typescript-eslint/recommended',
        'standard-with-typescript'
      ],
      rules: {
        'no-var': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/strict-boolean-expressions': ['error', {
          allowString: false,
          allowNumber: false,
          allowNullableObject: true,
          allowNullableBoolean: false,
          allowNullableString: false,
          allowNullableNumber: false,
          allowAny: true
        }],
        '@typescript-eslint/no-throw-literal': 'off'
      }
    }
  ],
  rules: {
    eqeqeq: ['error', 'always'],
    'no-var': 'error',
    'github/array-foreach': 'error',
    'array-callback-return': 'error'
  }
}
