import 'react-native-gesture-handler';
import React from 'react';
import * as RNScreens from 'react-native-screens';

// Polyfill compatibilityFlags, featureFlags, and sanitize sheetAllowedDetents props for React Native Android
function sanitizeDetentProps(props) {
  if (!props || typeof props !== 'object') return props;
  const sanitized = { ...props };
  if (sanitized.sheetAllowedDetents !== undefined && typeof sanitized.sheetAllowedDetents !== 'string') {
    sanitized.sheetAllowedDetents = 'large';
  }
  if (sanitized.sheetLargestUndimmedDetent !== undefined && typeof sanitized.sheetLargestUndimmedDetent !== 'string') {
    sanitized.sheetLargestUndimmedDetent = 'all';
  }
  return sanitized;
}

function patchScreenComponent(Comp) {
  if (!Comp) return Comp;
  const Wrapped = React.forwardRef((props, ref) => {
    return React.createElement(Comp, { ...sanitizeDetentProps(props), ref });
  });
  Wrapped.displayName = Comp.displayName || Comp.name || 'PatchedScreen';
  return Wrapped;
}

if (RNScreens) {
  try {
    if (!RNScreens.compatibilityFlags) {
      RNScreens.compatibilityFlags = {};
    }
    if (!RNScreens.featureFlags) {
      RNScreens.featureFlags = {};
    }
    if (RNScreens.NativeScreen) {
      RNScreens.NativeScreen = patchScreenComponent(RNScreens.NativeScreen);
    }
    if (RNScreens.InnerScreen) {
      RNScreens.InnerScreen = patchScreenComponent(RNScreens.InnerScreen);
    }
    if (RNScreens.Screen) {
      RNScreens.Screen = patchScreenComponent(RNScreens.Screen);
    }
    if (RNScreens.ScreenStackItem) {
      RNScreens.ScreenStackItem = patchScreenComponent(RNScreens.ScreenStackItem);
    } else if (RNScreens.Screen) {
      RNScreens.ScreenStackItem = RNScreens.Screen;
    }
  } catch (_) {}
}

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
