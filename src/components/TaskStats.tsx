import { CheckCircle2, Play, ListTodo, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { Task, Category, Assignee } from '../types';
import { getDurationString, isTaskOverdue } from '../utils';

interface TaskStatsProps {
  tasks: Task[];
  categories: Category[];
  assignees: Assignee[];
}

export default function TaskStats({ tasks, categories, assignees }: TaskStatsProps) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const overdue = tasks.filter((t) => isTaskOverdue(t)).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Calculate Average Completion Time
  const completedWithTime = tasks.filter((t) => t.status === 'completed' && t.actualStart && t.completedAt);
  let averageCompletionTimeStr = 'N/A';
  if (completedWithTime.length > 0) {
    let totalMs = 0;
    completedWithTime.forEach((t) => {
      const start = new Date(t.actualStart!).getTime();
      const end = new Date(t.completedAt!).getTime();
      totalMs += Math.max(0, end - start);
    });
    const avgMs = totalMs / completedWithTime.length;
    
    // Format avgMs
    const avgMins = Math.floor(avgMs / (1000 * 60));
    const mins = avgMins % 60;
    const avgHours = Math.floor(avgMins / 60);
    const hours = avgHours % 24;
    const days = Math.floor(avgHours / 24);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
    averageCompletionTimeStr = parts.slice(0, 2).join(' ');
  }

  // Count Tasks by Category
  const categoryStats = categories.map((cat) => {
    const catTasks = tasks.filter((t) => t.categoryId === cat.id);
    const catCompleted = catTasks.filter((t) => t.status === 'completed').length;
    return {
      ...cat,
      count: catTasks.length,
      completedCount: catCompleted,
      percentage: catTasks.length > 0 ? Math.round((catCompleted / catTasks.length) * 100) : 0,
    };
  }).sort((a, b) => b.count - a.count);

  // Count Tasks by Assignee
  const assigneeStats = assignees.map((ass) => {
    const assTasks = tasks.filter((t) => t.assigneeId === ass.id);
    const assCompleted = assTasks.filter((t) => t.status === 'completed').length;
    return {
      ...ass,
      count: assTasks.length,
      completedCount: assCompleted,
      percentage: assTasks.length > 0 ? Math.round((assCompleted / assTasks.length) * 100) : 0,
    };
  }).sort((a, b) => b.count - a.count);

  // Custom SVG Bar Chart calculation for categories
  const maxCategoryCount = Math.max(...categoryStats.map((c) => c.count), 1);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Tasks Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tasks</span>
            <div className="p-1.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 leading-none mt-2">{total}</div>
          <p className="text-3xs text-slate-400 mt-2 font-medium">across all categories</p>
        </div>

        {/* In Progress Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Progress</span>
            <div className="p-1.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Play className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-sky-600 leading-none mt-2">{inProgress}</div>
          <p className="text-3xs text-sky-500 mt-2 font-medium">currently active</p>
        </div>

        {/* Completed Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</span>
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 leading-none mt-2">{completed}</div>
          <p className="text-3xs text-emerald-500 mt-2 font-medium">{completionRate}% total completion rate</p>
        </div>

        {/* Overdue Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue</span>
            <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 leading-none mt-2">{overdue}</div>
          <p className="text-3xs text-rose-500 mt-2 font-medium">past target deadlines</p>
        </div>

        {/* Average Time Spent Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg. Cycle Time</span>
            <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 leading-none mt-2">{averageCompletionTimeStr}</div>
          <p className="text-3xs text-indigo-500 mt-2 font-medium">from start to complete</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Category Distribution Custom Chart */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Task Allocation by Category</h3>
              <p className="text-3xs text-slate-400 mt-0.5">Total volume and completion percentage per category</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4">
            {categoryStats.map((cat) => {
              const barWidthPct = (cat.count / maxCategoryCount) * 100;
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-semibold text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                    <span className="font-mono font-bold text-slate-600">
                      {cat.count} {cat.count === 1 ? 'task' : 'tasks'}{' '}
                      <span className="text-3xs font-medium text-slate-400">({cat.percentage}% done)</span>
                    </span>
                  </div>
                  {/* Custom Bar Chart bar */}
                  <div className="h-6 w-full bg-slate-50 border border-slate-100 rounded-lg overflow-hidden relative flex items-center">
                    <div
                      className="h-full rounded-l-lg transition-all duration-500"
                      style={{
                        width: `${barWidthPct}%`,
                        backgroundColor: `${cat.color}CC`, // opacity color
                      }}
                    />
                    {/* Tiny stats overlay */}
                    <div className="absolute right-2 text-2xs font-mono text-slate-400">
                      {cat.completedCount} / {cat.count} complete
                    </div>
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No category data available.</p>
            )}
          </div>
        </div>

        {/* Right: Team Productivity & Assignment */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Task Assignment by Team Member</h3>
              <p className="text-3xs text-slate-400 mt-0.5">Load distribution and focus across individuals</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4">
            {assigneeStats.map((ass) => {
              const getInitials = (name: string) => name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
              return (
                <div key={ass.id} className="flex items-center gap-3">
                  {/* User Profile Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-inner"
                    style={{ backgroundColor: ass.avatarColor }}
                  >
                    {getInitials(ass.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-800 truncate">{ass.name}</span>
                      <span className="font-mono text-slate-600 font-semibold">
                        {ass.count} {ass.count === 1 ? 'task' : 'tasks'}{' '}
                        <span className="text-3xs text-slate-400">({ass.completedCount} done)</span>
                      </span>
                    </div>

                    {/* Progress Bar for individual completion rate */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${ass.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {assignees.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No assignee data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
