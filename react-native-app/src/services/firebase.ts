
import { getApp } from '@react-native-firebase/app';
import authInstance from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const app = getApp();
export const auth = authInstance();
export { firestore };
