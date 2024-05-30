import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKZ61TIZIKAF_ALoDUr_Z9m-lEvajDpUY",

  authDomain: "twitter-52216.firebaseapp.com",

  projectId: "twitter-52216",

  storageBucket: "twitter-52216.appspot.com",

  messagingSenderId: "891768036789",

  appId: "1:891768036789:web:6a5d3dd2fec72b4a464dfc",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and set local persistence
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Storage
const storage = getStorage(app);

// Export Firebase functions
export { app, auth, db, storage };
