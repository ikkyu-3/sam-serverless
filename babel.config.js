module.exports = function (api) {
  api.cache(true);

  const presets = [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "8.10",
        },
        useBuiltIns: "usage",
      }
    ],
    "@babel/preset-typescript",
  ];
  const plugins = [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-syntax-dynamic-import",
  ];

  return {
    presets,
    plugins
  };
}