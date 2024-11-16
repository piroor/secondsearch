import globals from "globals";

export default [{
    ignores: ["eslint.config.mjs", "extlib/*", "!**/.eslintrc.js"],
}, {
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.webextensions,
        },

        ecmaVersion: 2018,
        sourceType: "module",
    },

    settings: {
        "import/resolver": {
            "babel-module": {
                root: ["./"],
            },
        },
    },

    rules: {
        indent: ["warn", 2, {
            SwitchCase: 1,
            MemberExpression: 1,

            CallExpression: {
                arguments: "first",
            },

            VariableDeclarator: {
                var: 2,
                let: 2,
                const: 3,
            },
        }],

        quotes: ["warn", "single", {
            avoidEscape: true,
            allowTemplateLiterals: true,
        }],
    },
}];