import type { TaskStatus } from '../types/task';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  planning: 'Planning',
  executing: 'Executing',
  awaiting_approval: 'Awaiting Approval',
  approved: 'Approved',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const ACTIVE_TASK_STATUSES: TaskStatus[] = [
  'pending',
  'planning',
  'executing',
  'awaiting_approval',
];
