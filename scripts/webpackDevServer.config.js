const {paths, params} = require("./constants");
const fs = require("fs");
const path = require("path");
const httpProxy = require("http-proxy");
const _ = require("lodash");
const {TRANSFERABLE_HEADER_PREFIX, PROXY_TARGET_HEADER} = require("../src/shared");
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

const readJsonSync = (file, missingFileValue) => {
    const {content, path} = readPluginFileSync(file, missingFileValue);
    try {
        return JSON.parse(content);
    } catch (e) {
        e.message += ` in ${path}`;
        throw e;
    }
};

const writeJsonSync = (file, object) => {
    writePluginFileSync(file, JSON.stringify(object, null, 4));
};

const removeSecureSealFromCookieValue = (value) => value.replace(/\s?Secure(;|\s*$)/ig, "");

const readPluginFileSync = (file, missingFileValue) => {
    const candidatePaths = [
        path.join(params.pluginPath, file),
        path.join(__dirname, "../debugger/", file),
    ];
    const existingPaths = candidatePaths.filter(x => fs.existsSync(x));
    if (existingPaths.length === 0) {
        if (missingFileValue) {
            return {content: missingFileValue, path: null};
        } else {
            throw new Error(`${file} is missing, search paths: [${candidatePaths}]`)
        }
    }
    return {
        content: stripBOM(fs.readFileSync(existingPaths[0], "utf8")),
        path: existingPaths[0],
    };
};

const writePluginFileSync = (file, content) => {
    fs.writeFileSync(path.join(params.pluginPath, file), content, "utf8");
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
                    const manifest = readPluginManifest();
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
                    const preferences = _.omit(readJsonSync("zp_preferences.json"), ["zp_plugin_directory", "zp_pipe"]);
                    const preferencesSchema = readPluginPreferencesSchema();
                    const missingObligatoryPrefKeys = preferencesSchema
                        .filter((x) => x.obligatory && !x.defaultValue && !(x.key in preferences))
                        .map((x) => x.key);
                    if (missingObligatoryPrefKeys.length > 0) {
                        throw new Error(
                            `The following preference keys are obligatory and don't have defaultValue, thus should be set in zp_preferences.json: ` +
                            JSON.stringify(missingObligatoryPrefKeys)
                        );
                    }
                    const defaultValues = preferencesSchema.reduce((memo, preferenceSchema) => {
                        memo[preferenceSchema.key] = preferenceSchema.defaultValue;
                        return memo;
                    }, {});
                    res.json(_.defaults(preferences, defaultValues));
                })
            );

            app.get(
                "/zen/data",
                serializeErrors((req, res) => {
                    const data = readJsonSync("zp_data.json", "{}");
                    return res.json(data);
                })
            );

            app.post(
                "/zen/data",
                bodyParser.json(),
                serializeErrors((req, res) => {
                    console.assert(req.body.newValue, "newValue should be provided");
                    writeJsonSync("zp_data.json", req.body.newValue);
                    return res.json(true);
                })
            );

            app.get(
                "/zen/pipe",
                serializeErrors((req, res) => {
                    res.set("Content-Type", "text/plain");
                    res.send(readPluginFileSync("zp_pipe.txt", "").content.replace(/\n$/, ""));
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
                const location = proxyRes.headers["location"];
                if (location && /^https?:\/\//i.test(location)) {
                    const {origin, pathname, search} = new URL(location);
                    proxyRes.headers["location"] = pathname + search +
                        ((search === '') ? '?' : '&') + PROXY_TARGET_HEADER + '=' + origin;
                }
            });

            app.all("*", (req, res, next) => {
                const targetIdx = req.url.indexOf(PROXY_TARGET_HEADER);
                let target;
                if (targetIdx > 0) {
                    target  = req.url.substring(targetIdx + PROXY_TARGET_HEADER.length + 1);
                    req.url = req.url.substring(0, targetIdx - 1);
                } else {
                    target = req.headers[PROXY_TARGET_HEADER];
                }
                if (!target) {
                    next();
                    return;
                }
                target += req.url;

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
                    xfwd: false
                });
            });
        },
    };
};
