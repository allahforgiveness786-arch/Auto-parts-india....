import 'react-native-gesture-handler';
import * as RNScreens from 'react-native-screens';

// Polyfill compatibilityFlags for React Navigation v7 compatibility with react-native-screens
if (RNScreens && !RNScreens.compatibilityFlags) {
  (RNScreens as any).compatibilityFlags = {};
}
try {
  const screensModule = require('react-native-screens');
  if (screensModule && !screensModule.compatibilityFlags) {
    screensModule.compatibilityFlags = {};
  }
} catch (_) {}

import { enableScreens } from 'react-native-screens';

enableScreens(true);

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './package.json';

// Ignore non-fatal development/bridge logs in production
LogBox.ignoreAllLogs(true);

// Safely register FCM background message handler if native module is ready
try {
  const firebaseModule = require('@react-native-firebase/app');
  const firebase = firebaseModule?.default || firebaseModule;
  if (firebase && Array.isArray(firebase.apps) && firebase.apps.length > 0) {
    const messagingModule = require('@react-native-firebase/messaging');
    const messaging = typeof messagingModule === 'function' ? messagingModule : messagingModule?.default;
    if (typeof messaging === 'function') {
      try {
        messaging().setBackgroundMessageHandler(async remoteMessage => {
          console.log('[FCM] Background/Quit message received:', remoteMessage?.messageId);
        });
      } catch (_) {}
    }
  }
} catch (_) {
  // Silent fallback
}

// Register with all possible identifiers to guarantee match with Android Native MainActivity
AppRegistry.registerComponent('AutoPartsIndia', () => App);
AppRegistry.registerComponent('auto-parts-india', () => App);
if (appName && appName !== 'AutoPartsIndia' && appName !== 'auto-parts-india') {
  AppRegistry.registerComponent(appName, () => App);
}
