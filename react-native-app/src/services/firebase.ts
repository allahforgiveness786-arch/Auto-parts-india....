
import { getApp } from '@react-native-firebase/app';
import authInstance from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

export const app = getApp();
export const auth = authInstance();
export const firestore = getFirestore();
