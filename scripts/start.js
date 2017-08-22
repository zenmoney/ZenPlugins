process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
process.on('unhandledRejection', err => {
  throw err;
});

const fs = require('fs');
const chalk = require('chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const clearConsole = require('react-dev-utils/clearConsole');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const {choosePort, createCompiler, prepareUrls} = require('react-dev-utils/WebpackDevServerUtils');
const openBrowser = require('react-dev-utils/openBrowser');
const {paths, params} = require('./constants');
const createWebpackConfig = require('./webpack.config');
const createDevServerConfig = require('./webpackDevServer.config');

if (!checkRequiredFiles([paths.pluginJs])) {
  process.exit(1);
}

const HOST = process.env.HOST || 'localhost';
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;
const https = process.env.HTTPS === 'true';
choosePort(HOST, DEFAULT_PORT)
  .then(port => {
    const webpackConfig = createWebpackConfig({production: false});
    const urls = prepareUrls(https ? 'https' : 'http', HOST, port);
    const compiler = createCompiler(webpack, webpackConfig, params.pluginName, urls, fs.existsSync(paths.yarnLockFile));
    const serverConfig = createDevServerConfig({allowedHost: urls.lanUrlForConfig, host: HOST, https});
    const devServer = new WebpackDevServer(compiler, serverConfig);
    devServer.listen(port, HOST, err => {
      if (err) {
        return console.log(err);
      }
      if (process.stdout.isTTY) {
        clearConsole();
      }
      console.log(chalk.cyan('Compiling...'));
      openBrowser(urls.localUrlForBrowser);
    });
    ['SIGINT', 'SIGTERM'].forEach(function(sig) {
      process.on(sig, function() {
        devServer.close();
        process.exit();
      });
    });
  })
  .catch(err => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });
