import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Firebase exposes this helper through its React Native entry, while the shared TypeScript declaration omits it.
// @ts-expect-error React Native Firebase Auth export.
import { getReactNativePersistence } from 'firebase/auth';
import { firebaseConfig, firebaseConfigured } from './firebase.config';
export { firebaseConfigured };
const app = firebaseConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
export const auth = app ? (() => {
  try { return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }); }
  catch { return getAuth(app); }
})() : null;
export const db = app ? getFirestore(app) : null;
