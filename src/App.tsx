import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ListTodo,
  CheckCircle2,
  Play,
  Search,
  Plus,
  BarChart3,
  Grid,
  Clock,
  Settings2,
  Calendar,
  FolderPlus,
  UserPlus,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Trash2,
  RotateCcw,
  Tag,
  Users,
  Database,
  CloudLightning,
  RefreshCw,
  AlertTriangle,
  WifiOff,
  Info,
  LogOut,
  Shield
} from 'lucide-react';
import { Task, Category, Assignee, TaskStatus, TaskPriority, UserProfile } from './types';
import { INITIAL_TASKS, INITIAL_CATEGORIES, INITIAL_ASSIGNEES } from './initialData';
import TaskCard from './components/TaskCard';
import TaskForm from './components/TaskForm';
import BoardView from './components/BoardView';
import TaskStats from './components/TaskStats';
import AuthScreen from './components/AuthScreen';
import AdminPanel from './components/AdminPanel';
import { getRandomHexColor } from './utils';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, onSnapshot, setDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

export default function App() {
  // --- Auth State ---
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('todo_app_user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [authLoading, setAuthLoading] = useState(true);

  // --- Core State ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('todo_app_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('todo_app_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [assignees, setAssignees] = useState<Assignee[]>(() => {
    const saved = localStorage.getItem('todo_app_assignees');
    return saved ? JSON.parse(saved) : INITIAL_ASSIGNEES;
  });

  // --- Firebase Connection & Resilience States ---
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [isLocalMode, setIsLocalMode] = useState<boolean>(() => {
    return localStorage.getItem('firebase_local_mode') === 'true';
  });

  // --- UI Navigation & Filter States ---
  const [selectedView, setSelectedView] = useState<'board' | 'grid' | 'stats'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultStatusForNewTask, setDefaultStatusForNewTask] = useState<TaskStatus>('todo');

  // Collapsible management drawers
  const [showDbManager, setShowDbManager] = useState(false);
  const [catNameInput, setCatNameInput] = useState('');
  const [catColorInput, setCatColorInput] = useState('#6366f1');
  const [assNameInput, setAssNameInput] = useState('');
  const [assEmailInput, setAssEmailInput] = useState('');

  // Live Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- Firebase Auth Subscription ---
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setCurrentUserProfile(profile);
            localStorage.setItem('todo_app_user_profile', JSON.stringify(profile));
          } else {
            const fallbackProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || 'unknown@demo.com',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member',
              role: 'user',
              createdAt: new Date().toISOString()
            };
            setCurrentUserProfile(fallbackProfile);
            localStorage.setItem('todo_app_user_profile', JSON.stringify(fallbackProfile));
          }
        } catch (err) {
          console.warn("Could not load user profile from firestore:", err);
          const fallbackProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || 'unknown@demo.com',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Sandbox User',
            role: 'user',
            createdAt: new Date().toISOString()
          };
          setCurrentUserProfile(fallbackProfile);
          localStorage.setItem('todo_app_user_profile', JSON.stringify(fallbackProfile));
        }
      } else {
        // If not in local mode and logged out, clear profile
        if (!isLocalMode) {
          setCurrentUserProfile(null);
          localStorage.removeItem('todo_app_user_profile');
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [isLocalMode]);

  // --- Real-time Firebase Synchronization ---
  useEffect(() => {
    if (isLocalMode) {
      setIsSyncing(false);
      setIsFirebaseConnected(false);
      // Load current local states
      const savedTasks = localStorage.getItem('todo_app_tasks');
      const savedCategories = localStorage.getItem('todo_app_categories');
      const savedAssignees = localStorage.getItem('todo_app_assignees');
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedCategories) setCategories(JSON.parse(savedCategories));
      if (savedAssignees) setAssignees(JSON.parse(savedAssignees));
      return;
    }

    setIsSyncing(true);
    setFirebaseError(null);

    // 1. Subscribe to Tasks collection
    const unsubscribeTasks = onSnapshot(
      collection(db, 'tasks'),
      (snapshot) => {
        const list: Task[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Task);
        });
        // Sort tasks: newest created first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTasks(list);
        setIsFirebaseConnected(true);
        setIsSyncing(false);
      },
      (error) => {
        console.error("Failed to sync tasks:", error);
        const err = handleFirestoreError(error, OperationType.LIST, 'tasks');
        setFirebaseError(err.error);
        setIsSyncing(false);
        setIsFirebaseConnected(false);
      }
    );

    // 2. Subscribe to Categories collection
    const unsubscribeCategories = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        const list: Category[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Category);
        });
        if (list.length > 0) {
          setCategories(list);
        }
      },
      (error) => {
        console.error("Failed to sync categories:", error);
        const err = handleFirestoreError(error, OperationType.LIST, 'categories');
        setFirebaseError(err.error);
      }
    );

    // 3. Subscribe to Assignees collection
    const unsubscribeAssignees = onSnapshot(
      collection(db, 'assignees'),
      (snapshot) => {
        const list: Assignee[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Assignee);
        });
        if (list.length > 0) {
          setAssignees(list);
        }
      },
      (error) => {
        console.error("Failed to sync assignees:", error);
        const err = handleFirestoreError(error, OperationType.LIST, 'assignees');
        setFirebaseError(err.error);
      }
    );

    return () => {
      unsubscribeTasks();
      unsubscribeCategories();
      unsubscribeAssignees();
    };
  }, [isLocalMode]);

  // --- Fallback Local Storage Sync ---
  useEffect(() => {
    if (isLocalMode || !isFirebaseConnected) {
      localStorage.setItem('todo_app_tasks', JSON.stringify(tasks));
    }
  }, [tasks, isLocalMode, isFirebaseConnected]);

  useEffect(() => {
    if (isLocalMode || !isFirebaseConnected) {
      localStorage.setItem('todo_app_categories', JSON.stringify(categories));
    }
  }, [categories, isLocalMode, isFirebaseConnected]);

  useEffect(() => {
    if (isLocalMode || !isFirebaseConnected) {
      localStorage.setItem('todo_app_assignees', JSON.stringify(assignees));
    }
  }, [assignees, isLocalMode, isFirebaseConnected]);

  // Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Task Operations (Firestore-backed) ---
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!taskToUpdate) return;

    const nowStr = new Date().toISOString();
    let updated = { ...taskToUpdate, status: newStatus };
    if (newStatus === 'in_progress') {
      if (!taskToUpdate.actualStart) {
        updated.actualStart = nowStr;
      }
    } else if (newStatus === 'completed') {
      updated.completedAt = nowStr;
      if (!taskToUpdate.actualStart) {
        updated.actualStart = taskToUpdate.plannedStart || nowStr;
      }
    } else if (newStatus === 'todo') {
      // Create copy of the state and remove completedAt
      const { completedAt, ...rest } = updated;
      updated = rest as any;
    }

    // Optimistically update locally first
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));

    if (!isLocalMode) {
      try {
        await setDoc(doc(db, 'tasks', taskId), updated);
      } catch (error) {
        const err = handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
        setFirebaseError(err.error);
      }
    }
  };

  const handleTaskSubmit = async (taskData: any) => {
    if (taskData.id) {
      // Editing Task
      const existingTask = tasks.find((t) => t.id === taskData.id);
      const updated = { 
        ...existingTask, 
        ...taskData,
        ownerId: existingTask?.ownerId || currentUserProfile?.uid || 'guest',
        ownerEmail: existingTask?.ownerEmail || currentUserProfile?.email || 'guest@demo.com'
      };

      // Optimistic update
      setTasks((prev) => prev.map((t) => (t.id === taskData.id ? updated : t)));

      if (!isLocalMode) {
        try {
          await setDoc(doc(db, 'tasks', taskData.id), updated);
        } catch (error) {
          const err = handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskData.id}`);
          setFirebaseError(err.error);
        }
      }
    } else {
      // Creating Task
      const newId = `task-${Date.now()}`;
      const newTask: Task = {
        ...taskData,
        id: newId,
        createdAt: new Date().toISOString(),
        ownerId: currentUserProfile?.uid || 'guest',
        ownerEmail: currentUserProfile?.email || 'guest@demo.com',
      };

      // Optimistic update
      setTasks((prev) => [newTask, ...prev]);

      if (!isLocalMode) {
        try {
          await setDoc(doc(db, 'tasks', newId), newTask);
        } catch (error) {
          const err = handleFirestoreError(error, OperationType.CREATE, `tasks/${newId}`);
          setFirebaseError(err.error);
        }
      }
    }
    setTaskToEdit(null);
    setIsFormOpen(false);
  };

  const handleTaskDelete = async (taskId: string) => {
    // Optimistic update
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    if (!isLocalMode) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
      } catch (error) {
        const err = handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
        setFirebaseError(err.error);
      }
    }
  };

  const handleEditTrigger = (task: Task) => {
    setTaskToEdit(task);
    setIsFormOpen(true);
  };

  const handleAddTaskWithStatus = (status: TaskStatus) => {
    setTaskToEdit(null);
    setDefaultStatusForNewTask(status);
    setIsFormOpen(true);
  };

  // --- Database Administrators (Firestore-backed) ---
  const handleAddCategory = (name: string, color: string): Category => {
    const newId = `cat-${Date.now()}`;
    const newCat: Category = {
      id: newId,
      name,
      color,
    };
    
    // Optimistically update local state so TaskForm's selection can use it synchronously
    setCategories((prev) => [...prev, newCat]);
    
    if (!isLocalMode) {
      // Asynchronously write to Firestore
      setDoc(doc(db, 'categories', newId), newCat).catch((error) => {
        const err = handleFirestoreError(error, OperationType.CREATE, `categories/${newId}`);
        setFirebaseError(err.error);
      });
    }
    
    return newCat;
  };

  const handleDeleteCategory = async (catId: string) => {
    // Optimistic update
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    setTasks((prev) =>
      prev.map((t) => (t.categoryId === catId ? { ...t, categoryId: '' } : t))
    );

    if (!isLocalMode) {
      try {
        await deleteDoc(doc(db, 'categories', catId));
        // Reassign affected tasks to uncategorized in Firestore
        const tasksToUpdate = tasks.filter((t) => t.categoryId === catId);
        for (const t of tasksToUpdate) {
          await setDoc(doc(db, 'tasks', t.id), { ...t, categoryId: '' });
        }
      } catch (error) {
        const err = handleFirestoreError(error, OperationType.DELETE, `categories/${catId}`);
        setFirebaseError(err.error);
      }
    }
  };

  const handleAddAssignee = (name: string, email: string, color: string): Assignee => {
    const newId = `user-${Date.now()}`;
    const newAss: Assignee = {
      id: newId,
      name,
      avatarColor: color || getRandomHexColor(),
    };
    if (email) {
      newAss.email = email;
    }

    // Optimistically update local state
    setAssignees((prev) => [...prev, newAss]);

    if (!isLocalMode) {
      // Asynchronously write to Firestore
      setDoc(doc(db, 'assignees', newId), newAss).catch((error) => {
        const err = handleFirestoreError(error, OperationType.CREATE, `assignees/${newId}`);
        setFirebaseError(err.error);
      });
    }

    return newAss;
  };

  const handleDeleteAssignee = async (assId: string) => {
    // Optimistic update
    setAssignees((prev) => prev.filter((a) => a.id !== assId));
    setTasks((prev) =>
      prev.map((t) => (t.assigneeId === assId ? { ...t, assigneeId: '' } : t))
    );

    if (!isLocalMode) {
      try {
        await deleteDoc(doc(db, 'assignees', assId));
        // Reassign affected tasks to unassigned in Firestore
        const tasksToUpdate = tasks.filter((t) => t.assigneeId === assId);
        for (const t of tasksToUpdate) {
          await setDoc(doc(db, 'tasks', t.id), { ...t, assigneeId: '' });
        }
      } catch (error) {
        const err = handleFirestoreError(error, OperationType.DELETE, `assignees/${assId}`);
        setFirebaseError(err.error);
      }
    }
  };

  // Seeding/Reset helper
  const handleSeedDatabase = async () => {
    if (isLocalMode) {
      setCategories(INITIAL_CATEGORIES);
      setAssignees(INITIAL_ASSIGNEES);
      setTasks(INITIAL_TASKS);
      localStorage.setItem('todo_app_tasks', JSON.stringify(INITIAL_TASKS));
      localStorage.setItem('todo_app_categories', JSON.stringify(INITIAL_CATEGORIES));
      localStorage.setItem('todo_app_assignees', JSON.stringify(INITIAL_ASSIGNEES));
      alert('Local Storage successfully seeded with standard templates!');
      return;
    }

    try {
      setIsSyncing(true);
      setFirebaseError(null);
      // Seed categories
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }
      // Seed assignees
      for (const ass of INITIAL_ASSIGNEES) {
        await setDoc(doc(db, 'assignees', ass.id), ass);
      }
      // Seed tasks
      for (const task of INITIAL_TASKS) {
        await setDoc(doc(db, 'tasks', task.id), task);
      }
      alert('All sample tasks, categories, and assignees have been successfully seeded to your Firestore database!');
    } catch (err) {
      console.error("Error seeding database:", err);
      alert('Failed to seed database. Check your browser console or your Firestore rules.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetData = () => {
    const modeName = isLocalMode ? 'Local Storage' : 'Firestore';
    if (confirm(`Are you sure you want to seed the default demo data to ${modeName}? This will overwrite or add the standard templates.`)) {
      handleSeedDatabase();
    }
  };

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (err) {
      console.warn("Sign out from Firebase failed, clearing local profile:", err);
    }
    setCurrentUserProfile(null);
    localStorage.removeItem('todo_app_user_profile');
    // If they were logged in, they will be redirected automatically
  };

  // --- Filtering Computation ---
  const visibleTasks = tasks.filter((task) => {
    // If not logged in (guest / local mode with no user), show everything
    if (!currentUserProfile) return true;
    // If admin, show all tasks
    if (currentUserProfile.role === 'admin') return true;
    // If regular user, only show tasks owned by this user
    return task.ownerId === currentUserProfile.uid || (!task.ownerId && task.ownerEmail === currentUserProfile.email);
  });

  const filteredTasks = visibleTasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      filterCategory === 'all' || task.categoryId === filterCategory;

    const matchesAssignee =
      filterAssignee === 'all' || task.assigneeId === filterAssignee;

    const matchesPriority =
      filterPriority === 'all' || task.priority === filterPriority;

    return matchesSearch && matchesCategory && matchesAssignee && matchesPriority;
  });

  if (authLoading && !isLocalMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm font-bold text-slate-600 animate-pulse">Loading Workspace Environment...</p>
        </div>
      </div>
    );
  }

  if (!currentUserProfile && !isLocalMode) {
    return (
      <AuthScreen
        onAuthSuccess={(profile) => {
          setCurrentUserProfile(profile);
          setIsLocalMode(false);
          localStorage.setItem('firebase_local_mode', 'false');
        }}
        onContinueAsGuest={() => {
          setIsLocalMode(true);
          localStorage.setItem('firebase_local_mode', 'true');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Header Banner */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand/Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/15">
              <ListTodo className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none flex flex-wrap items-center gap-2">
                Team Planner & Board
                {isLocalMode ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200/50 shadow-3xs">
                    <WifiOff className="w-2.5 h-2.5" />
                    Local Sandbox
                  </span>
                ) : isSyncing ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200/50 animate-pulse">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    Syncing...
                  </span>
                ) : isFirebaseConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/50 shadow-3xs">
                    <Database className="w-2.5 h-2.5" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200/50">
                    <CloudLightning className="w-2.5 h-2.5" />
                    Not Configured
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Track categories, schedule start/end boundaries, and monitor team cycle-times.
              </p>
            </div>
          </div>

          {/* Real-time UTC / Time tracker panel */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl self-start md:self-auto shadow-2xs font-mono">
            <div className="p-1.5 rounded-lg bg-white shadow-xs text-slate-500">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-right leading-none">
              <p className="text-xs font-bold text-slate-900">
                {currentTime.toLocaleTimeString('en-US', { hour12: true })}
              </p>
              <p className="text-3xs text-slate-400 font-semibold mt-0.5">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* User Profile Info Card & Log Out */}
          {currentUserProfile ? (
            <div className="flex items-center gap-3 bg-indigo-50/50 border border-indigo-100/50 p-2 rounded-xl self-start md:self-auto shadow-2xs font-sans">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                {currentUserProfile.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left leading-tight min-w-0">
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                  {currentUserProfile.name}
                  {currentUserProfile.role === 'admin' ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase tracking-wider">
                      <Shield className="w-2 h-2" />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[8px] font-bold uppercase tracking-wider">
                      User
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-slate-500 truncate max-w-[120px] md:max-w-[150px]">
                  {currentUserProfile.email}
                </p>
              </div>
              <button
                id="btn-header-signout"
                onClick={handleSignOut}
                className="ml-2 p-2 bg-white hover:bg-rose-50 border border-slate-200/60 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-3xs cursor-pointer"
                title="Sign Out Workspace"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : isLocalMode ? (
            <div className="flex items-center gap-3 bg-indigo-50/50 border border-indigo-100/50 p-2 rounded-xl self-start md:self-auto shadow-2xs font-sans">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                G
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs font-bold text-slate-900">Sandbox Guest</p>
                <p className="text-[10px] text-slate-400">Offline Sandbox</p>
              </div>
              <button
                onClick={() => {
                  setIsLocalMode(false);
                  localStorage.setItem('firebase_local_mode', 'false');
                  setCurrentUserProfile(null);
                }}
                className="ml-2 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Log In
              </button>
            </div>
          ) : null}

        </div>
      </header>

      {/* Firebase Sync/Resilience Notice Banner */}
      {firebaseError && !isLocalMode && (
        <div className="bg-amber-50 border-b border-amber-200/60 py-3 px-6 shadow-2xs">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-start md:items-center gap-2.5 text-amber-800">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5 md:mt-0" />
              <div>
                <p className="font-bold text-amber-950">Firebase Configuration Connection Issue:</p>
                <p className="text-amber-700 font-medium mt-0.5">
                  Firestore returned: <code className="font-mono bg-amber-100/60 px-1 py-0.5 rounded text-amber-900">{firebaseError}</code>. 
                  This is usually because <strong className="text-amber-950">Anonymous Authentication</strong> is not yet enabled in the Firebase Console (under Build &rarr; Authentication &rarr; Sign-in method), or your Firestore rules are deploying.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                onClick={() => {
                  setIsLocalMode(true);
                  localStorage.setItem('firebase_local_mode', 'true');
                  setFirebaseError(null);
                  // Load backup templates/data immediately from local storage
                  const savedTasks = localStorage.getItem('todo_app_tasks');
                  const savedCategories = localStorage.getItem('todo_app_categories');
                  const savedAssignees = localStorage.getItem('todo_app_assignees');
                  if (savedTasks) setTasks(JSON.parse(savedTasks));
                  if (savedCategories) setCategories(JSON.parse(savedCategories));
                  if (savedAssignees) setAssignees(JSON.parse(savedAssignees));
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Switch to Local Sandbox Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {isLocalMode && (
        <div className="bg-indigo-50 border-b border-indigo-100/60 py-3 px-6 shadow-2xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-indigo-800">
              <WifiOff className="w-4.5 h-4.5 text-indigo-600" />
              <div>
                <span className="font-bold text-indigo-950">Running in Local Sandbox Mode.</span>
                <span className="text-indigo-700 font-medium ml-1">Your changes are preserved in your local browser cache. Connect to Firebase for team synchronization.</span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsLocalMode(false);
                localStorage.setItem('firebase_local_mode', 'false');
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
            >
              Reconnect to Firebase
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Filter, Search, and Tab Switch Actions */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            
            {/* Left: View Switching Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start">
              <button
                id="tab-view-board"
                onClick={() => setSelectedView('board')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                  selectedView === 'board'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Kanban Board
              </button>
              <button
                id="tab-view-grid"
                onClick={() => setSelectedView('grid')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                  selectedView === 'grid'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Task Cards Grid
              </button>
              <button
                id="tab-view-stats"
                onClick={() => setSelectedView('stats')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                  selectedView === 'stats'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Productivity Stats
              </button>
              {currentUserProfile?.role === 'admin' && (
                <button
                  id="tab-view-admin"
                  onClick={() => setSelectedView('admin' as any)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                    selectedView === 'admin'
                      ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100/50 font-black'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  Admin Console
                </button>
              )}
            </div>

            {/* Right: Primary Create and Database Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                id="btn-toggle-db"
                onClick={() => setShowDbManager(!showDbManager)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                <Settings2 className="w-4 h-4 text-slate-400" />
                Manage Team & Categories
                {showDbManager ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                id="btn-reset-data"
                onClick={handleResetData}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 bg-white border border-slate-200 hover:border-rose-200 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                title="Reset Database to Default Template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Template
              </button>

              <button
                id="btn-primary-add"
                onClick={() => handleAddTaskWithStatus('todo')}
                className="inline-flex items-center gap-2 px-4.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-500/10 transition-all cursor-pointer ml-auto"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Create New Task
              </button>
            </div>

          </div>

          {/* Collapsible Category & Assignee DB Manager Panel */}
          <AnimatePresence>
            {showDbManager && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden border-t border-slate-100 pt-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 rounded-xl border border-slate-200/80 p-5">
                  
                  {/* Category Directory Admin */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                        <Tag className="w-3.5 h-3.5 text-blue-600" />
                        Categories Database
                      </span>
                      <span className="text-3xs font-bold bg-slate-200/80 px-2 py-0.5 rounded-full text-slate-600">
                        {categories.length} Registered
                      </span>
                    </div>

                    {/* Add Category Form */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="New Category Name..."
                        value={catNameInput}
                        onChange={(e) => setCatNameInput(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="color"
                        value={catColorInput}
                        onChange={(e) => setCatColorInput(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                        title="Pick Category Badge Color"
                      />
                      <button
                        onClick={() => {
                          if (catNameInput.trim()) {
                            handleAddCategory(catNameInput.trim(), catColorInput);
                            setCatNameInput('');
                          }
                        }}
                        disabled={!catNameInput.trim()}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    </div>

                    {/* Active Categories List */}
                    <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {categories.map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                          <span className="flex items-center gap-2 text-xs font-medium text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                          </span>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                            title="Delete Category (Reassign tasks to uncategorized)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assignee Directory Admin */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        Assignee Directory
                      </span>
                      <span className="text-3xs font-bold bg-slate-200/80 px-2 py-0.5 rounded-full text-slate-600">
                        {assignees.length} Active Members
                      </span>
                    </div>

                    {/* Add Assignee Form */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Individual Name..."
                          value={assNameInput}
                          onChange={(e) => setAssNameInput(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => {
                            if (assNameInput.trim()) {
                              handleAddAssignee(assNameInput.trim(), assEmailInput.trim(), getRandomHexColor());
                              setAssNameInput('');
                              setAssEmailInput('');
                            }
                          }}
                          disabled={!assNameInput.trim()}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Register
                        </button>
                      </div>
                      <input
                        type="email"
                        placeholder="Email Address (Optional)..."
                        value={assEmailInput}
                        onChange={(e) => setAssEmailInput(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                      />
                    </div>

                    {/* Active Assignee List */}
                    <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {assignees.map((ass) => (
                        <div key={ass.id} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                          <span className="flex items-center gap-2 text-xs font-medium text-slate-700">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ backgroundColor: ass.avatarColor }}>
                              {ass.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                            </span>
                            <div>
                              <p className="font-bold text-slate-800 leading-none">{ass.name}</p>
                              {ass.email && <p className="text-[10px] text-slate-400 leading-none mt-0.5">{ass.email}</p>}
                            </div>
                          </span>
                          <button
                            onClick={() => handleDeleteAssignee(ass.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                            title="Delete Assignee (Reassign tasks to unassigned)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filtering controls bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border-t border-slate-100 pt-4">
            
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all text-slate-700"
              >
                <option value="all">Category: All</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee Filter */}
            <div>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all text-slate-700"
              >
                <option value="all">Assignee: All</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all text-slate-700"
              >
                <option value="all">Priority: All</option>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

          </div>
        </div>

        {/* --- Primary Workspace Stage --- */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {selectedView === 'board' && (
              <BoardView
                tasks={filteredTasks}
                categories={categories}
                assignees={assignees}
                onStatusChange={handleStatusChange}
                onEdit={handleEditTrigger}
                onDelete={handleTaskDelete}
                onAddTaskWithStatus={handleAddTaskWithStatus}
              />
            )}

            {selectedView === 'grid' && (
              <div>
                {filteredTasks.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-3xl py-16 px-4 text-center max-w-md mx-auto shadow-sm">
                    <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-800">No tasks match your filters</h3>
                    <p className="text-xs text-slate-400 mt-1">Try clearing filters or search queries, or make a new task!</p>
                    <button
                      onClick={() => handleAddTaskWithStatus('todo')}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Create New Task
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        category={categories.find((c) => c.id === task.categoryId)}
                        assignee={assignees.find((a) => a.id === task.assigneeId)}
                        onStatusChange={handleStatusChange}
                        onEdit={handleEditTrigger}
                        onDelete={handleTaskDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedView === 'stats' && (
              <TaskStats
                tasks={tasks} // Keep general stats calculated from ALL tasks to make charts representative
                categories={categories}
                assignees={assignees}
              />
            )}

            {selectedView === ('admin' as any) && currentUserProfile && (
              <AdminPanel
                currentUser={currentUserProfile}
                tasks={tasks}
                categories={categories}
                assignees={assignees}
                isLocalMode={isLocalMode}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Slide-over/Dialog Form for Task Creation/Edition */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setTaskToEdit(null);
        }}
        categories={categories}
        assignees={assignees}
        taskToEdit={taskToEdit}
        onSubmit={handleTaskSubmit}
        onAddCategory={handleAddCategory}
        onAddAssignee={handleAddAssignee}
      />
    </div>
  );
}
