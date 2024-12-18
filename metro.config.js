const { getDefaultConfig } = require('expo/metro-config');

const ALIASES = {
  'react-native-maps': '@teovilla/react-native-web-maps',
};

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, { isCSSEnabled: true });


config.resolver.sourceExts.push("cjs");


config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
   
    return context.resolveRequest(context, ALIASES[moduleName] ?? moduleName, platform);
  }
 
  return context.resolveRequest(context, moduleName, platform);
};

// Eksporter konfigurasjonen
module.exports = config;
