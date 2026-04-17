import { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc, addDoc, collection, getDocs, query } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import app, { firebaseConfig } from '../firebase/firebaseConfig.js';
import { toast } from 'react-toastify';
import { ROLES_REQUIRING_SITE } from '../constants/roles.js';

const auth = getAuth(app);
const db = getFirestore(app);
const secondaryApp = getApps().find((loaded) => loaded.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
const secondaryAuth = getAuth(secondaryApp);
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAdminUser();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser(firebaseUser);
      const docRef = doc(db, 'users', firebaseUser.uid);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const profileData = snapshot.data();
        setProfile({ uid: firebaseUser.uid, ...profileData, role: profileData.role ? profileData.role.toLowerCase() : profileData.role });
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (identifier, password) => {
    const isFallbackAdmin = identifier === 'admin@gmail.com' && password === 'Admin@1234';
    if (isFallbackAdmin) {
      const fallbackProfile = {
        uid: 'admin-fallback',
        name: 'Madhav',
        email: identifier,
        role: 'admin',
        assignedSite: 'All Sites',
      };
      setUser({ uid: fallbackProfile.uid, email: fallbackProfile.email });
      setProfile(fallbackProfile);
      toast.success('Signed in as admin (demo mode)');
      return fallbackProfile;
    }

    try {
      // Find user by identifier (email, employeeId, or phoneNumber)
      const userRecord = await findUserByIdentifier(identifier);

      if (!userRecord) {
        throw new Error('User not found. Please check your credentials.');
      }

      // Use the email from the user record for Firebase Auth
      const credential = await signInWithEmailAndPassword(auth, userRecord.email, password);
      const docRef = doc(db, 'users', credential.user.uid);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        throw new Error('User profile not found');
      }

      const profileData = snapshot.data();
      const normalizedRole = profileData.role ? profileData.role.toLowerCase() : profileData.role;
      const finalProfile = { uid: credential.user.uid, ...profileData, role: normalizedRole };
      setUser(credential.user);
      setProfile(finalProfile);
      toast.success('Signed in successfully');
      return finalProfile;
    } catch (error) {
      toast.error('Sign in failed. Check credentials.');
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const registerUser = async (name, email, password, role, employeeId, phoneNumber, assignedSite) => {
    // Normalize role to lowercase for consistency
    const normalizedRole = role?.toLowerCase();

    try {
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      await signOut(secondaryAuth);

      // Only assign site for roles that require it (Engineer, Supervisor)
      // Project Manager and Admin roles do not require site assignment
      const shouldAssignSite = ROLES_REQUIRING_SITE.includes(normalizedRole);

      // Initialize default permissions for all users
      const defaultPermissions = {
        canViewDashboard: true,
        canViewCharts: true,
        canMessageRoles: ['admin', 'supervisor', 'engineer', 'project_manager'], // Default: can message all roles
      };

      const userData = {
        uid: credential.user.uid,
        name,
        email,
        role: normalizedRole,
        employeeId,
        phoneNumber,
        assignedSite: shouldAssignSite ? (assignedSite || null) : null,
        permissions: defaultPermissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', credential.user.uid), userData);
      toast.success(`${normalizedRole?.charAt(0).toUpperCase() + normalizedRole?.slice(1)} ${name} created successfully`);
      return userData;
    } catch (error) {
      toast.error(error.message || 'Failed to create user');
      throw error;
    }
  };

  const findUserByIdentifier = async (identifier) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const snapshot = await getDocs(q);

      // Find user by email, employeeId, or phoneNumber
      const userDoc = snapshot.docs.find(doc => {
        const data = doc.data();
        return data.email === identifier ||
               data.employeeId === identifier ||
               data.phoneNumber === identifier;
      });

      if (!userDoc) {
        return null;
      }

      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error('Error finding user by identifier:', error);
      throw error;
    }
  };

  const initializeAdminUser = async () => {
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'Admin@1234';
    const adminName = 'Madhav';
    const adminRole = 'admin';

    try {
      const adminDocRef = doc(db, 'users', 'admin-fallback');
      const adminDocSnapshot = await getDoc(adminDocRef);

      if (!adminDocSnapshot.exists()) {
        // Admin has full permissions by default
        const adminPermissions = {
          canViewDashboard: true,
          canViewCharts: true,
          canMessageRoles: ['admin', 'supervisor', 'engineer', 'project_manager'],
        };

        const adminData = {
          uid: 'admin-fallback',
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          role: adminRole,
          assignedSite: 'All Sites',
          permissions: adminPermissions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active',
        };
        await setDoc(adminDocRef, adminData);
        console.log('Admin user initialized in Firestore');
      }
    } catch (error) {
      console.error('Error initializing admin user:', error);
    }
  };

  const sendMessage = async (receiverId, text, attachments = []) => {
    try {
      if (!user?.uid || !receiverId || (!text.trim() && attachments.length === 0)) {
        throw new Error('Invalid message data');
      }

      const attachmentMetadata = [];
      for (const attachment of attachments) {
        if (!attachment) continue;
        const uploadPath = `messageAttachments/${user.uid}/${Date.now()}_${attachment.name}`;
        const storageReference = storageRef(getStorage(app), uploadPath);
        const snapshot = await uploadBytesResumable(storageReference, attachment);
        const url = await getDownloadURL(snapshot.ref);

        attachmentMetadata.push({
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
          url,
        });
      }

      const messageData = {
        senderId: user.uid,
        senderName: profile?.name || 'Unknown',
        senderRole: profile?.role || 'user',
        receiverId: receiverId,
        text: text.trim(),
        attachments: attachmentMetadata,
        timestamp: new Date(),
        read: false,
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);
      return { id: docRef.id, ...messageData };
    } catch (error) {
      toast.error('Failed to send message');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      login,
      logout,
      registerUser,
      initializeAdminUser,
      sendMessage,
      findUserByIdentifier,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
