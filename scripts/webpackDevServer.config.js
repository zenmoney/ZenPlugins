const {paths, params} = require("./constants");
const fs = require("fs");
const path = require("path");
const httpProxy = require("http-proxy");
const _ = require("underscore");
const {TRANSFERABLE_HEADER_PREFIX, PROXY_TARGET_HEADER} = require("../src/shared");
const {getManifest} = require("./utils");
const stripBOM = require("strip-bom");

const convertErrorToSerializable = (e) => _.pick(e, ["message", "stack"]);

const serializeErrors = (handler) => {
    return function(req, res) {
        try {
            handler.apply(this, arguments);
        } catch (e) {
            res.status(500).json(convertErrorToSerializable(e));
        }
    };
};

const readJson = (file, missingFileValue) => {
    const {content, path} = readPluginFile(file, missingFileValue);
    try {
        return JSON.parse(content);
    } catch (e) {
        e.message += ` in ${path}`;
        throw e;
    }
};

const removeSecureSealFromCookieValue = (value) => value.replace(/\s?Secure;/i, "");

const readPluginFile = (file, missingFileValue) => {
    const candidatePaths = [
        path.join(params.pluginPath, file),
        path.join(__dirname, "../debugger/", file),
    ];
    const existingPaths = candidatePaths.filter(x => fs.existsSync(x));
    if (existingPaths.length === 0) {
        if (missingFileValue) {
            return missingFileValue;
        } else {
            throw new Error(`${file} is missing, search paths: [${candidatePaths}]`)
        }
    }
    return {
        content: stripBOM(fs.readFileSync(existingPaths[0], "utf8")),
        path: existingPaths[0],
    };
};
module.exports = ({allowedHost, host, https}) => {
    return {
        compress: false,
        clientLogLevel: "none",
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
            app.disable("x-powered-by");

            app.get(
                "/zen/manifest",
                serializeErrors((req, res) => {
                    res.set("Content-Type", "text/xml");
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
                "/zen/preferences",
                serializeErrors((req, res) => {
                    const preferences = readJson("zp_preferences.json");
                    const patchedPreferences = _.omit(preferences, ["zp_plugin_directory", "zp_pipe"]);
                    res.json(patchedPreferences);
                })
            );

            app.get(
                "/zen/data",
                serializeErrors((req, res) => {
                    const data = readJson("zp_data.json", "{}");
                    return res.json(data);
                })
            );

            app.get(
                "/zen/pipe",
                serializeErrors((req, res) => {
                    res.set("Content-Type", "text/plain");
                    res.send(readPluginFile("zp_pipe.txt", ""));
                })
            );

            const proxy = new httpProxy.createProxyServer();
            proxy.on("error", (err, req, res) => {
                res.status(502).json(convertErrorToSerializable(err));
            });
            proxy.on("proxyRes", (proxyRes, req, res) => {
                if (proxyRes.headers["set-cookie"]) {
                    proxyRes.headers["set-cookie"] = proxyRes.headers["set-cookie"].map(removeSecureSealFromCookieValue);
                }
            });

            app.all("*", (req, res, next) => {
                const target = req.headers[PROXY_TARGET_HEADER];
                if (!target) {
                    next();
                    return;
                }
                req.headers = _.object(_.compact(_.pairs(req.headers).map((pair) => {
                    const [key, value] = pair;
                    if (key === "cookie") {
                        return pair;
                    }
                    if (key !== PROXY_TARGET_HEADER && key.startsWith(TRANSFERABLE_HEADER_PREFIX)) {
                        return [key.slice(TRANSFERABLE_HEADER_PREFIX.length), value];
                    }
                    return null;
                })));
                proxy.web(req, res, {
                    target: target,
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
