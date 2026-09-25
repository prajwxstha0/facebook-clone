import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { createContext, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { auth, db } from "../firebase/config";
import {
  clearUser,
  setCurrentUser,
  setLoading,
  setUserProfile,
  updateProfile,
} from "../store/slices/authSlice";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// ✅ Helper to convert Firebase Timestamp to string
function safeProfile(data) {
  return {
    ...data,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate().toISOString()
      : data.createdAt || null,
  };
}

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const { currentUser, userProfile, loading } = useSelector((s) => s.auth);

  async function signup(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const newProfile = {
      uid: result.user.uid,
      email,
      displayName,
      bio: "",
      profilePic: "",
      friends: [],
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", result.user.uid), newProfile);
    dispatch(setCurrentUser({ uid: result.user.uid, email }));
    dispatch(setUserProfile(newProfile));
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    await handleOAuthUser(result.user);
  }

  async function loginWithFacebook() {
    const result = await signInWithPopup(auth, new FacebookAuthProvider());
    await handleOAuthUser(result.user);
  }

  async function handleOAuthUser(user) {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      const newProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "User",
        bio: "",
        profilePic: user.photoURL || "",
        friends: [],
        createdAt: new Date().toISOString(),
      };
      await setDoc(docRef, newProfile);
      dispatch(setCurrentUser({ uid: user.uid, email: user.email }));
      dispatch(setUserProfile(newProfile));
    } else {
      // ✅ Convert timestamp before dispatching
      dispatch(setCurrentUser({ uid: user.uid, email: user.email }));
      dispatch(setUserProfile(safeProfile(docSnap.data())));
    }
  }

  async function logout() {
    await signOut(auth);
    dispatch(clearUser());
  }

  async function updateUserProfile(updates) {
    await updateDoc(doc(db, "users", currentUser.uid), updates);
    dispatch(updateProfile(updates));
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        dispatch(setCurrentUser({ uid: user.uid, email: user.email }));
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          // ✅ Convert timestamp before dispatching
          dispatch(setUserProfile(safeProfile(docSnap.data())));
        }
      } else {
        dispatch(clearUser());
      }
      dispatch(setLoading(false));
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signup,
        login,
        loginWithGoogle,
        loginWithFacebook,
        logout,
        updateUserProfile,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}
