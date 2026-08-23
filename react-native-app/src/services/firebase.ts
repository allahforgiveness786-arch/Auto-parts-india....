
import { getApp as getAppInternal } from '@react-native-firebase/app';
import authModule, { firebase } from '@react-native-firebase/auth';
import firestoreModule from '@react-native-firebase/firestore';

export function getApp() {
  try {
    return getAppInternal();
  } catch (_) {
    return (firebase as any)?.app?.() || null;
  }
}

export function getFirebaseAuth(): any {
  try {
    if (typeof authModule === 'function') {
      return authModule();
    }
    if (typeof (firebase as any)?.auth === 'function') {
      return (firebase as any).auth();
    }
    return authModule || null;
  } catch (err) {
    console.warn('[firebase.ts] getFirebaseAuth fallback:', err);
    return (firebase as any)?.auth?.() || null;
  }
}

export function getFirebaseFirestore(): any {
  try {
    if (typeof firestoreModule === 'function') {
      return firestoreModule();
    }
    if (typeof (firebase as any)?.firestore === 'function') {
      return (firebase as any).firestore();
    }
    return firestoreModule || null;
  } catch (err) {
    console.warn('[firebase.ts] getFirebaseFirestore fallback:', err);
    return (firebase as any)?.firestore?.() || null;
  }
}

export function getCurrentUser(): any {
  try {
    const authInst = getFirebaseAuth();
    return authInst?.currentUser || null;
  } catch (_) {
    return null;
  }
}

export const app = getApp();
export const auth = getFirebaseAuth();
export const firestore = getFirebaseFirestore;
export default getFirebaseAuth;

