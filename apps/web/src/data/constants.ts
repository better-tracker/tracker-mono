import { MAX_PROJECT_NAME_LENGTH } from '@project-tracker/contracts';

export const TASK_PRIORITIES = ['Low', 'Medium', 'High'] as const;
export const TASK_STATUSES = ['To do', 'In progress', 'Complete'] as const;

// Demo task and subtask titles are validated with projectNameSchema.
export const MAX_TASK_TITLE_LENGTH = MAX_PROJECT_NAME_LENGTH;
export const MAX_SUBTASK_TITLE_LENGTH = MAX_PROJECT_NAME_LENGTH;
export const MAX_TASK_DESCRIPTION_LENGTH = 2000;
export const MAX_SUBTASK_NOTES_LENGTH = 2000;
export const MAX_PROFILE_NAME_LENGTH = 100;
export const MAX_PROFILE_BIO_LENGTH = 2000;

export const MAX_AVATAR_SIZE_MB = 1;
export const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const WORKSPACE_CLOCK_INTERVAL_MS = 30000;
export const MILLISECONDS_PER_DAY = 86400000;
