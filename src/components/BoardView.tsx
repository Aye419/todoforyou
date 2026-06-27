import { Plus, ListTodo, Play, CheckCircle2 } from 'lucide-react';
import { Task, Category, Assignee, TaskStatus } from '../types';
import TaskCard from './TaskCard';

interface BoardViewProps {
  tasks: Task[];
  categories: Category[];
  assignees: Assignee[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddTaskWithStatus: (status: TaskStatus) => void;
}

export default function BoardView({
  tasks,
  categories,
  assignees,
  onStatusChange,
  onEdit,
  onDelete,
  onAddTaskWithStatus,
}: BoardViewProps) {
  const statuses: { id: TaskStatus; label: string; icon: any; colorClass: string; borderClass: string; bgClass: string; iconColor: string }[] = [
    {
      id: 'todo',
      label: 'To Do',
      icon: ListTodo,
      colorClass: 'text-slate-800 bg-slate-100',
      borderClass: 'border-slate-200/80',
      bgClass: 'bg-slate-50/50',
      iconColor: 'text-slate-500',
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      icon: Play,
      colorClass: 'text-sky-800 bg-sky-100',
      borderClass: 'border-sky-100',
      bgClass: 'bg-sky-50/20',
      iconColor: 'text-sky-500',
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: CheckCircle2,
      colorClass: 'text-emerald-800 bg-emerald-100',
      borderClass: 'border-emerald-100',
      bgClass: 'bg-emerald-50/20',
      iconColor: 'text-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {statuses.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);
        const Icon = column.icon;

        return (
          <div
            key={column.id}
            id={`board-column-${column.id}`}
            className="flex flex-col max-h-[80vh] rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-xl bg-slate-50 border border-slate-100 ${column.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 tracking-tight text-sm">
                  {column.label}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${column.colorClass}`}>
                  {columnTasks.length}
                </span>
              </div>

              {/* Header Quick Add Button */}
              <button
                id={`btn-column-add-${column.id}`}
                onClick={() => onAddTaskWithStatus(column.id)}
                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                title={`Add task to ${column.label}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Column Body / Cards Stack */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1 scrollbar-thin">
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-100 rounded-3xl text-center bg-slate-50/50">
                  <p className="text-xs font-semibold text-slate-400">No tasks in this stage</p>
                  <p className="text-3xs text-slate-400 mt-1">Ready to create or drag items</p>
                  <button
                    onClick={() => onAddTaskWithStatus(column.id)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Task
                  </button>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    category={categories.find((c) => c.id === task.categoryId)}
                    assignee={assignees.find((a) => a.id === task.assigneeId)}
                    onStatusChange={onStatusChange}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>

            {/* Bottom column quick trigger */}
            {columnTasks.length > 0 && (
              <button
                id={`btn-bottom-add-${column.id}`}
                onClick={() => onAddTaskWithStatus(column.id)}
                className="mt-3 w-full py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-indigo-500" />
                Add New Task
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
