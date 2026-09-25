import { initializeApp } from 'firebase/app'; //Used to initialize your Firebase project.
import { getAuth } from 'firebase/auth'; //Used for:Login,Signup,Logout,Current User
import { getFirestore } from 'firebase/firestore'; //Used for database.
 //Used for:Images, Videos, Profile Pictures

// Your web app's Firebase configuration
const firebaseConfig = { //These values come from Firebase Console.
  apiKey: "AIzaSyDEbJl3fYoIQw28Yet6PPl-X_98eXaQJHE",
  authDomain: "facebook-clone-39223.firebaseapp.com",
  projectId: "facebook-clone-39223",
  storageBucket: "facebook-clone-39223.firebasestorage.app",
  messagingSenderId: "563620186702",
  appId: "1:563620186702:web:b8a0c22a9a04fbbd2dd11f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig); //create connection , react -> firebase project

//Export service
export const auth = getAuth(app);
export const db = getFirestore(app);
