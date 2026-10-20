// Cross-platform API client; keep this package platform-independent.
export * from './users.js';

import {
  projectListItemSchema,
  projectListResponseSchema,
  projectResponseSchema,
  subtaskListResponseSchema,
  subtaskResponseSchema,
  type ProjectListResponse,
  type ProjectCreate,
  type ProjectUpdate,
  type SubtaskListResponse,
  type SubtaskCreate,
  type SubtaskResponse,
  type SubtaskUpdate,
} from '@project-tracker/contracts';

import { request } from './http_helper.js';

/* Projects section
    Contains: 
    - getProjects - fetches a list of projects with optional pagination (jic)
    - getProject - fetches a single project by id
    - createProject - creates a new project
    - updateProject - update an existing project
    - deleteProject - delete a project by id
*/

// Get a list of projects with optional pagination
export const getProjects = async (
  baseUrl: string,
  limit = 40,
  offset = 0,
): Promise<ProjectListResponse> => {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  const response = await request<unknown>(
    baseUrl,
    `/v1/projects?${params.toString()}`,
  );

  return projectListResponseSchema.parse(response);
};

// Get a single project by ID
export const getProject = async (
  baseUrl: string,
  id: string,
) => {
  const response = await request<unknown>(
    baseUrl,
    `/v1/projects/${encodeURIComponent(id)}`,
  );

  return projectResponseSchema.parse(response);
};

// Create a new project
export const createProject = async (
  baseUrl: string,
  data: ProjectCreate,
) => {
  const response = await request<unknown>(
    baseUrl,
    '/v1/projects',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  return projectListItemSchema.parse(response);
};

// Update an existing project
export const updateProject = async (
  baseUrl: string,
  id: string,
  data: ProjectUpdate,
) => {
  const response = await request<unknown>(
    baseUrl,
    `/v1/projects/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  return projectListItemSchema.parse(response);
};

// delete a project by ID
export const deleteProject = async (
  baseUrl: string,
  id: string,
): Promise<void> => {
  await request<void>(
    baseUrl,
    `/v1/projects/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  );
};

/* Subtasks section
   Contains:
   - getSubtasks - fetches a list of subtasks with optional pagination
   - createSubtask - creates a new subtask
   - getSubtask - fetches a single subtask by id
   - updateSubtask - updates an existing subtask
   - deleteSubtask - deletes a subtask by id
   All within the context of a specific project identified by projectId
*/


// Get a list of subtasks for a specific project with optional pagination
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

  const response = await request<unknown>(
    baseUrl,
    `/v1/projects/${encodeURIComponent(projectId)}/subtasks?${params.toString()}`,
  );

  return subtaskListResponseSchema.parse(response);
};

// Create a new subtask for a specific project
export const createSubtask = async (
  baseUrl: string,
  projectId: string,
  data: SubtaskCreate,
): Promise<SubtaskResponse> => {
  const response = await request<unknown>(
    baseUrl,
    `/v1/projects/${encodeURIComponent(projectId)}/subtasks`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  return subtaskResponseSchema.parse(response);
};

// Get a single subtask by ID for a specific project
export const getSubtask = async (
  baseUrl: string,
  projectId: string,
  id: string,
): Promise<SubtaskResponse> => {
  const response = await request<unknown>(
    baseUrl,
    `/v1/projects/${encodeURIComponent(projectId)}/subtasks/${encodeURIComponent(id)}`,
  );

  return subtaskResponseSchema.parse(response);
};

// Update an existing subtask for a specific project
export const updateSubtask = async (
  baseUrl: string,
  projectId: string,
  id: string,
  data: SubtaskUpdate,
): Promise<SubtaskResponse> => {
  const response = await request<unknown>(
    baseUrl,
    `/v1/projects/${encodeURIComponent(projectId)}/subtasks/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  return subtaskResponseSchema.parse(response);
};

// Delete a subtask by ID for a specific project
export const deleteSubtask = async (
  baseUrl: string,
  projectId: string,
  id: string,
): Promise<void> => {
  await request<void>(
    baseUrl,
    `/v1/projects/${encodeURIComponent(projectId)}/subtasks/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  );
};