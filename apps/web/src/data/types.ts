import type { TASK_PRIORITIES, TASK_STATUSES } from './constants';

export type Priority = (typeof TASK_PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export interface Deadline {
  dueDate: string;
  dueTime: string;
}
export interface DemoProject {
  id: string;
  name: string;
  description: string;
}
export interface DemoTask extends Deadline {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignee: string;
  priority: Priority;
  status: TaskStatus;
  completedAt: string | null;
}
export interface DemoSubtask extends Deadline {
  id: string;
  taskId: string;
  title: string;
  notes: string;
  assignee: string;
  priority: Priority;
  completed: boolean;
}
export interface DemoProfile {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  avatar: string | null;
  timezone: string;
  weekStartsOn: 'Monday' | 'Sunday';
  assignmentEmails: boolean;
  dailySummary: boolean;
}
export interface Workspace {
  version: 1;
  projects: DemoProject[];
  tasks: DemoTask[];
  subtasks: DemoSubtask[];
  profile: DemoProfile;
}
export type ProjectInput = Omit<DemoProject, 'id'>;
export type TaskInput = Omit<DemoTask, 'id' | 'completedAt'>;
export type SubtaskInput = Omit<DemoSubtask, 'id' | 'taskId'>;
export interface FrontendDataSource {
  load(): Promise<Workspace>;
  reset(): Promise<Workspace>;
  createProject(input: ProjectInput): Promise<Workspace>;
  updateProject(id: string, input: ProjectInput): Promise<Workspace>;
  deleteProject(id: string): Promise<Workspace>;
  createTask(input: TaskInput, drafts: SubtaskInput[]): Promise<Workspace>;
  updateTask(id: string, input: TaskInput): Promise<Workspace>;
  deleteTask(id: string): Promise<Workspace>;
  createSubtask(taskId: string, input: SubtaskInput): Promise<Workspace>;
  updateSubtask(id: string, input: SubtaskInput): Promise<Workspace>;
  deleteSubtask(id: string): Promise<Workspace>;
  saveProfile(input: DemoProfile): Promise<Workspace>;
}
