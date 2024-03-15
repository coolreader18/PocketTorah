module.exports = async (env) => {
  env.platform ??= process.env.PLATFORM;
  if (!env.platform) {
    throw new Error("Missing platform");
  }

  const { default: config } =
    env.platform === "web"
      ? await import("./webpack.config.web.mjs")
      : await import("./webpack.config.native.mjs");
  return config(env);
};
