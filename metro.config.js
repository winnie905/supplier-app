const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const aliases = require('./aliases');

const projectRoot = __dirname;
const defaultConfig = getDefaultConfig(projectRoot);

const resolveAlias = (moduleName) => {
  const aliasKey = Object.keys(aliases)
    .sort((left, right) => right.length - left.length)
    .find((candidate) => moduleName === candidate || moduleName.startsWith(`${candidate}/`));

  if (!aliasKey) {
    return moduleName;
  }

  const remainder = moduleName.slice(aliasKey.length).replace(/^\//, '');

  return remainder ? path.join(aliases[aliasKey], remainder) : aliases[aliasKey];
};

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    resolveRequest(context, moduleName, platform) {
      const resolvedModuleName = resolveAlias(moduleName);
      return context.resolveRequest(context, resolvedModuleName, platform);
    },
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
