const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Firebase auth-compat creates temp directories during bundling that Metro's
// file watcher races against and then fails to watch. Block those temp paths.
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
config.resolver = config.resolver ?? {};
config.resolver.blockList = [
  new RegExp(escape("@firebase") + "[/\\\\]auth-compat_tmp_"),
  new RegExp(escape("@firebase") + "[/\\\\]auth_tmp_"),
];

module.exports = config;
