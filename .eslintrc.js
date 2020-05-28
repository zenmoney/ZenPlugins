module.exports = {
  'parser': 'babel-eslint',
  'plugins': [
    'github'
  ],
  'extends': [
    'standard',
    'plugin:import/errors'
  ],
  'globals': {
    'console': false,
    'ZenMoney': false,
    'fetch': false,
    'TemporaryError': false,
    'InvalidPreferencesError': false
  },
  'overrides': [
    {
      'files': [
        '**/*.test.js',
        '**/__tests__/**/*.js'
      ],
      'plugins': ['jest'],
      'env': {
        'jest': true
      }
    }
  ],
  'rules': {
    'eqeqeq': ['error', 'always'],
    'no-var': 'error',
    'github/array-foreach': 'error',
    'array-callback-return': 'error'
  }
}
