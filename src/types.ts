export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Category {
  id: string;
  name: string;
  color: string; // Hex color code
}

export interface Assignee {
  id: string;
  name: string;
  avatarColor: string; // Tailwind bg color class or hex code
  email?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  assigneeId: string;
  status: TaskStatus;
  priority: TaskPriority;
  plannedStart: string; // ISO / YYYY-MM-DDTHH:mm
  plannedEnd: string;   // ISO / YYYY-MM-DDTHH:mm
  actualStart?: string; // Set when status changes to 'in_progress'
  completedAt?: string; // Set when status changes to 'completed'
  createdAt: string;
}
