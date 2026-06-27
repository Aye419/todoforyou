import React, { useState, useEffect } from 'react';
import { X, Plus, FolderPlus, UserPlus, Check, Sparkles } from 'lucide-react';
import { Task, Category, Assignee, TaskPriority, TaskStatus } from '../types';
import { getRandomHexColor } from '../utils';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  assignees: Assignee[];
  taskToEdit: Task | null;
  onSubmit: (taskData: any) => void;
  onAddCategory: (name: string, color: string) => Category;
  onAddAssignee: (name: string, email: string, color: string) => Assignee;
}

export default function TaskForm({
  isOpen,
  onClose,
  categories,
  assignees,
  taskToEdit,
  onSubmit,
  onAddCategory,
  onAddAssignee,
}: TaskFormProps) {
  // Task State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [plannedStart, setPlannedStart] = useState('');
  const [plannedEnd, setPlannedEnd] = useState('');

  // Inline Category Creator State
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');

  // Inline Assignee Creator State
  const [isCreatingAssignee, setIsCreatingAssignee] = useState(false);
  const [newAssigneeName, setNewAssigneeName] = useState('');
  const [newAssigneeEmail, setNewAssigneeEmail] = useState('');

  // Setup defaults when modal opens or edit task changes
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setCategoryId(taskToEdit.categoryId);
      setAssigneeId(taskToEdit.assigneeId);
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setPlannedStart(taskToEdit.plannedStart);
      setPlannedEnd(taskToEdit.plannedEnd);
    } else {
      // Default dates
      const now = new Date();
      const formatLocal = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
      };

      const start = new Date(now);
      const end = new Date(now);
      end.setDate(end.getDate() + 1); // 1 day later by default

      setTitle('');
      setDescription('');
      setCategoryId(categories[0]?.id || '');
      setAssigneeId(assignees[0]?.id || '');
      setPriority('medium');
      setStatus('todo');
      setPlannedStart(formatLocal(start));
      setPlannedEnd(formatLocal(end));
    }
    // Reset secondary creators
    setIsCreatingCategory(false);
    setIsCreatingAssignee(false);
  }, [taskToEdit, isOpen, categories, assignees]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      id: taskToEdit?.id,
      title: title.trim(),
      description: description.trim(),
      categoryId,
      assigneeId,
      priority,
      status,
      plannedStart,
      plannedEnd,
    });
    onClose();
  };

  // Quick action for generating random task title/description
  const handleAutoFill = () => {
    const ideas = [
      { t: 'Review pull requests and approve release build', d: 'Check through code review, test locally, merge changes, and prepare stage assets.' },
      { t: 'Optimize database indexes for query speed', d: 'Analyze slow query logs, review primary index mappings, and construct migrations.' },
      { t: 'Draft newsletter and product features recap', d: 'Write key paragraphs describing the dashboard, board planner, and analytics modules.' },
      { t: 'Perform QA testing on mobile layout', d: 'Verify touchscreen target widths, scroll bars, card density, and side sheet toggles.' },
    ];
    const pick = ideas[Math.floor(Math.random() * ideas.length)];
    setTitle(pick.t);
    setDescription(pick.d);
  };

  // Create category in-line
  const handleCreateCategoryInline = () => {
    if (!newCatName.trim()) return;
    const cat = onAddCategory(newCatName.trim(), newCatColor);
    setCategoryId(cat.id);
    setNewCatName('');
    setIsCreatingCategory(false);
  };

  // Create assignee in-line
  const handleCreateAssigneeInline = () => {
    if (!newAssigneeName.trim()) return;
    const color = getRandomHexColor();
    const ass = onAddAssignee(newAssigneeName.trim(), newAssigneeEmail.trim(), color);
    setAssigneeId(ass.id);
    setNewAssigneeName('');
    setNewAssigneeEmail('');
    setIsCreatingAssignee(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 max-w-lg w-full p-6 overflow-hidden max-h-[90vh] flex flex-col shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              {taskToEdit ? 'Edit Task Details' : 'Create New Task'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Fill in the parameters below to organize your board.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Quick autofill for demo */}
          {!taskToEdit && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAutoFill}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-950/70 border border-indigo-900/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Auto-fill Idea
              </button>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Conduct client user testing session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-500 font-medium"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Provide a short breakdown of deliverables and requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-500 leading-relaxed"
            />
          </div>

          {/* Categories select + quick create inline */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Category <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                {isCreatingCategory ? 'Cancel' : 'New Category'}
              </button>
            </div>

            {isCreatingCategory ? (
              <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl flex items-center gap-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="Category Name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 min-w-0 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500"
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-800 cursor-pointer shrink-0 bg-slate-900"
                  title="Choose Category Color"
                />
                <button
                  type="button"
                  onClick={handleCreateCategoryInline}
                  disabled={!newCatName.trim()}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Assignees select + quick create inline */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Assignee (Individual) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingAssignee(!isCreatingAssignee)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {isCreatingAssignee ? 'Cancel' : 'New Individual'}
              </button>
            </div>

            {isCreatingAssignee ? (
              <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl space-y-2 animate-fade-in">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newAssigneeName}
                    onChange={(e) => setNewAssigneeName(e.target.value)}
                    className="flex-1 min-w-0 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateAssigneeInline}
                    disabled={!newAssigneeName.trim()}
                    className="px-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <input
                  type="email"
                  placeholder="Email Address (Optional)"
                  value={newAssigneeEmail}
                  onChange={(e) => setNewAssigneeEmail(e.target.value)}
                  className="w-full bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 border border-slate-800 rounded-lg focus:outline-none placeholder:text-slate-500"
                />
              </div>
            ) : (
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
              >
                <option value="">-- Select Individual --</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} {a.email ? `(${a.email})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Priority & Status Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Timelines row (Planned Start & Planned End) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Planned Start <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={plannedStart}
                onChange={(e) => setPlannedStart(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Planned End / Deadline <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={plannedEnd}
                onChange={(e) => setPlannedEnd(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
              />
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || !categoryId || !assigneeId}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {taskToEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
