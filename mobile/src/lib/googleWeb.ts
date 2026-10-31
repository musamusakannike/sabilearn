import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDzXqyi6-trLvDC_rdkwIHL9srAUQAR8aw",
  authDomain: "synapsebotai.firebaseapp.com",
  projectId: "synapsebotai",
  appId: "1:49669304081:web:46cfda74291a7cdec626b0",
};

/** Web-only: Google popup sign-in via Firebase JS SDK; returns Firebase ID token. */
export async function googleSignInWeb(): Promise<string> {
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
    throw new Error('Web Firebase config missing (EXPO_PUBLIC_FIREBASE_* env vars).');
  }
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return result.user.getIdToken();
}
