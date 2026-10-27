// Cross-platform API client; keep this package platform-independent.
export * from './users.js';

import {
  projectListItemSchema,
  projectListResponseSchema,
  projectResponseSchema,
  subtaskListResponseSchema,
  subtaskResponseSchema,
  taskResponseSchema,
  taskListResponseSchema,
  taskSubtaskResponseSchema,
  taskSubtaskListResponseSchema,
  type ProjectListResponse,
  type ProjectCreate,
  type ProjectUpdate,
  type SubtaskListResponse,
  type SubtaskCreate,
  type SubtaskResponse,
  type SubtaskUpdate,
  type TaskCreate,
  type TaskUpdate,
  type TaskListResponse,
  type TaskSubtaskCreate,
  type TaskSubtaskUpdate,
  type TaskSubtaskResponse,
  type TaskSubtaskListResponse,
} from '@project-tracker/contracts';

import { parseResponse, request } from './http_helper.js';

/* Projects */

// Get a list of projects with optional pagination.
export const getProjects = async (
  baseUrl: string,
  limit = 40,
  offset = 0,
): Promise<ProjectListResponse> => {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  const path = `/v1/projects?${params.toString()}`;
  const response = await request<unknown>(baseUrl, path);

  return parseResponse(
    `GET ${path}`,
    projectListResponseSchema,
    response,
  );
};

// Get a single project by ID.
export const getProject = async (
  baseUrl: string,
  id: string,
) => {
  const path = `/v1/projects/${encodeURIComponent(id)}`;
  const response = await request<unknown>(baseUrl, path);

  return parseResponse(
    `GET ${path}`,
    projectResponseSchema,
    response,
  );
};

// Create a new project.
export const createProject = async (
  baseUrl: string,
  data: ProjectCreate,
) => {
  const path = '/v1/projects';
  const response = await request<unknown>(
    baseUrl,
    path,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  return parseResponse(
    'POST /v1/projects',
    projectListItemSchema,
    response,
  );
};

// Update an existing project.
export const updateProject = async (
  baseUrl: string,
  id: string,
  data: ProjectUpdate,
) => {
  const path = `/v1/projects/${encodeURIComponent(id)}`;
  const response = await request<unknown>(
    baseUrl,
    path,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  return parseResponse(
    `PUT ${path}`,
    projectListItemSchema,
    response,
  );
};

// Delete a project by ID.
export const deleteProject = async (
  baseUrl: string,
  id: string,
): Promise<void> => {
  const path = `/v1/projects/${encodeURIComponent(id)}`;

  await request<void>(
    baseUrl,
    path,
    {
      method: 'DELETE',
    },
  );
};

/* Subtasks */

// Get a list of subtasks for a specific project.
export const getSubtasks = async (
  baseUrl: string,
  projectId: string,
  limit = 40,
  offset = 0,
): Promise<SubtaskListResponse> => {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  const path = `/v1/projects/${encodeURIComponent(projectId)}/subtasks?${params.toString()}`;
  const response = await request<unknown>(baseUrl, path);

  return parseResponse(
    `GET ${path}`,
    subtaskListResponseSchema,
    response,
  );
};

// Create a new subtask for a specific project.
export const createSubtask = async (
  baseUrl: string,
  projectId: string,
  data: SubtaskCreate,
): Promise<SubtaskResponse> => {
  const path = `/v1/projects/${encodeURIComponent(projectId)}/subtasks`;

  const response = await request<unknown>(
    baseUrl,
    path,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  return parseResponse(
    `POST ${path}`,
    subtaskResponseSchema,
    response,
  );
};

// Get a single subtask by ID.
export const getSubtask = async (
  baseUrl: string,
  projectId: string,
  id: string,
): Promise<SubtaskResponse> => {
  const path = `/v1/projects/${encodeURIComponent(projectId)}/subtasks/${encodeURIComponent(id)}`;
  const response = await request<unknown>(baseUrl, path);

  return parseResponse(
    `GET ${path}`,
    subtaskResponseSchema,
    response,
  );
};

// Update an existing subtask.
export const updateSubtask = async (
  baseUrl: string,
  projectId: string,
  id: string,
  data: SubtaskUpdate,
): Promise<SubtaskResponse> => {
  const path = `/v1/projects/${encodeURIComponent(projectId)}/subtasks/${encodeURIComponent(id)}`;

  const response = await request<unknown>(
    baseUrl,
    path,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  return parseResponse(
    `PUT ${path}`,
    subtaskResponseSchema,
    response,
  );
};

// Delete a subtask by ID.
export const deleteSubtask = async (
  baseUrl: string,
  projectId: string,
  id: string,
): Promise<void> => {
  const path = `/v1/projects/${encodeURIComponent(projectId)}/subtasks/${encodeURIComponent(id)}`;

  await request<void>(
    baseUrl,
    path,
    {
      method: 'DELETE',
    },
  );
};

/* Tasks */

// Get a list of tasks belonging to a project.
export const getTasks = async (
  baseUrl: string,
  projectId: string,
): Promise<TaskListResponse> => {
  const path = `/v1/projects/${encodeURIComponent(projectId)}/tasks`;
  const response = await request<unknown>(baseUrl, path);

  return parseResponse(
    `GET ${path}`,
    taskListResponseSchema,
    response,
  );
};

// Get a single task.
export const getTask = async (
  baseUrl: string,
  projectId: string,
  taskId: string,
) => {
  const path = `/v1/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`;
  const response = await request<unknown>(baseUrl, path);

  return parseResponse(
    `GET ${path}`,
    taskResponseSchema,
    response,
  );
};

// Create a task.
export const createTask = async (
  baseUrl: string,
  projectId: string,
  data: TaskCreate,
) => {
  const path = `/v1/projects/${encodeURIComponent(projectId)}/tasks`;

  const response = await request<unknown>(
    baseUrl,
    path,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  return parseResponse(
    `POST ${path}`,
    taskResponseSchema,
    response,
  );
};

// Update a task.
export const updateTask = async (
  baseUrl: string,
  projectId: string,
  taskId: string,
  data: TaskUpdate,
) => {
  const path = `/v1/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`;

  const response = await request<unknown>(
    baseUrl,
    path,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  return parseResponse(
    `PUT ${path}`,
    taskResponseSchema,
    response,
  );
};

// Delete a task.
export const deleteTask = async (
  baseUrl: string,
  projectId: string,
  taskId: string,
): Promise<void> => {
  const path = `/v1/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`;

  await request<void>(
    baseUrl,
    path,
    {
      method: 'DELETE',
    },
  );
};

/* Task subtasks */

// Get task subtasks.
export const getTaskSubtasks = async (
  baseUrl: string,
  projectId: string,
  taskId: string,
): Promise<TaskSubtaskListResponse> => {
  const path = `/v1/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/subtasks`;
  const response = await request<unknown>(baseUrl, path);

  return parseResponse(
    `GET ${path}`,
    taskSubtaskListResponseSchema,
    response,
  );
};

// Get a single task subtask.
export const getTaskSubtask = async (
  baseUrl: string,
  projectId: string,
  taskId: string,
  subtaskId: string,
): Promise<TaskSubtaskResponse> => {
  const path = `/v1/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}`;
  const response = await request<unknown>(baseUrl, path);

  return parseResponse(
    `GET ${path}`,
    taskSubtaskResponseSchema,
    response,
  );
};

// Create a task subtask.
export const createTaskSubtask = async (
  baseUrl: string,
  projectId: string,
  taskId: string,
  data: TaskSubtaskCreate,
): Promise<TaskSubtaskResponse> => {
  const path = `/v1/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/subtasks`;

  const response = await request<unknown>(
    baseUrl,
    path,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  return parseResponse(
    `POST ${path}`,
    taskSubtaskResponseSchema,
    response,
  );
};

// Update a task subtask.
export const updateTaskSubtask = async (
  baseUrl: string,
  projectId: string,
  taskId: string,
  subtaskId: string,
  data: TaskSubtaskUpdate,
): Promise<TaskSubtaskResponse> => {
  const path = `/v1/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}`;

  const response = await request<unknown>(
    baseUrl,
    path,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  return parseResponse(
    `PUT ${path}`,
    taskSubtaskResponseSchema,
    response,
  );
};

// Delete a task subtask.
export const deleteTaskSubtask = async (
  baseUrl: string,
  projectId: string,
  taskId: string,
  subtaskId: string,
): Promise<void> => {
  const path = `/v1/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}`;

  await request<void>(
    baseUrl,
    path,
    {
      method: 'DELETE',
    },
  );
};