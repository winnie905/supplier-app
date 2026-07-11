const aliases = require('./aliases');

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    '@babel/plugin-transform-class-static-block',
    [
      'module-resolver',
      {
        alias: aliases,
        cwd: 'packagejson',
        extensions: ['.ios.ts', '.android.ts', '.ts', '.tsx', '.js', '.jsx', '.json'],
      },
    ],
    [
      'transform-inline-environment-variables',
      {
        include: ['APP_ENV', 'API_BASE_URL', 'GRAPHQL_URL'],
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
