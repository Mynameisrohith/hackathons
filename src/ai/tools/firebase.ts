import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

let app: FirebaseApp;
let firestore: Firestore;

/**
 * Initializes the Firebase app and Firestore for server-side usage within AI tools.
 * This is a singleton pattern to ensure it's only initialized once.
 */
function initializeForNode() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  firestore = getFirestore(app);
}

initializeForNode();

export { firestore };
