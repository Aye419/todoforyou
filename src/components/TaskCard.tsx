import { motion } from 'motion/react';
import { Play, Check, Calendar, Clock, User, Edit2, Trash2, AlertTriangle, RotateCcw } from 'lucide-react';
import { Task, Category, Assignee } from '../types';
import { formatDateTime, getDurationString, isTaskOverdue, getContrastColor } from '../utils';

interface TaskCardProps {
  key?: string | number;
  task: Task;
  category?: Category;
  assignee?: Assignee;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskCard({
  task,
  category,
  assignee,
  onStatusChange,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const isOverdue = isTaskOverdue(task);
  const catColor = category?.color || '#cbd5e1'; // default light slate
  const catTextColor = getContrastColor(catColor);

  // Status badge details
  const priorityColors = {
    low: { bg: 'bg-emerald-950/40 text-emerald-300 border-emerald-900/40', dot: 'bg-emerald-400' },
    medium: { bg: 'bg-amber-950/40 text-amber-300 border-amber-900/40', dot: 'bg-amber-400' },
    high: { bg: 'bg-rose-950/40 text-rose-300 border-rose-900/40', dot: 'bg-rose-400' },
  };

  const currentPriority = priorityColors[task.priority];

  // Helper for rendering initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <motion.div
      layout
      id={`task-card-${task.id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative group bg-slate-950 rounded-3xl border p-6 flex flex-col justify-between hover:shadow-lg hover:border-slate-700 transition-all duration-200 ${
        isOverdue ? 'border-rose-900 ring-1 ring-rose-950/80' : 'border-slate-800'
      }`}
    >
      {/* Header tags */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Category badge */}
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border transition-all"
              style={{
                backgroundColor: catColor,
                color: catTextColor,
                borderColor: `${catColor}33`, // slightly darker border
              }}
            >
              {category?.name || 'Uncategorized'}
            </span>

            {/* Priority Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentPriority.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${currentPriority.dot}`} />
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>

            {/* Overdue alert */}
            {isOverdue && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/50 text-rose-300 border border-rose-900/50 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                Overdue
              </span>
            )}
          </div>

          {/* Action icons (Edit / Delete) */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              id={`btn-edit-${task.id}`}
              onClick={() => onEdit(task)}
              className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-md transition-colors"
              title="Edit Task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              id={`btn-delete-${task.id}`}
              onClick={() => onDelete(task.id)}
              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-md transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task Title */}
        <h3 className={`text-base font-bold text-slate-100 mb-1 tracking-tight group-hover:text-indigo-400 transition-colors ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
          {task.title}
        </h3>

        {task.ownerEmail && (
          <div className="text-[10px] text-slate-500 mb-2 flex items-center gap-1 font-medium bg-slate-900/50 border border-slate-800 rounded-md px-1.5 py-0.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Created by: <span className="font-semibold text-slate-400">{task.ownerEmail}</span>
          </div>
        )}

        {/* Task Description */}
        <p className={`text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed ${task.status === 'completed' ? 'text-slate-500' : ''}`}>
          {task.description || 'No description provided.'}
        </p>
      </div>

      {/* Middle section: Timing tracker information */}
      <div className="border-t border-dashed border-slate-800 pt-3.5 pb-4 space-y-2">
        {/* Planned timeline */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Planned:
          </span>
          <span className="font-mono text-slate-300">
            {formatDateTime(task.plannedStart)} - {formatDateTime(task.plannedEnd)}
          </span>
        </div>

        {/* Dynamic status timing display */}
        {task.status === 'in_progress' && task.actualStart && (
          <div className="flex items-center justify-between text-xs bg-sky-950/30 text-sky-300 rounded-lg p-2 border border-sky-900/40">
            <span className="flex items-center gap-1.5 font-medium animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Started:
            </span>
            <span className="font-mono font-semibold">
              {formatDateTime(task.actualStart)} ({getDurationString(task.actualStart, new Date().toISOString())} active)
            </span>
          </div>
        )}

        {task.status === 'completed' && task.actualStart && task.completedAt && (
          <div className="flex flex-col gap-1 bg-emerald-950/30 text-emerald-300 rounded-lg p-2 border border-emerald-900/40">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Completed:
              </span>
              <span className="font-mono font-semibold">
                {formatDateTime(task.completedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between text-2xs opacity-80 pl-5">
              <span>Time spent:</span>
              <span className="font-mono">{getDurationString(task.actualStart, task.completedAt)}</span>
            </div>
          </div>
        )}

        {task.status === 'completed' && !task.actualStart && task.completedAt && (
          <div className="flex items-center justify-between text-xs bg-emerald-950/30 text-emerald-300 rounded-lg p-2 border border-emerald-900/40">
            <span className="flex items-center gap-1.5 font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Completed:
            </span>
            <span className="font-mono font-semibold">
              {formatDateTime(task.completedAt)}
            </span>
          </div>
        )}
      </div>

      {/* Footer section: Assignee + Status Actions */}
      <div className="border-t border-slate-800 pt-3.5 flex items-center justify-between gap-4">
        {/* Assignee Avatar */}
        <div className="flex items-center gap-2 overflow-hidden">
          {assignee ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-inner"
              style={{ backgroundColor: assignee.avatarColor }}
              title={`${assignee.name} (${assignee.email || 'No email'})`}
            >
              {getInitials(assignee.name)}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 shrink-0 border border-slate-800">
              <User className="w-4 h-4" />
            </div>
          )}
          <div className="text-left leading-tight min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate" title={assignee?.name || 'Unassigned'}>
              {assignee?.name || 'Unassigned'}
            </p>
            <p className="text-3xs text-slate-400 truncate">
              {assignee?.email || 'No Email'}
            </p>
          </div>
        </div>

        {/* Immediate Status Trigger Controls */}
        <div className="shrink-0">
          {task.status === 'todo' && (
            <button
              id={`btn-start-${task.id}`}
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-indigo-600 active:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              Start Work
            </button>
          )}

          {task.status === 'in_progress' && (
            <button
              id={`btn-complete-${task.id}`}
              onClick={() => onStatusChange(task.id, 'completed')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-3 h-3 stroke-[3px]" />
              Complete
            </button>
          )}

          {task.status === 'completed' && (
            <button
              id={`btn-reopen-${task.id}`}
              onClick={() => onStatusChange(task.id, 'todo')}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Re-open
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
