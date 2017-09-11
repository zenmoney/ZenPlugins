const output = require("babel-preset-react-app");

const getTargets = (oldTargets) => {
    if ("BABEL_TARGET" in process.env) {
        return JSON.parse(process.env.BABEL_TARGET);
    }
    if (process.env.NODE_ENV === "development") {
        return {chrome: 60};
    }
    return oldTargets;
};

module.exports = Object.assign({}, output, {
    presets: output.presets.map((preset) => {
        let [presetPath, args] = preset;
        args = Object.assign({}, args, {targets: getTargets(args.target)});
        return typeof presetPath === "string" && presetPath.includes("babel-preset-env") ? [presetPath, args] : preset;
    }),
});
