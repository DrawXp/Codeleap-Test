import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAM2sITUeNFsmhi5Xh07CZgwcE0aZL60p4",
  authDomain: "codeleapfrontend.firebaseapp.com",
  projectId: "codeleapfrontend",
  storageBucket: "codeleapfrontend.firebasestorage.app",
  messagingSenderId: "426368856137",
  appId: "1:426368856137:web:2fe351fef2127a5ddacf98"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();