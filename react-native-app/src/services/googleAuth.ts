import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import firebaseAuth, { GoogleAuthProvider, firebase } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCurrentAuthUser, getFirebaseFirestore } from './firebase';

// Web Client ID and API Key from google-services.json
const WEB_CLIENT_ID = '751764116522-gr59kobj3c3i1hsgr5hiumauk5otr5sq.apps.googleusercontent.com';
const FIREBASE_API_KEY = 'AIzaSyBTfivYbxE7PDB7FxyAlJjFDid6LKPplx8';

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
    
    // Sign out from previous session if any to always allow clean user account selection
    try {
      await GoogleSignin.signOut();
    } catch (_) {}

    const response = await GoogleSignin.signIn();
    
    // Support both older and newer @react-native-google-signin data structures
    const idToken = response?.data?.idToken || (response as any)?.idToken;
    const userFromGoogle = response?.data?.user || (response as any)?.user;
    
    if (!idToken) {
      throw new Error('Could not retrieve Google ID Token. Please check your Google Play Services account settings.');
    }

    let user: any = null;

    // 1. Try Native Firebase Auth signInWithCredential
    try {
      let authInstance: any = null;
      if (typeof firebaseAuth === 'function') {
        try { authInstance = firebaseAuth(); } catch (_) {}
      }
      if (!authInstance && (firebaseAuth as any)?.default && typeof (firebaseAuth as any).default === 'function') {
        try { authInstance = (firebaseAuth as any).default(); } catch (_) {}
      }
      if (!authInstance && typeof (firebase as any)?.auth === 'function') {
        try { authInstance = (firebase as any).auth(); } catch (_) {}
      }

      let googleCredential: any = null;
      if (typeof GoogleAuthProvider?.credential === 'function') {
        googleCredential = GoogleAuthProvider.credential(idToken);
      } else if (typeof (authInstance as any)?.GoogleAuthProvider?.credential === 'function') {
        googleCredential = (authInstance as any).GoogleAuthProvider.credential(idToken);
      } else if (typeof (firebaseAuth as any)?.GoogleAuthProvider?.credential === 'function') {
        googleCredential = (firebaseAuth as any).GoogleAuthProvider.credential(idToken);
      } else if (typeof (firebase as any)?.auth?.GoogleAuthProvider?.credential === 'function') {
        googleCredential = (firebase as any).auth.GoogleAuthProvider.credential(idToken);
      }

      if (authInstance && typeof authInstance.signInWithCredential === 'function' && googleCredential) {
        const userCredential = await authInstance.signInWithCredential(googleCredential);
        user = userCredential?.user || userCredential;
      }
    } catch (nativeErr: any) {
      console.warn('[GoogleAuth] Native Firebase Auth notice:', nativeErr?.message || nativeErr);
    }

    // 2. Direct Firebase Identity Toolkit verification (guarantees real Firebase token & uid from Google Cloud)
    if (!user || !user.uid) {
      try {
        const res = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postBody: `id_token=${idToken}&providerId=google.com`,
              requestUri: 'http://localhost',
              returnSecureToken: true,
            }),
          }
        );
        const data = await res.json();
        if (data && data.localId) {
          user = {
            uid: data.localId,
            email: data.email || userFromGoogle?.email || '',
            displayName: data.displayName || userFromGoogle?.name || 'Auto Parts User',
            photoURL: data.photoUrl || userFromGoogle?.photo || '',
            idToken: data.idToken,
            refreshToken: data.refreshToken,
          };
        } else if (data?.error?.message) {
          console.error('[GoogleAuth] Firebase IdentityToolkit Error:', data.error.message);
          throw new Error(`Firebase Server Auth Error: ${data.error.message}`);
        }
      } catch (restErr: any) {
        console.error('[GoogleAuth] REST Firebase Auth Error:', restErr);
        if (restErr?.message?.includes('Firebase Server Auth Error')) {
          throw restErr;
        }
      }
    }

    // Strict Check: No dummy fallback user allowed. Real Firebase UID is strictly mandatory.
    if (!user || !user.uid) {
      throw new Error(
        'Real Firebase Authentication Failed: Google token could not be verified by Firebase Cloud Auth. Please ensure your APK SHA-1 / SHA-256 fingerprint is registered in Firebase Console (Project: auto-parts-market-place-20312).'
      );
    }

    const finalUserId = user.uid;
    const userEmail = user.email || userFromGoogle?.email || '';
    const userName = user.displayName || userFromGoogle?.name || 'Auto Parts User';
    const userPhoto = user.photoURL || userFromGoogle?.photo || '';

    const sessionUser = {
      uid: finalUserId,
      id: finalUserId,
      email: userEmail,
      displayName: userName,
      name: userName,
      photoURL: userPhoto,
    };

    // Save session in local memory and storage
    await setCurrentAuthUser(sessionUser);

    // 4. Sync User Profile in Firestore
    try {
      const db = getFirebaseFirestore();
      if (db && typeof db.collection === 'function') {
        const userDocRef = db.collection('users').doc(finalUserId);
        await userDocRef.set({
          id: finalUserId,
          uid: finalUserId,
          email: userEmail,
          name: userName,
          displayName: userName,
          photoURL: userPhoto,
          role: 'buyer',
          lastLoginAt: Date.now(),
        }, { merge: true });
      }
    } catch (dbErr) {
      console.warn('[GoogleAuth] User profile sync warning:', dbErr);
    }

    return sessionUser;
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

export async function signOutFromGoogle() {
  try {
    await GoogleSignin.signOut();
  } catch (_) {}
}


