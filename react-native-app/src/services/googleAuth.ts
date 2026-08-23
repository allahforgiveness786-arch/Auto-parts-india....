import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth, { GoogleAuthProvider, firebase } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Web Client ID from google-services.json (client_type 3)
const WEB_CLIENT_ID = '751764116522-gr59kobj3c3i1hsgr5hiumauk5otr5sq.apps.googleusercontent.com';

try {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: false,
    scopes: ['profile', 'email'],
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

    // Build Firebase credential safely
    let googleCredential: any = null;
    if (typeof GoogleAuthProvider?.credential === 'function') {
      googleCredential = GoogleAuthProvider.credential(idToken);
    } else if (typeof (auth as any)?.GoogleAuthProvider?.credential === 'function') {
      googleCredential = (auth as any).GoogleAuthProvider.credential(idToken);
    } else if (typeof (firebase as any)?.auth?.GoogleAuthProvider?.credential === 'function') {
      googleCredential = (firebase as any).auth.GoogleAuthProvider.credential(idToken);
    } else {
      googleCredential = {
        token: idToken,
        secret: '',
        providerId: 'google.com',
      };
    }

    const authInstance = typeof auth === 'function' ? auth() : (firebase as any)?.auth?.();
    const userCredential = await authInstance.signInWithCredential(googleCredential);
    const user = userCredential?.user || userCredential;

    if (user?.uid) {
      try {
        const firestoreInstance = typeof firestore === 'function' ? firestore() : (firebase as any)?.firestore?.();
        const userDocRef = firestoreInstance.collection('users').doc(user.uid);
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
      } catch (dbErr) {
        console.warn('[GoogleAuth] User profile sync warning:', dbErr);
      }
    }

    return user;
  } catch (error: any) {
    const errorStr = `${error?.code || ''} ${error?.message || ''} ${error?.toString() || ''}`;
    if (error.code === statusCodes.SIGN_IN_CANCELLED || errorStr.includes('12501') || errorStr.includes('SIGN_IN_CANCELLED')) {
      throw new Error('Google Sign-In was cancelled.');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Google Sign-In is already in progress.');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services is not available or outdated on this device.');
    } else if (errorStr.includes('DEVELOPER_ERROR') || errorStr.includes('10')) {
      throw new Error('DEVELOPER_ERROR (Error 10): Google Sign-In requires your APK SHA-1 fingerprint to be registered in Firebase Console -> Project Settings -> Your Android Apps (com.autopartsindia).');
    } else {
      console.warn('[GoogleAuth] Sign-in error:', error);
      throw error;
    }
  }
}
