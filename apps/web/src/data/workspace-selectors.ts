import { compareDeadlines, deadlineKey, localClock } from './dates';
import type { DemoTask, Workspace } from './types';

export function getProjectTasks(workspace: Workspace, projectId?: string) {
  return workspace.tasks.filter((task) => task.projectId === projectId);
}

export function getProjectSummary(workspace: Workspace, projectId?: string) {
  const tasks = getProjectTasks(workspace, projectId);
  const completed = tasks.filter((task) => task.status === 'Complete').length;
  const total = tasks.length;
  return {
    tasks,
    total,
    completed,
    progress: total ? Math.round((completed / total) * 100) : 0,
  };
}

export function getTaskSubtasks(workspace: Workspace, taskId?: string) {
  return workspace.subtasks.filter((subtask) => subtask.taskId === taskId);
}

export function getSubtaskSummary(workspace: Workspace, taskId?: string) {
  const subtasks = getTaskSubtasks(workspace, taskId);
  const completed = subtasks.filter((subtask) => subtask.completed).length;
  return { subtasks, total: subtasks.length, completed };
}

type TaskFilters = {
  query?: string;
  projectId?: string;
  status?: string;
  priority?: string;
};

export function getFilteredTasks(
  tasks: readonly DemoTask[],
  filters: TaskFilters,
) {
  const query = (filters.query ?? '').toLowerCase();
  return tasks
    .filter(
      (task) =>
        task.title.toLowerCase().includes(query) &&
        (!filters.projectId || task.projectId === filters.projectId) &&
        (!filters.status || task.status === filters.status) &&
        (!filters.priority || task.priority === filters.priority),
    )
    .sort(compareDeadlines);
}

export function dashboard(workspace: Workspace, now: Date) {
  const clock = localClock(now, workspace.profile.timezone);
  const pending = workspace.tasks.filter((task) => task.status !== 'Complete');
  const today = pending
    .filter((task) => task.dueDate === clock.date)
    .sort(compareDeadlines);
  const overdue = pending
    .filter(
      (task) =>
        deadlineKey(task) && deadlineKey(task) < `${clock.date}T${clock.time}`,
    )
    .sort(compareDeadlines);
  const upcoming = pending
    .filter(
      (task) =>
        deadlineKey(task) && deadlineKey(task) >= `${clock.date}T${clock.time}`,
    )
    .sort(compareDeadlines);
  const done = workspace.tasks.filter(
    (task) =>
      task.status === 'Complete' &&
      task.completedAt &&
      localClock(new Date(task.completedAt), workspace.profile.timezone)
        .date === clock.date,
  );
  return {
    clock,
    today,
    overdue,
    done,
    next: upcoming[0] ?? overdue[0] ?? pending[0],
  };
}
