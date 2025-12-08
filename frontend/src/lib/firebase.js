import { initializeApp } from "firebase/app";
// Importa módulos específicos solo cuando los necesites, ej: getAuth, getFirestore, getStorage
// import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "socialnetwork-ed0ab.firebaseapp.com",
  projectId: "socialnetwork-ed0ab",
  storageBucket: "socialnetwork-ed0ab.firebasestorage.app",
  messagingSenderId: "397336507464",
  appId: "1:397336507464:web:89a18ed0dba113979b147d",
  measurementId: "G-D30BQVBJ81",
};

export const firebaseApp = initializeApp(firebaseConfig);

// Ejemplo opcional para analytics (solo navegador):
// isSupported().then((ok) => ok && getAnalytics(firebaseApp));
