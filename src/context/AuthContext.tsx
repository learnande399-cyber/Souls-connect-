import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  deleteUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, ADMIN_EMAIL } from '../firebase';
import { UserProfile, PrivateInfo } from '../types';
import { handleFirestoreError, OperationType } from '../utils/errors';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  privateInfo: PrivateInfo | null;
  loading: boolean;
  isAdmin: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  deleteUserAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  savePrivateInfo: (info: Partial<PrivateInfo>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [privateInfo, setPrivateInfo] = useState<PrivateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('soulconnect_dark_mode') === 'true';
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('soulconnect_dark_mode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const refreshProfile = async () => {
    if (!auth.currentUser) {
      setUserProfile(null);
      setPrivateInfo(null);
      return;
    }
    const uid = auth.currentUser.uid;
    try {
      const userDocRef = doc(db, 'users', uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else {
        setUserProfile(null);
      }

      const privRef = doc(db, 'users', uid, 'private', 'info');
      const privSnap = await getDoc(privRef);
      if (privSnap.exists()) {
        setPrivateInfo(privSnap.data() as PrivateInfo);
      }
    } catch (err) {
      console.warn('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await refreshProfile();

        // Mark user as online
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, {
            isOnline: true,
            lastActive: serverTimestamp()
          });
        } catch {
          // May not have profile created yet; handled in setup wizard
        }
      } else {
        setUserProfile(null);
        setPrivateInfo(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Heartbeat presence mechanism
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          isOnline: true,
          lastActive: serverTimestamp()
        });
      } catch {
        // Ignore background heartbeat failures
      }
    }, 45000);

    const handleBeforeUnload = () => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        updateDoc(userRef, {
          isOnline: false,
          lastActive: serverTimestamp()
        }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const registerWithEmail = async (email: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn('Could not send verification email immediately:', e);
    }
    return cred.user;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const logout = async () => {
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          isOnline: false,
          lastActive: serverTimestamp()
        });
      } catch {
        // Continue logout anyway
      }
    }
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  const deleteUserAccount = async () => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    // Mark offline & clean up
    try {
      await updateDoc(doc(db, 'users', uid), {
        isSuspended: true,
        displayName: 'Deleted User',
        username: `deleted_${uid.slice(0, 8)}`,
        bio: 'This account has been deleted.',
        isOnline: false
      });
      await deleteUser(currentUser);
      setUserProfile(null);
      setCurrentUser(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('Not logged in');
    const userRef = doc(db, 'users', currentUser.uid);
    try {
      await setDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
      await refreshProfile();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const savePrivateInfo = async (info: Partial<PrivateInfo>) => {
    if (!currentUser) throw new Error('Not logged in');
    const privRef = doc(db, 'users', currentUser.uid, 'private', 'info');
    try {
      await setDoc(privRef, {
        userId: currentUser.uid,
        email: currentUser.email || '',
        ...info
      }, { merge: true });
      await refreshProfile();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/private/info`);
    }
  };

  const isAdmin = Boolean(
    currentUser && (currentUser.email === ADMIN_EMAIL || userProfile?.email === ADMIN_EMAIL)
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        privateInfo,
        loading,
        isAdmin,
        isDarkMode,
        toggleDarkMode,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        resetPassword,
        resendVerificationEmail,
        logout,
        deleteUserAccount,
        refreshProfile,
        updateProfileData,
        savePrivateInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
