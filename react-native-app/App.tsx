import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { theme } from './src/theme';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { 
  saveFcmTokenToFirestore, 
  removeFcmTokenFromFirestore, 
  setupFcmListeners 
} from './src/services/fcm';

class SafeErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn('[SafeErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0B1220', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#ef4444', fontSize: 16, marginBottom: 10, fontWeight: 'bold' }}>App Crashed</Text>
          <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center' }}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cleanupFcm: (() => void) | null = null;
    let unsubscribeAuth = () => {};

    try {
      if (getAuth) {
        unsubscribeAuth = onAuthStateChanged(getAuth(), async (user) => {
          try {
            if (cleanupFcm) {
              cleanupFcm();
              cleanupFcm = null;
            }

            if (user) {
              setCurrentUser(user);
              previousUserIdRef.current = user.uid;

              try {
                await saveFcmTokenToFirestore(user.uid);
              } catch (err) {
                console.warn('[App] Error saving FCM token:', err);
              }
              try {
                cleanupFcm = setupFcmListeners(user.uid);
              } catch (err) {
                console.warn('[App] Error setting up FCM listeners:', err);
              }
            } else {
              if (previousUserIdRef.current) {
                try {
                  await removeFcmTokenFromFirestore(previousUserIdRef.current);
                } catch (err) {
                  console.warn('[App] Error removing FCM token:', err);
                }
                previousUserIdRef.current = null;
              }
              setCurrentUser(null);
              try {
                cleanupFcm = setupFcmListeners();
              } catch (err) {
                console.warn('[App] Error setting up FCM listeners:', err);
              }
            }
          } catch (innerErr) {
            console.warn('[App] Auth listener inner handler error:', innerErr);
          }
        });
      } else {
        try {
          cleanupFcm = setupFcmListeners();
        } catch (_) {}
      }
    } catch (authErr) {
      console.warn('[App] Error initiating onAuthStateChanged:', authErr);
      try {
        cleanupFcm = setupFcmListeners();
      } catch (_) {}
    }

    return () => {
      try { unsubscribeAuth(); } catch (_) {}
      try { if (cleanupFcm) cleanupFcm(); } catch (_) {}
    };
  }, []);

  return (
    <SafeErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor="#0B1220" />
          <PaperProvider theme={theme}>
            <NavigationContainer ref={navigationRef}>
              <AppNavigator user={currentUser} />
            </NavigationContainer>
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </SafeErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
});


