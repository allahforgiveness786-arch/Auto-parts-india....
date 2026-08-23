import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Web Client ID from google-services.json (client_type 3)
const WEB_CLIENT_ID = '751764116522-gr59kobj3c3i1hsgr5hiumauk5otr5sq.apps.googleusercontent.com';

try {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
} catch (e) {
  console.warn('[GoogleAuth] GoogleSignin.configure error:', e);
}

export async function signInWithGoogleNative() {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Sign out from previous session if any to always allow user account selection
    try {
      await GoogleSignin.signOut();
    } catch (_) {}

    const response = await GoogleSignin.signIn();
    
    // Support both older and newer @react-native-google-signin data structures
    const idToken = response?.data?.idToken || (response as any)?.idToken;
    
    if (!idToken) {
      throw new Error('Could not retrieve Google ID Token. Please check your Google account settings.');
    }

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);
    const user = userCredential.user;

    if (user?.uid) {
      const userDocRef = firestore().collection('users').doc(user.uid);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists) {
        await userDocRef.set({
          id: user.uid,
          email: user.email || '',
          name: user.displayName || 'Auto Parts User',
          displayName: user.displayName || 'Auto Parts User',
          photoURL: user.photoURL || '',
          role: 'buyer',
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        });
      } else {
        await userDocRef.update({
          lastLoginAt: Date.now(),
        }).catch(() => {});
      }
    }

    return user;
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Google Sign-In was cancelled.');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Google Sign-In is already in progress.');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services is not available or outdated on this device.');
    } else {
      console.warn('[GoogleAuth] Sign-in error:', error);
      throw error;
    }
  }
}
