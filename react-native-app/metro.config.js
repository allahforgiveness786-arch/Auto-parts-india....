const path = require('path');
const RNMetroConfig = require('@react-native/metro-config');
if (typeof RNMetroConfig.setFrameworkDefaults !== 'function') {
  RNMetroConfig.setFrameworkDefaults = (cfg) => cfg;
}
const { getDefaultConfig, mergeConfig } = RNMetroConfig;

const rootDir = path.resolve(__dirname, '..');
const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

const config = {
  watchFolders: [rootDir, __dirname],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(rootDir, 'node_modules'),
    ],
    assetExts: [...assetExts, 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
    sourceExts: [...sourceExts, 'cjs', 'mjs'],
  },
};

module.exports = mergeConfig(defaultConfig, config);


