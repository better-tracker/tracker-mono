import type { FastifyReply, FastifyRequest } from 'fastify';

import type {
  TaskCreate,
  TaskUpdate,
  TaskParams,
  TaskCollectionParams,
} from '@project-tracker/contracts';

import type { Task } from '@project-tracker/database';

import {
  tasksService,
  type TasksService,
} from './tasks.service.js';

// Convert PostgreSQL fields into frontend-friendly fields.
function formatTask(task: Task) {
  return {
    id: task.id,
    projectId: task.project_id,
    title: task.title,
    description: task.description,
    assignee: task.assignee,
    priority: task.priority,
    status: task.status,
    dueDate: task.due_date,
    dueTime: task.due_time,
    completedAt: task.completed_at?.toISOString() ?? null,
    createdAt: task.created_at.toISOString(),
    updatedAt: task.updated_at.toISOString(),
  };
}

export function createTasksController(
  service: TasksService = tasksService,
) {
  return {
    // GET /v1/projects/:projectId/tasks
    getTasks: async (
      request: FastifyRequest<{
        Params: TaskCollectionParams;
      }>,
      reply: FastifyReply,
    ) => {
      const tasks = await service.getTasks(
        request.params.projectId,
      );

      return reply.code(200).send(tasks.map(formatTask));
    },

    // GET /v1/projects/:projectId/tasks/:id
    getTask: async (
      request: FastifyRequest<{
        Params: TaskParams;
      }>,
      reply: FastifyReply,
    ) => {
      const task = await service.getTask(request.params.id);

      if (!task || task.project_id !== request.params.projectId) {
        return reply.code(404).send({
          message: 'Task not found',
        });
      }

      return reply.code(200).send(formatTask(task));
    },

    // POST /v1/projects/:projectId/tasks
    createTask: async (
      request: FastifyRequest<{
        Params: TaskCollectionParams;
        Body: TaskCreate;
      }>,
      reply: FastifyReply,
    ) => {
      const task = await service.createTask(
        request.params.projectId,
        request.body,
      );

      return reply.code(201).send(formatTask(task));
    },

    // PUT /v1/projects/:projectId/tasks/:id
    updateTask: async (
      request: FastifyRequest<{
        Params: TaskParams;
        Body: TaskUpdate;
      }>,
      reply: FastifyReply,
    ) => {
      const existingTask = await service.getTask(
        request.params.id,
      );

      if (
        !existingTask ||
        existingTask.project_id !== request.params.projectId
      ) {
        return reply.code(404).send({
          message: 'Task not found',
        });
      }

      const task = await service.updateTask(
        request.params.id,
        request.body,
      );

      if (!task) {
        return reply.code(404).send({
          message: 'Task not found',
        });
      }

      return reply.code(200).send(formatTask(task));
    },

    // DELETE /v1/projects/:projectId/tasks/:id
    deleteTask: async (
      request: FastifyRequest<{
        Params: TaskParams;
      }>,
      reply: FastifyReply,
    ) => {
      const existingTask = await service.getTask(
        request.params.id,
      );

      if (
        !existingTask ||
        existingTask.project_id !== request.params.projectId
      ) {
        return reply.code(404).send({
          message: 'Task not found',
        });
      }

      const deleted = await service.deleteTask(
        request.params.id,
      );

      if (!deleted) {
        return reply.code(404).send({
          message: 'Task not found',
        });
      }

      return reply.code(204).send();
    },
  };
}