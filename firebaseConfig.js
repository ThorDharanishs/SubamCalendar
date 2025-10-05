// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// UPDATED IMPORTS: Import the necessary auth functions
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// NEW IMPORT: Import AsyncStorage
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration (remains the same)
const firebaseConfig = {
  apiKey: "AIzaSyBXehL4LPO-RjmyFcY8ig0hZHbALs-cGz8",
  authDomain: "calendar-shop-app.firebaseapp.com",
  projectId: "calendar-shop-app",
  storageBucket: "calendar-shop-app.appspot.com",
  messagingSenderId: "134800962385",
  appId: "1:134800962385:web:9d6eabcfb715d023165970"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
// UPDATED AUTH INITIALIZATION: This tells Firebase to use persistent storage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);

// Export the services for use in other parts of the app
export { auth, db };

