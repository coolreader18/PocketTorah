const HtmlBundlerPlugin = require("html-bundler-webpack-plugin");
const path = require("path");
const webpack = require("webpack");

const appDirectory = path.resolve(__dirname, "../");

// This is needed for webpack to compile JavaScript.
// Many OSS React Native packages are not compiled to ES5 before being
// published. If you depend on uncompiled packages they may cause webpack build
// errors. To fix this webpack can be configured to compile to the necessary
// `node_module`.
const babelLoaderConfiguration = {
  test: /\.js$/,
  // Add every directory that needs to be compiled by Babel during the build.
  include: [
    path.resolve(appDirectory, "web"),
    path.resolve(appDirectory, "src"),
    path.resolve(appDirectory, "node_modules/react-native-uncompiled"),
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

// This is needed for webpack to import static images in JavaScript files.
const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg|mp3|ttf)$/,
  type: "asset",
};

/** @type {webpack.Configuration} */
module.exports = {

  // configures where the build ends up
  output: {
    path: path.resolve(appDirectory, "dist"),
    // publicPath: "/",
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
      "react-native": "react-native-web",
    },
    // If you're working on a multi-platform React Native app, web-specific
    // module implementations should be written in files using the extension
    // `.web.js`.
    extensions: [".web.js", ".js"],
  },
  plugins: [
    new webpack.EnvironmentPlugin({ REACT_NAV_LOGGING: "" }),
    new HtmlBundlerPlugin({
      entry: { index: path.resolve(appDirectory, "web/index.html") },
    }),
  ],
};
