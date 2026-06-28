// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable package.json:exports support to fix Node.js module resolution issues with @supabase/supabase-js
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
