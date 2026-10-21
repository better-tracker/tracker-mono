import {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    getSubtasks,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    getTaskSubtasks,
    getTaskSubtask,
    createTaskSubtask,
    updateTaskSubtask,
    deleteTaskSubtask,
} from '@project-tracker/api-client';

import type {
    DemoProject,
    ProjectInput,
} from './types';

import type {
    TaskCreate,
    TaskUpdate,
    TaskSubtaskCreate,
    TaskSubtaskUpdate,
} from '@project-tracker/contracts';

const API_URL =
    import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export async function loadApiProjects(): Promise<DemoProject[]> {
    const projects = await getProjects(API_URL);

    return projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description ?? '',
    }));
}

export async function createApiProject(
    input: ProjectInput,
): Promise<DemoProject> {
    const project = await createProject(API_URL, {
        name: input.name.trim(),
        description: input.description,
    });

    return {
        id: project.id,
        name: project.name,
        description: project.description ?? ''
    };
}

// update existing project through backend
export async function updateApiProject(
    id: string,
    input: ProjectInput,
): Promise<DemoProject> {
    const project = await updateProject(API_URL, id, {
        name: input.name.trim(),
        description: input.description,
    });

    return {
        id: project.id,
        name: project.name,
        description: project.description ?? '',
    };
}

// delete project through backend
export async function deleteApiProject(
    id: string,
): Promise<void> {
    await deleteProject(API_URL, id);
}

import type {
    SubtaskCreate,
    SubtaskUpdate,
} from '@project-tracker/contracts';

// load subtasks belonging to project
export async function loadApiSubtasks(projectId: string) {
    return getSubtasks(API_URL, projectId);
}

// create subtask
export async function createApiSubtask(
    projectId: string,
    input: SubtaskCreate,
) {
    return createSubtask(API_URL, projectId, input);
}

// update subtask
export async function updateApiSubtask(
    projectId: string,
    subtaskId: string,
    input: SubtaskUpdate,
) {
    return updateSubtask(API_URL, projectId, subtaskId, input);
}

// delete subtask
export async function deleteApiSubtask(
    projectId: string,
    subtaskId: string,
): Promise<void> {
    await deleteSubtask(API_URL, projectId, subtaskId);
}

// Tasks belonging to a project.
export async function loadApiTasks(projectId: string) {
    return getTasks(API_URL, projectId);
}

export async function loadApiTask(projectId: string, taskId: string) {
    return getTask(API_URL, projectId, taskId);
}

export async function createApiTask(
    projectId: string,
    input: TaskCreate,
) {
    return createTask(API_URL, projectId, input);
}

export async function updateApiTask(
    projectId: string,
    taskId: string,
    input: TaskUpdate,
) {
    return updateTask(API_URL, projectId, taskId, input);
}

export async function deleteApiTask(
    projectId: string,
    taskId: string,
): Promise<void> {
    await deleteTask(API_URL, projectId, taskId);
}

// Subtasks belonging to a task.
export async function loadApiTaskSubtasks(
    projectId: string,
    taskId: string,
) {
    return getTaskSubtasks(API_URL, projectId, taskId);
}

export async function loadApiTaskSubtask(
    projectId: string,
    taskId: string,
    subtaskId: string,
) {
    return getTaskSubtask(API_URL, projectId, taskId, subtaskId);
}

export async function createApiTaskSubtask(
    projectId: string,
    taskId: string,
    input: TaskSubtaskCreate,
) {
    return createTaskSubtask(API_URL, projectId, taskId, input);
}

export async function updateApiTaskSubtask(
    projectId: string,
    taskId: string,
    subtaskId: string,
    input: TaskSubtaskUpdate,
) {
    return updateTaskSubtask(
        API_URL,
        projectId,
        taskId,
        subtaskId,
        input,
    );
}

export async function deleteApiTaskSubtask(
    projectId: string,
    taskId: string,
    subtaskId: string,
): Promise<void> {
    await deleteTaskSubtask(
        API_URL,
        projectId,
        taskId,
        subtaskId,
    );
}