import { Category, Assignee, Task } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Engineering', color: '#3b82f6' }, // Blue
  { id: 'cat-2', name: 'Marketing', color: '#ec4899' },    // Pink
  { id: 'cat-3', name: 'Design', color: '#8b5cf6' },       // Purple
  { id: 'cat-4', name: 'Operations', color: '#10b981' },   // Green
  { id: 'cat-5', name: 'Personal', color: '#f59e0b' },     // Amber
];

export const INITIAL_ASSIGNEES: Assignee[] = [
  { id: 'user-1', name: 'Sarah Connor', avatarColor: '#3b82f6', email: 'sarah@skynet.com' },
  { id: 'user-2', name: 'John Doe', avatarColor: '#ec4899', email: 'john@example.com' },
  { id: 'user-3', name: 'Alice Smith', avatarColor: '#10b981', email: 'alice@company.com' },
  { id: 'user-4', name: 'Bob Roberts', avatarColor: '#f59e0b', email: 'bob@company.com' },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Design Dashboard High-Fidelity Mockups',
    description: 'Create responsive UI screens for the main workspace, analytics view, and project board. Follow the minimalist guidelines.',
    categoryId: 'cat-3',
    assigneeId: 'user-3',
    status: 'completed',
    priority: 'high',
    plannedStart: '2026-06-25T09:00',
    plannedEnd: '2026-06-26T17:00',
    actualStart: '2026-06-25T09:15',
    completedAt: '2026-06-26T15:30',
    createdAt: '2026-06-24T18:00:00Z',
  },
  {
    id: 'task-2',
    title: 'Implement Database Migration & Schema Setup',
    description: 'Configure initial database migration scripts and set up ORM models for core entities.',
    categoryId: 'cat-1',
    assigneeId: 'user-1',
    status: 'in_progress',
    priority: 'high',
    plannedStart: '2026-06-26T10:00',
    plannedEnd: '2026-06-28T18:00',
    actualStart: '2026-06-26T10:05',
    createdAt: '2026-06-25T08:00:00Z',
  },
  {
    id: 'task-3',
    title: 'Set Up Email Marketing Campaign',
    description: 'Write copy and design template for the product launch announcement email. Send to target list.',
    categoryId: 'cat-2',
    assigneeId: 'user-2',
    status: 'todo',
    priority: 'medium',
    plannedStart: '2026-06-28T09:00',
    plannedEnd: '2026-06-29T12:00',
    createdAt: '2026-06-26T11:00:00Z',
  },
  {
    id: 'task-4',
    title: 'Weekly Sprint Retrospective',
    description: 'Review the last sprint achievements, discuss velocity metrics, and plan action items.',
    categoryId: 'cat-4',
    assigneeId: 'user-4',
    status: 'completed',
    priority: 'low',
    plannedStart: '2026-06-26T14:00',
    plannedEnd: '2026-06-26T15:00',
    actualStart: '2026-06-26T14:02',
    completedAt: '2026-06-26T14:58',
    createdAt: '2026-06-25T15:00:00Z',
  },
  {
    id: 'task-5',
    title: 'Prepare Monthly Financial Report',
    description: 'Consolidate all operational expenses, revenue sheets, and run projections for next quarter.',
    categoryId: 'cat-4',
    assigneeId: 'user-2',
    status: 'todo',
    priority: 'high',
    plannedStart: '2026-06-29T09:00',
    plannedEnd: '2026-06-30T17:00',
    createdAt: '2026-06-26T16:30:00Z',
  }
];
