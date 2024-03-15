import * as Repack from "@callstack/repack";
import * as path from "path";
import webpack from "webpack";

export const appDirectory = Repack.getDirname(import.meta.url);

/**
 * @param {webpack.RuleSetRule} test
 * @param {webpack.RuleSetCondition} issuer
 * @param {webpack.RuleSetRule} then
 * @param {webpack.RuleSetRule} else_
 * @returns {webpack.RuleSetRule[]}
 */
const ifIssuerElse = (cond, issuer, then, else_) => [
  { ...then, ...cond, issuer },
  { ...else_, ...cond, issuer: { not: issuer } },
];

// This is needed for webpack to import static images in JavaScript files.
/** @return {webpack.RuleSetRule[]} */
export const imageLoaderConfigurations = (opts) => [
  ...ifIssuerElse(
    {
      test: Repack.getAssetExtensionsRegExp([
        ...Repack.ASSET_EXTENSIONS.filter((ext) => ext !== "svg" && ext !== "html"),
        "woff2",
      ]),
    },
    /\.[jt]sx?$/,
    {
      use: {
        loader: "@callstack/repack/assets-loader",
        options: { scalableAssetExtensions: Repack.SCALABLE_ASSETS, ...opts },
      },
    },
    { type: "asset/resource" },
  ),
  /\.[jt]sx?$/,
  {
    resourceFragment: /res/,
    type: "javascript/auto",
    use: {
      loader: "@callstack/repack/assets-loader",
      options: { scalableAssetExtensions: Repack.SCALABLE_ASSETS, ...opts },
    },
  },
  {
    test: /\.svg$/,
    use: {
      loader: "@svgr/webpack",
      options: { native: true },
    },
  },
];

/** @return {webpack.RuleSetRule[]} */
export const babelLoaderConfigurations = ({ devServer } = {}) => [
  {
    test: /\.[jt]sx?$/,
    // Add every directory that needs to be compiled by Babel during the build.
    include: [
      path.resolve(appDirectory, "web"),
      path.resolve(appDirectory, "src"),
      path.resolve(appDirectory, "data/audio"),
      path.resolve(appDirectory, "node_modules/expo-av"),
      path.resolve(appDirectory, "node_modules/react-native-uncompiled"),
      path.resolve(appDirectory, "node_modules/react-native-calendars"),
      path.resolve(appDirectory, "node_modules/react-native-swipe-gestures"),
      path.resolve(appDirectory, "node_modules/@callstack/repack"),
    ],
    use: {
      loader: "babel-loader",
      options: {
        cacheDirectory: true,
      },
    },
  },
  {
    test: /\.[jt]sx?$/,
    use: {
      loader: "babel-loader",
      options: {
        cacheDirectory: true,
        /** Add React Refresh transform only when HMR is enabled. */
        plugins: devServer && devServer.hmr ? ["module:react-refresh/babel"] : undefined,
      },
    },
  },
  {
    test: /\.json/,
    resourceQuery: /res/,
    type: "asset/resource",
  },
];
