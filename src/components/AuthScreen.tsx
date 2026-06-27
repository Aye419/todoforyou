import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole, UserProfile } from '../types';
import { LogIn, UserPlus, Key, Mail, User, Shield, HelpCircle, ArrowRight, Play } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (userProfile: UserProfile | null) => void;
  onContinueAsGuest: () => void;
}

export default function AuthScreen({ onAuthSuccess, onContinueAsGuest }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const auth = getAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        // --- SIGN IN ---
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCredential.user.uid;
        
        // Fetch custom user profile (role, name) from Firestore
        const userDocRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userDocRef);
        
        let profile: UserProfile;
        if (userSnap.exists()) {
          profile = userSnap.data() as UserProfile;
        } else {
          // Fallback if document does not exist yet (e.g. if created outside this screen)
          profile = {
            uid,
            email: userCredential.user.email || email,
            name: userCredential.user.displayName || email.split('@')[0],
            role: 'user', // default
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, profile);
        }
        
        setSuccess('Logged in successfully!');
        setTimeout(() => onAuthSuccess(profile), 800);
      } else {
        // --- SIGN UP ---
        if (!name.trim()) {
          throw new Error('Please enter your display name.');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCredential.user.uid;

        // Create user profile in Firestore
        const profile: UserProfile = {
          uid,
          email: email.trim().toLowerCase(),
          name: name.trim(),
          role,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', uid), profile);
        setSuccess(`Account registered successfully as ${role === 'admin' ? 'Administrator' : 'Regular User'}!`);
        setTimeout(() => onAuthSuccess(profile), 800);
      }
    } catch (err: any) {
      console.error("Auth action failed:", err);
      let errMsg = err.message || 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/configuration-not-found') {
        errMsg = 'Firebase Authentication is not enabled/configured for this project in the console. You can toggle "Local Sandbox Mode" or sign in with local user bypass!';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = 'This email is already registered. Please login instead.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'Invalid email address format.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errMsg = 'Incorrect email or password.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Safe developer/testing bypass login
  const handleBypassLogin = async (bypassRole: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      const emailPrefix = bypassRole === 'admin' ? 'admin' : 'user';
      const mockEmail = `${emailPrefix}_test@demo.com`;
      const mockName = bypassRole === 'admin' ? 'Demo Admin' : 'Demo User';
      const mockUid = `${emailPrefix}_uid_${Date.now().toString().slice(-6)}`;

      const profile: UserProfile = {
        uid: mockUid,
        email: mockEmail,
        name: mockName,
        role: bypassRole,
        createdAt: new Date().toISOString()
      };

      // Store in firestore so other modules can query / sync if needed
      await setDoc(doc(db, 'users', mockUid), profile);
      
      setSuccess(`Bypass Login successful! Signed in as ${mockName} (${bypassRole})`);
      setTimeout(() => onAuthSuccess(profile), 800);
    } catch (err: any) {
      // If Firestore also fails, fall back locally
      console.warn("Firestore bypass setDoc failed, logging in locally:", err.message);
      const mockUid = `${bypassRole}_uid_local`;
      const profile: UserProfile = {
        uid: mockUid,
        email: `${bypassRole}_test@demo.com`,
        name: bypassRole === 'admin' ? 'Local Admin' : 'Local User',
        role: bypassRole,
        createdAt: new Date().toISOString()
      };
      setSuccess(`Signed in locally as ${profile.name} (${bypassRole})`);
      setTimeout(() => onAuthSuccess(profile), 800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Shield className="w-6 h-6 stroke-[2]" />
        </div>
        <h2 className="mt-6 text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
          {isLogin ? 'Sign in to your space' : 'Create your account'}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400 font-medium">
          Collaborative Team Planner & Cycle-Time Board
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl border border-slate-800/80 shadow-2xl shadow-black/50 space-y-6">
          
          {error && (
            <div className="rounded-2xl bg-rose-950/30 border border-rose-900/50 p-4 text-xs text-rose-300 space-y-1">
              <p className="font-bold">Authentication Notice:</p>
              <p className="leading-relaxed">{error}</p>
              {error.includes('Anonymous Authentication') || error.includes('Auth') ? (
                <div className="pt-2 mt-1 border-t border-rose-900/30 flex flex-col gap-1.5">
                  <p className="text-slate-400 text-3xs">
                    Since Firestore requires configured Auth, you can use our <strong>Demo Bypass Buttons</strong> below to jump straight in with an Admin or User role instantly!
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-emerald-950/30 border border-emerald-900/50 p-4 text-xs font-semibold text-emerald-300">
              {success}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleAuth}>
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Display Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-slate-950 transition-all text-slate-100 font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-slate-950 transition-all text-slate-100 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-slate-950 transition-all text-slate-100 font-medium"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  Access Level Role
                  <div className="group relative">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-950 text-slate-200 text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity leading-relaxed z-10 font-normal border border-slate-800">
                      <strong>Admin role</strong> lets you view and edit tasks from ALL users on a centralized dashboard. <strong>User role</strong> hides other users' plans.
                    </div>
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      role === 'user'
                        ? 'border-indigo-500 bg-indigo-950/30 text-indigo-300 font-bold ring-1 ring-indigo-500/30'
                        : 'border-slate-800 hover:border-slate-700 text-slate-400 bg-slate-950/50 font-semibold'
                    }`}
                  >
                    <p className="text-xs">Regular User</p>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">See own tasks</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      role === 'admin'
                        ? 'border-indigo-500 bg-indigo-950/30 text-indigo-300 font-bold ring-1 ring-indigo-500/30'
                        : 'border-slate-800 hover:border-slate-700 text-slate-400 bg-slate-950/50 font-semibold'
                    }`}
                  >
                    <p className="text-xs">Administrator</p>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">Admin Screen + All Tasks</p>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-indigo-950 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                'Processing...'
              ) : isLogin ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In Space
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Register & Sign In
                </>
              )}
            </button>
          </form>

          <div className="relative flex py-1.5 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Quick Demo Bypass Access Panel */}
          <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="text-center">
              <p className="text-[11px] font-extrabold text-slate-300 tracking-tight">Quick Interactive Testing Profiles</p>
              <p className="text-[9px] text-slate-500 font-medium">Instantly log in to test both roles without filling forms</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleBypassLogin('admin')}
                className="py-2.5 px-3 rounded-xl border border-rose-900/60 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-bold transition-all shadow-3xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                Test Admin Role
              </button>
              <button
                type="button"
                onClick={() => handleBypassLogin('user')}
                className="py-2.5 px-3 rounded-xl border border-blue-900/60 bg-blue-950/20 hover:bg-blue-950/40 text-blue-300 text-xs font-bold transition-all shadow-3xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-blue-400" />
                Test Regular User
              </button>
            </div>
          </div>

          <div className="text-center text-xs">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="text-center pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-slate-400 hover:text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              Use Local Sandbox Mode (No Auth)
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
