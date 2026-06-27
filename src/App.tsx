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
  Users
} from 'lucide-react';
import { Task, Category, Assignee, TaskStatus, TaskPriority } from './types';
import { INITIAL_TASKS, INITIAL_CATEGORIES, INITIAL_ASSIGNEES } from './initialData';
import TaskCard from './components/TaskCard';
import TaskForm from './components/TaskForm';
import BoardView from './components/BoardView';
import TaskStats from './components/TaskStats';
import { getRandomHexColor } from './utils';

export default function App() {
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

  // --- Local Storage Sync ---
  useEffect(() => {
    localStorage.setItem('todo_app_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('todo_app_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('todo_app_assignees', JSON.stringify(assignees));
  }, [assignees]);

  // Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Task Operations ---
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const nowStr = new Date().toISOString();
        
        let updated = { ...t, status: newStatus };
        if (newStatus === 'in_progress') {
          // If moving to in_progress, set actualStart if not already set
          if (!t.actualStart) {
            updated.actualStart = nowStr;
          }
        } else if (newStatus === 'completed') {
          // If completing, set completedAt
          updated.completedAt = nowStr;
          // If actualStart is missing, default it to plannedStart or nowStr
          if (!t.actualStart) {
            updated.actualStart = t.plannedStart || nowStr;
          }
        } else if (newStatus === 'todo') {
          // Resetting back to todo clears completion and start times if desired,
          // or we can preserve start and just clear completion
          updated.completedAt = undefined;
        }
        return updated;
      })
    );
  };

  const handleTaskSubmit = (taskData: any) => {
    if (taskData.id) {
      // Editing Task
      setTasks((prev) =>
        prev.map((t) => (t.id === taskData.id ? { ...t, ...taskData } : t))
      );
    } else {
      // Creating Task
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
    }
    setTaskToEdit(null);
    setIsFormOpen(false);
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
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

  // --- Database Administrators ---
  const handleAddCategory = (name: string, color: string): Category => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      color,
    };
    setCategories((prev) => [...prev, newCat]);
    return newCat;
  };

  const handleDeleteCategory = (catId: string) => {
    // Prevent deleting if tasks rely on it, or reassign them to Uncategorized
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    // Reassign task categories to blank or default
    setTasks((prev) =>
      prev.map((t) => (t.categoryId === catId ? { ...t, categoryId: '' } : t))
    );
  };

  const handleAddAssignee = (name: string, email: string, color: string): Assignee => {
    const newAss: Assignee = {
      id: `user-${Date.now()}`,
      name,
      avatarColor: color || getRandomHexColor(),
      email: email || undefined,
    };
    setAssignees((prev) => [...prev, newAss]);
    return newAss;
  };

  const handleDeleteAssignee = (assId: string) => {
    setAssignees((prev) => prev.filter((a) => a.id !== assId));
    // Reassign task assignees to blank or default
    setTasks((prev) =>
      prev.map((t) => (t.assigneeId === assId ? { ...t, assigneeId: '' } : t))
    );
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data back to the original seed templates?')) {
      setTasks(INITIAL_TASKS);
      setCategories(INITIAL_CATEGORIES);
      setAssignees(INITIAL_ASSIGNEES);
      localStorage.removeItem('todo_app_tasks');
      localStorage.removeItem('todo_app_categories');
      localStorage.removeItem('todo_app_assignees');
    }
  };

  // --- Filtering Computation ---
  const filteredTasks = tasks.filter((task) => {
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
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none flex items-center gap-2">
                Team Planner & Board
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

        </div>
      </header>

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
