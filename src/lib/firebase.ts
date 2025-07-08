import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDGrOJcOkVHy9BOMHMMHOuIyGJC8kZ7njc",
  authDomain: "multicalculo-project.firebaseapp.com",
  projectId: "multicalculo-project",
  storageBucket: "multicalculo-project.appspot.com",
  messagingSenderId: "268743612279",
  appId: "1:268743612279:web:55ad9ebe8360398ea27372",
  measurementId: "G-JLLES3DHHX"
};

// Garante que o app não será inicializado mais de uma vez
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db }; 