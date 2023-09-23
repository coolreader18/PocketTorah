const HtmlBundlerPlugin = require("html-bundler-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
const { SCALABLE_ASSETS } = require("@callstack/repack/dist/webpack/utils/assetExtensions.js");

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

const publicPath = process.env.WEBPACK_PUBLIC_PATH || "/";

// This is needed for webpack to import static images in JavaScript files.
const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg|mp3|ttf)$/,
  use: {
    loader: "@callstack/repack/assets-loader",
    options: { platform: "web", scalableAssetExtensions: SCALABLE_ASSETS, publicPath },
  },
};

/** @returns {webpack.Configuration} */
module.exports = (env) => ({
  // configures where the build ends up
  output: {
    path: path.resolve(appDirectory, "dist"),
    publicPath,
    clean: true,
  },
  target: "web",

  // ...the rest of your config

  module: {
    rules: [
      babelLoaderConfiguration,
      imageLoaderConfiguration,
      {
        test: /\.txt$/,
        type: "asset/source",
      },
      {
        test: /\.css$/,
        use: "css-loader",
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
    }),
  ],
});
