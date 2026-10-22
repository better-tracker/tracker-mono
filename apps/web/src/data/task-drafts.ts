import type { SubtaskInput, TaskInput } from './types';

type TaskDraft = { title: string };

export function validateTaskDrafts(drafts: readonly TaskDraft[]): void {
  if (drafts.some((draft) => !draft.title.trim())) {
    throw new Error(
      'Give every draft subtask a title, or remove the empty draft.',
    );
  }
}

export function createDraftSubtasks(
  drafts: readonly TaskDraft[],
  task: Pick<TaskInput, 'assignee' | 'priority'>,
): SubtaskInput[] {
  return drafts.map((draft) => ({
    title: draft.title,
    notes: '',
    assignee: task.assignee,
    priority: task.priority,
    dueDate: '',
    dueTime: '',
    completed: false,
  }));
}
