const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Reduce max workers to minimize file watchers
config.maxWorkers = 1;

// Disable file watching for node_modules
config.watchFolders = [__dirname];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Reduce the number of file watchers
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config; 