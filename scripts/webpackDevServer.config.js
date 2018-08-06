const {paths, params} = require("./constants");
const fs = require("fs");
const path = require("path");
const httpProxy = require("http-proxy");
const _ = require("lodash");
const {getTargetUrl, TRANSFERABLE_HEADER_PREFIX, PROXY_TARGET_HEADER} = require("../src/shared");
const {readPluginManifest, readPluginPreferencesSchema} = require("./utils");
const stripBOM = require("strip-bom");
const bodyParser = require("body-parser");
const {URL} = require("url");

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

const readJsonSync = (file) => {
    const content = readPluginFileSync(file);
    try {
        return JSON.parse(content);
    } catch (e) {
        e.message += ` in ${file}`;
        throw e;
    }
};

const removeSecureSealFromCookieValue = (value) => value.replace(/\s?Secure(;|\s*$)/ig, "");

const removeDomainFromCookieValue = (value) => value.replace(/\s?Domain=[^;]*(;|\s*$)/ig, "");

const readPluginFileSync = (filepath) => stripBOM(fs.readFileSync(filepath, "utf8"));

const pluginPreferencesPath = path.join(params.pluginPath, "zp_preferences.json");
const pluginDataPath = path.join(params.pluginPath, "zp_data.json");
const pluginCodePath = path.join(params.pluginPath, "zp_pipe.txt");

const ensureFileExists = (filepath, defaultContent) => {
    try {
        fs.writeFileSync(filepath, defaultContent, {encoding: "utf8", flag: "wx"});
    } catch (e) {
        if (e.code !== "EEXIST") {
            throw e;
        }
    }
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
        hot: true,
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
                    const manifest = readPluginManifest();
                    ["id", "build", "files", "version", "preferences"].forEach((requiredProp) => {
                        if (!manifest[requiredProp]) {
                            throw new Error(`Wrong ZenmoneyManifest.xml: ${requiredProp} prop should be set`);
                        }
                    });
                    res.json(manifest);
                }),
            );

            app.get(
                "/zen/zp_preferences.json/schema",
                serializeErrors((req, res) => {
                    res.json(readPluginPreferencesSchema());
                }),
            );

            app.get(
                "/zen/zp_preferences.json",
                serializeErrors((req, res) => {
                    ensureFileExists(pluginPreferencesPath, "{}\n");
                    const preferences = _.omit(readJsonSync(pluginPreferencesPath), ["zp_plugin_directory", "zp_pipe"]);
                    res.json(preferences);
                }),
            );

            app.post(
                "/zen/zp_preferences.json",
                bodyParser.json(),
                serializeErrors((req, res) => {
                    fs.writeFileSync(pluginPreferencesPath, JSON.stringify(req.body, null, 4), "utf8");
                    return res.json(true);
                }),
            );

            app.get(
                "/zen/zp_data.json",
                serializeErrors((req, res) => {
                    ensureFileExists(pluginDataPath, "{}\n");
                    const data = readJsonSync(pluginDataPath);
                    return res.json(data);
                }),
            );

            app.post(
                "/zen/zp_data.json",
                bodyParser.json(),
                serializeErrors((req, res) => {
                    console.assert(req.body.newValue, "newValue should be provided");
                    fs.writeFileSync(pluginDataPath, JSON.stringify(req.body.newValue, null, 4), "utf8");
                    return res.json(true);
                }),
            );

            app.get(
                "/zen/zp_pipe.txt",
                serializeErrors((req, res) => {
                    res.set("Content-Type", "text/plain");
                    ensureFileExists(pluginCodePath, "");
                    const content = readPluginFileSync(pluginCodePath);
                    res.send(content.replace(/\n$/, ""));
                }),
            );

            const proxy = new httpProxy.createProxyServer();
            proxy.on("error", (err, req, res) => {
                res.status(502).json(convertErrorToSerializable(err));
            });
            proxy.on("proxyRes", (proxyRes, req, res) => {
                if (proxyRes.headers["set-cookie"]) {
                    proxyRes.headers["set-cookie"] = proxyRes.headers["set-cookie"]
                        .map(removeSecureSealFromCookieValue)
                        .map(removeDomainFromCookieValue);
                    proxyRes.headers[TRANSFERABLE_HEADER_PREFIX + "set-cookie"] = proxyRes.headers["set-cookie"];
                }
                const location = proxyRes.headers["location"];
                if (location && /^https?:\/\//i.test(location)) {
                    const {origin, pathname, search} = new URL(location);
                    proxyRes.headers["location"] = pathname + search +
                        ((search === "") ? "?" : "&") + PROXY_TARGET_HEADER + "=" + origin;
                }
            });

            app.all("*", (req, res, next) => {
                const target = getTargetUrl(req.url, req.headers[PROXY_TARGET_HEADER]);
                if (!target) {
                    next();
                    return;
                }

                if (req.rawHeaders) {
                    const headers = {};
                    for (let i = 0; i < req.rawHeaders.length; i += 2) {
                        let header = req.rawHeaders[i];
                        const key = header.toLowerCase();
                        if (key.trim() !== "cookie") {
                            if (key === PROXY_TARGET_HEADER || !key.startsWith(TRANSFERABLE_HEADER_PREFIX)) {
                                continue;
                            }
                            header = header.slice(TRANSFERABLE_HEADER_PREFIX.length);
                        }
                        const value = req.rawHeaders[i + 1];
                        if (headers[header]) {
                            headers[header] += "," + value;
                        } else {
                            headers[header] = value;
                        }
                    }
                    req.headers = headers;
                } else {
                    req.headers = {};
                }

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
