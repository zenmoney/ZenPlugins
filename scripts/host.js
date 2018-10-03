// builds and hosts index.js plugin bundle to be consumed by bootloader plugin
process.env.BABEL_ENV = 'production'
process.env.NODE_ENV = 'production'
require('./start')
