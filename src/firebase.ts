import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { FIREBASE_CONFIG } from "./lib/env";

// Mismo proyecto de Firebase que usa la app iOS — los administradores son usuarios de
// Firebase Authentication igual que los ciudadanos; lo único que cambia es su rol,
// que vive en el backend (tabla app_users), no en Firebase.
export const firebaseApp = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(firebaseApp);