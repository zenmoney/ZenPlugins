module.exports = {
    "extends": "react-app",
    "globals": {
        "console": false,
        "ZenMoney": false,
        "fetch": false,
        "TemporaryError": false,
        "InvalidPreferencesError": false,
    },
    "rules": {
        "comma-dangle": [
            2,
            "always-multiline",
        ],
        "no-implicit-coercion": [
            2,
            {
                "boolean": true,
                "string": true,
                "number": true,
            },
        ],
        "brace-style": [
            2,
            "1tbs",
            {
                "allowSingleLine": true
            },
        ],
        "no-with": 2,
        "no-multiple-empty-lines": 2,
        "no-multi-spaces": 2,
        "one-var": [
            2,
            "never",
        ],
        "indent": [
            2,
            4,
            {
                "SwitchCase": 1,
            },
        ],
        "quotes": [
            2,
            "double",
            {
                "allowTemplateLiterals": true,
            },
        ],
    },
};
