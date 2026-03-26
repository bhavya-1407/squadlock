import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserData } from './types';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isNewUser: boolean;
  isLocked: boolean;
  completeOnboarding: (username: string, poisonApps: string[]) => Promise<void>;
  updatePoisonApps: (apps: string[]) => Promise<void>;
  setFavoriteApp: (app: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const checkLock = async () => {
      if (userData && !userData.isCompletedToday && !userData.hasSkipDay) {
        const now = new Date();
        // Mock deadline: 10 PM
        if (now.getHours() >= 22) {
          setIsLocked(true);
          // If not already benched, bench them automatically for failing the deadline
          if (!userData.isBenched) {
            try {
              await updateDoc(doc(db, 'users', userData.uid), {
                isBenched: true,
                lastActive: Date.now()
              });
            } catch (e) {
              console.error("Failed to auto-bench user", e);
            }
          }
          return;
        }
      }
      setIsLocked(false);
    };

    checkLock();
    const interval = setInterval(checkLock, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [userData?.uid, userData?.isCompletedToday, userData?.hasSkipDay]);

  useEffect(() => {
    if (isLocked) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Your team\'s Social Contract is being violated! Lock in your streak first.';
        return e.returnValue;
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isLocked]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserData(null);
        setIsNewUser(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    
    // Check existence first
    getDoc(userRef).then((snap) => {
      setIsNewUser(!snap.exists());
    }).catch(e => console.error("Error checking user existence", e));

    const unsubscribeData = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData({ uid: docSnap.id, ...data } as UserData);
        setIsNewUser(false);
        
        // Update lastActive on login if it's been more than an hour
        const lastActive = data.lastActive || 0;
        if (Date.now() - lastActive > 3600000) {
          try {
            await updateDoc(userRef, { lastActive: Date.now() });
          } catch (e) {
            console.error("Failed to update lastActive", e);
          }
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    }, (error) => {
      // Only handle error if user is still logged in
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    });

    return () => unsubscribeData();
  }, [user]);

  const completeOnboarding = async (username: string, poisonApps: string[]) => {
    if (!user) return;
    const newUserData: UserData = {
      uid: user.uid,
      name: user.displayName || 'Anonymous',
      leetcodeUser: username,
      teamId: null,
      individualPoints: 0,
      individualStreak: 0,
      isCompletedToday: false,
      isBenched: false,
      poisonApps: poisonApps,
      favoriteApp: null,
      hasSkipDay: false,
      lastActive: Date.now()
    };
    try {
      await setDoc(doc(db, 'users', user.uid), newUserData);
      setIsNewUser(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
    }
  };

  const updatePoisonApps = async (apps: string[]) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { poisonApps: apps, lastActive: Date.now() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const setFavoriteApp = async (app: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { favoriteApp: app, lastActive: Date.now() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const value = React.useMemo(() => ({
    user,
    userData,
    loading,
    isNewUser,
    isLocked,
    completeOnboarding,
    updatePoisonApps,
    setFavoriteApp
  }), [user, userData, loading, isNewUser, isLocked]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
