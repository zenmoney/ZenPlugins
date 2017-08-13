const {paths, params} = require('./constants');
const fs = require('fs');
const path = require('path');
const httpProxy = require('http-proxy');
const _ = require('underscore');
const {ZP_HEADER_PREFIX} = require("../src/shared");

const serializeErrors = (handler) => {
  return function(req, res) {
    try {
      handler.apply(this, arguments);
    } catch (e) {
      res.status(500).json({
        message: e.message,
        stack: e.stack.slice(e.stack.indexOf("at")),
      });
    }
  };
};

module.exports = ({allowedHost, host, https}) => {
  return {
    compress: false,
    clientLogLevel: 'none',
    contentBase: paths.appPublic,
    watchContentBase: true,
    publicPath: "/",
    quiet: true,
    watchOptions: {
      aggregateTimeout: 100,
      poll: false,
    },
    https: https,
    host: host,
    overlay: false,
    public: allowedHost,
    setup(app) {
      app.disable('x-powered-by');

      app.get(
        '/zen/manifest',
        serializeErrors((req, res) => {
          res.set('Content-Type', 'text/xml');
          res.send(fs.readFileSync(`${params.pluginPath}/ZenmoneyManifest.xml`));
        })
      );

      app.get(
        '/zen/preferences',
        serializeErrors((req, res) => {
          const preferences = _.omit(require('../debugger/zp_preferences.json'), ['zp_plugin_directory', 'zp_pipe']);
          res.json(preferences);
        })
      );

      app.get(
        '/zen/data',
        serializeErrors((req, res) => res.json(require('../debugger/zp_data.json')))
      );

      app.get(
        '/zen/pipe',
        serializeErrors((req, res) => {
          res.set('Content-Type', 'text/plain');
          res.send(fs.readFileSync(path.join(__dirname, '../debugger/zp_pipe.txt')));
        })
      );

      const proxy = new httpProxy.createProxyServer();
      proxy.on('error', function(err, req, res) {
        res.writeHead(502, {'Content-Type': 'text/plain'});
        res.end(`There was an error proxying your request\n${err.toString()}\n${JSON.stringify(err)}`);
      });

      app.all('/out', (req, res) => {
        let target = req.query.to;
        if (!target) {
          throw new Error('"to" queryParam must be present');
        }

        const incomingHeaders = Array.from(Object.entries(req.headers));
        incomingHeaders.forEach(([key, value]) => {
          delete req.headers[key];
          if (key.startsWith(ZP_HEADER_PREFIX)) {
            req.headers[key.slice(ZP_HEADER_PREFIX.length)] = value;
          }
        });
        proxy.web(req, res, {
          target: target,
          proxyTimeout: 5000,
          changeOrigin: true,
          preserveHeaderKeyCase: true,
          ignorePath: true,
          secure: false,
          xfwd: false,
        });
      });
    },
  };
};
