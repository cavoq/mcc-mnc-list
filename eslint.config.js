const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 8,
      sourceType: "commonjs",
      globals: Object.assign({}, globals.node),
    },
    rules: {
      "no-console": "off",
    },
  },
];
