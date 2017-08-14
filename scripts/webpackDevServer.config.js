const {paths} = require('./constants');
const fs = require('fs');
const path = require('path');
const httpProxy = require('http-proxy');
const _ = require('underscore');
const {ZP_HEADER_PREFIX} = require("../src/shared");
const {getManifest} = require('./utils');

const convertErrorToSerializable = (e) => ({
  message: e.message,
  stack: e.stack.slice(e.stack.indexOf("at")),
});

const serializeErrors = (handler) => {
  return function(req, res) {
    try {
      handler.apply(this, arguments);
    } catch (e) {
      res.status(500).json(convertErrorToSerializable(e));
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
          const manifest = getManifest();
          ["id", "build", "files", "version", "preferences"].forEach((requiredProp) => {
            if (!manifest[requiredProp]) {
              throw new Error(`Wrong ZenmoneyManifest.xml: ${requiredProp} prop should be set`);
            }
          });
          res.json(manifest);
        })
      );

      app.get(
        '/zen/preferences',
        serializeErrors((req, res) => {
          const preferences = JSON.parse(fs.readFileSync(path.join(__dirname, '../debugger/zp_preferences.json')));
          const patchedPreferences = _.omit(preferences, ['zp_plugin_directory', 'zp_pipe']);
          res.json(patchedPreferences);
        })
      );

      app.get(
        '/zen/data',
        serializeErrors((req, res) => {
          const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../debugger/zp_data.json')));
          return res.json(data);
        })
      );

      app.get(
        '/zen/pipe',
        serializeErrors((req, res) => {
          res.set('Content-Type', 'text/plain');
          res.send(fs.readFileSync(path.join(__dirname, '../debugger/zp_pipe.txt')));
        })
      );

      const proxy = new httpProxy.createProxyServer();
      proxy.on('error', (err, req, res) => {
        res.status(502).json(convertErrorToSerializable(err));
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
