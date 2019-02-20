module.exports = {
  'extends': ['standard', 'standard-react'],
  'globals': {
    'console': false,
    'ZenMoney': false,
    'fetch': false,
    'TemporaryError': false,
    'InvalidPreferencesError': false
  },
  'overrides': [
    {
      'files': '**/*.test.js',
      'plugins': ['jest'],
      'env': {
        'jest': true
      }
    }
  ],
  'rules': {
    'eqeqeq': ['error', 'always']
  }
}
