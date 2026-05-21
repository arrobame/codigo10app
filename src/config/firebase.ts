import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD3zIvxJU6fwNlkBCVvzZ6ajJz-T_xh6Zw",
  authDomain: "codigo10-trivia.firebaseapp.com",
  projectId: "codigo10-trivia",
  storageBucket: "codigo10-trivia.firebasestorage.app",
  messagingSenderId: "320534413841",
  appId: "1:320534413841:web:6c29863e82b28cee45a7b0",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
