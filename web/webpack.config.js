const HtmlBundlerPlugin = require("html-bundler-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
const repack = require("@callstack/repack");
const { GenerateSW } = require("workbox-webpack-plugin");

const appDirectory = path.resolve(__dirname, "../");

// This is needed for webpack to compile JavaScript.
// Many OSS React Native packages are not compiled to ES5 before being
// published. If you depend on uncompiled packages they may cause webpack build
// errors. To fix this webpack can be configured to compile to the necessary
// `node_module`.
const babelLoaderConfiguration = {
  test: /\.(js|ts|tsx)$/,
  // Add every directory that needs to be compiled by Babel during the build.
  include: [
    path.resolve(appDirectory, "web"),
    path.resolve(appDirectory, "src"),
    path.resolve(appDirectory, "data/audio"),
    path.resolve(appDirectory, "node_modules/react-native-uncompiled"),
    path.resolve(appDirectory, "node_modules/react-native-calendars"),
    path.resolve(appDirectory, "node_modules/react-native-swipe-gestures"),
  ],
  use: {
    loader: "babel-loader",
    options: {
      cacheDirectory: true,
      // The 'metro-react-native-babel-preset' preset is recommended to match React Native's packager
      presets: ["module:metro-react-native-babel-preset"],
      // Re-write paths to import only the modules needed by the app
      plugins: ["react-native-web"],
    },
  },
};

const publicPath = process.env.WEBPACK_PUBLIC_PATH || "/PocketTorah/";

/**
 * @param {webpack.RuleSetConditionAbsolute>} test
 * @param {webpack.RuleSetCondition} issuer
 * @param {webpack.RuleSetRule} then
 * @param {webpack.RuleSetRule} else_
 * @returns {webpack.RuleSetRule[]}
 */
const ifIssuerElse = (test, issuer, then, else_) => [
  { ...then, test, issuer },
  { ...else_, test, issuer: { not: issuer } },
];

// This is needed for webpack to import static images in JavaScript files.
/** @type {webpack.RuleSetRule} */
const imageLoaderConfiguration = ifIssuerElse(
  /\.(gif|jpe?g|png|svg|mp3|ttf|xml)$/,
  /\.[jt]sx?$/,
  {
    use: {
      loader: "@callstack/repack/assets-loader",
      options: { platform: "web", scalableAssetExtensions: repack.SCALABLE_ASSETS, publicPath },
    },
  },
  { type: "asset/resource" },
);

/** @returns {webpack.Configuration} */
module.exports = (env) => ({
  // configures where the build ends up
  output: {
    path: path.resolve(appDirectory, "dist"),
    publicPath,
    clean: {
      keep: /(\.nojekyll|\.git)$/,
    },
  },
  target: "web",

  // ...the rest of your config

  module: {
    rules: [
      {
        test: /\.webmanifest$/i,
        use: "webpack-webmanifest-loader",
        type: "asset/resource",
      },
      babelLoaderConfiguration,
      ...imageLoaderConfiguration,
      {
        test: /\.txt$/,
        type: "asset/source",
      },
    ],
  },

  resolve: {
    // This will only alias the exact import "react-native"
    alias: {
      "react-native$": "react-native-web",
      "react-native/Libraries/Image/AssetRegistry": "react-native-web/dist/modules/AssetRegistry",
    },
    // If you're working on a multi-platform React Native app, web-specific
    // module implementations should be written in files using the extension
    // `.web.js`.
    extensions: [".web.js", ".js", ".web.ts", ".ts", ".web.tsx", ".tsx"],
  },
  plugins: [
    new webpack.EnvironmentPlugin({ REACT_NAV_LOGGING: "" }),
    new webpack.DefinePlugin({ __DEV__: !env.production }),
    new HtmlBundlerPlugin({
      entry: { index: path.resolve(appDirectory, "web/index.html") },
      loaderOptions: {
        sources: [
          {
            tag: "link",
            attributes: ["href"],
            filter: ({ attributes }) => attributes.rel === "manifest",
          },
        ],
      },
    }),
    new GenerateSW({
      exclude: [/\.mp3$/, /\.map$/, /^manifest.*\.js$/],
      // include: [/data\/trope\/audio\/.*\.mp3$/],
    }),
  ],
});
