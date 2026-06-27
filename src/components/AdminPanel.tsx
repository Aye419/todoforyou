import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc, query } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Task, Category, Assignee } from '../types';
import { 
  Users, ShieldAlert, ShieldCheck, Mail, Calendar, UserPlus, 
  Trash2, ToggleLeft, ToggleRight, ListTodo, CheckSquare, 
  Clock, Database, Award, RefreshCw, BarChart2
} from 'lucide-react';
import { getDurationString } from '../utils';

interface AdminPanelProps {
  currentUser: UserProfile;
  tasks: Task[];
  categories: Category[];
  assignees: Assignee[];
  isLocalMode: boolean;
}

export default function AdminPanel({
  currentUser,
  tasks,
  categories,
  assignees,
  isLocalMode
}: AdminPanelProps) {
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch registered users
  useEffect(() => {
    if (isLocalMode) {
      // Create a mock list of users from the existing mock tasks & the current user
      const uniqueEmails = Array.from(new Set(tasks.map(t => t.ownerEmail).filter(Boolean)));
      const mockUsers: UserProfile[] = uniqueEmails.map((email, index) => ({
        uid: `local_user_${index}`,
        email: email!,
        name: email!.split('@')[0],
        role: 'user',
        createdAt: new Date().toISOString()
      }));

      // Add current user
      if (!mockUsers.some(u => u.uid === currentUser.uid)) {
        mockUsers.push(currentUser);
      }
      setUsersList(mockUsers);
      return;
    }

    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const list: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          list.push(doc.data() as UserProfile);
        });
        // Sort by name
        list.sort((a, b) => a.name.localeCompare(b.name));
        setUsersList(list);
      } catch (err) {
        console.error("Failed to fetch users list for admin:", err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [refreshTrigger, isLocalMode, currentUser, tasks]);

  // Handle role promotion/demotion
  const handleToggleRole = async (user: UserProfile) => {
    if (user.uid === currentUser.uid) {
      alert("You cannot change your own role as current administrator.");
      return;
    }

    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const confirmChange = window.confirm(`Are you sure you want to change the role of ${user.name} to ${newRole}?`);
    if (!confirmChange) return;

    // Optimistic Update
    setUsersList(prev => prev.map(u => u.uid === user.uid ? { ...u, role: newRole } : u));

    if (!isLocalMode) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { role: newRole });
      } catch (err) {
        console.error("Failed to update user role:", err);
        alert("Failed to update user role in database.");
        setRefreshTrigger(p => p + 1); // revert
      }
    }
  };

  // Safe user deletion
  const handleDeleteUserRecord = async (user: UserProfile) => {
    if (user.uid === currentUser.uid) {
      alert("You cannot delete your own account.");
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete user ${user.name}? This removes their registry profile, but their tasks will remain assigned to "Uncategorized/Orphaned" status.`);
    if (!confirmDelete) return;

    // Optimistic Update
    setUsersList(prev => prev.filter(u => u.uid !== user.uid));

    if (!isLocalMode) {
      try {
        await deleteDoc(doc(db, 'users', user.uid));
      } catch (err) {
        console.error("Failed to delete user profile:", err);
        alert("Failed to delete user profile from Firestore.");
        setRefreshTrigger(p => p + 1); // revert
      }
    }
  };

  // Compute analytics
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const progressTasksCount = tasks.filter(t => t.status === 'in_progress').length;
  const todoTasksCount = tasks.filter(t => t.status === 'todo').length;

  const completionRate = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;

  // Group tasks by owner
  const getTasksCountByUid = (uid: string, email: string) => {
    return tasks.filter(t => t.ownerId === uid || t.ownerEmail === email).length;
  };

  const getCompletedTasksCountByUid = (uid: string, email: string) => {
    return tasks.filter(t => (t.ownerId === uid || t.ownerEmail === email) && t.status === 'completed').length;
  };

  return (
    <div className="space-y-6 text-left">
      {/* Intro Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest">Active Members</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{usersList.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest">Total Workspace Tasks</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalTasksCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest">Completed Tasks</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{completedTasksCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest">Global Completion Rate</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{completionRate}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Roles & Access control table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Active Team Registry</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Control system privileges, manage access tiers, and audit contributions.</p>
            </div>
            {!isLocalMode && (
              <button
                onClick={() => setRefreshTrigger(p => p + 1)}
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                title="Refresh user list"
              >
                <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User Details</th>
                  <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Role Claim</th>
                  <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Contribution</th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Administration Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {usersList.map((user) => {
                  const isSelf = user.uid === currentUser.uid;
                  const uTasks = getTasksCountByUid(user.uid, user.email);
                  const uDone = getCompletedTasksCountByUid(user.uid, user.email);

                  return (
                    <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                            user.role === 'admin' ? 'bg-indigo-600' : 'bg-slate-400'
                          }`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {user.name}
                              {isSelf && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-wider">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-300" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                            <ShieldCheck className="w-3 h-3 text-indigo-500" />
                            Administrator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200/50">
                            Regular User
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <p className="font-bold text-slate-800">{uTasks} tasks</p>
                          <p className="text-[10px] text-slate-400 font-medium">({uDone} completed)</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleRole(user)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
                              isSelf 
                                ? 'text-slate-300 cursor-not-allowed' 
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100 cursor-pointer'
                            }`}
                            title={user.role === 'admin' ? "Demote to User" : "Promote to Admin"}
                          >
                            {user.role === 'admin' ? (
                              <ToggleRight className="w-5 h-5 text-indigo-600" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-slate-400" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteUserRecord(user)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-lg transition-all ${
                              isSelf 
                                ? 'text-slate-300 cursor-not-allowed' 
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                            }`}
                            title="Remove User Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Analytics Overview Cards */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 text-left">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Access Permissions Matrix</h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                As an <strong>Administrator</strong>, you have high-level privileges:
              </p>
            </div>
            
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                <span>You can view and inspect task cards submitted by <strong>any registered user</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                <span>You can manage membership roles (promote to administrator or demote back to user).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                <span>You have access to aggregate metrics including workspace cycle-times.</span>
              </li>
            </ul>

            <div className="pt-2">
              <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/30 text-xs">
                <p className="font-bold text-indigo-950 flex items-center gap-1">
                  <Award className="w-4 h-4 text-indigo-600" />
                  Testing Guide:
                </p>
                <p className="text-indigo-700 leading-relaxed mt-1 font-medium">
                  Register a second user with the <strong>Regular User</strong> role on the login screen to see how their view filters strictly to only their tasks! Then, sign back in as an <strong>Admin</strong> to watch the tasks sync globally.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-left space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Workflow Load</h2>
            
            <div className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>To-Do Backlog</span>
                  <span>{todoTasksCount} / {totalTasksCount}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-400 transition-all duration-300"
                    style={{ width: `${totalTasksCount > 0 ? (todoTasksCount / totalTasksCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>In Progress (Active Cycle)</span>
                  <span>{progressTasksCount} / {totalTasksCount}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${totalTasksCount > 0 ? (progressTasksCount / totalTasksCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>Completed & Closed</span>
                  <span>{completedTasksCount} / {totalTasksCount}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
