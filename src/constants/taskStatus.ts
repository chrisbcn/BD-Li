/**
 * Task status constants
 * Centralized definition of all valid task statuses
 */
export const TASK_STATUS = {
  INCOMING: 'incoming',
  TODO: 'todo',
  DONE: 'done',
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

/**
 * Valid task statuses array for validation
 */
export const VALID_TASK_STATUSES: TaskStatus[] = Object.values(TASK_STATUS);

/**
 * Default recurrence period in days
 */
export const DEFAULT_RECURRENCE_DAYS = 7;

