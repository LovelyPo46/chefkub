// File: firebaseConfig.js

import { initializeApp } from "firebase/app";
// 1. Import initializeAuth และ getReactNativePersistence
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// 2. Import AsyncStorage
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFzm-60QzpvvHe7FJTuGYBhyZFmNCL1ZY",
  authDomain: "chefkub-28f4d.firebaseapp.com",
  projectId: "chefkub-28f4d",
  // 3. ⭐️ แก้ไข storageBucket ให้ถูกต้อง ⭐️
  storageBucket: "chefkub-28f4d.appspot.com",
  messagingSenderId: "80430764665",
  appId: "1:80430764665:web:a61667262c5b7532723aa8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 4. ⭐️ แก้ไข Auth ให้จำผู้ใช้ (แก้ AsyncStorage) ⭐️
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Export Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);