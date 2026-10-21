import type { FastifyReply, FastifyRequest } from 'fastify';

import type {
  TaskSubtaskCreate,
  TaskSubtaskUpdate,
  TaskSubtaskParams,
  TaskSubtaskCollectionParams,
} from '@project-tracker/contracts';

import type { TaskSubtask } from '@project-tracker/database';

import {
  taskSubtasksService,
  type TaskSubtasksService,
} from './task-subtasks.service.js';

import {
  tasksService,
  type TasksService,
} from '../tasks/tasks.service.js';

function formatSubtask(subtask: TaskSubtask) {
  return {
    id: subtask.id,
    taskId: subtask.task_id,
    title: subtask.title,
    notes: subtask.notes,
    assignee: subtask.assignee,
    priority: subtask.priority,
    completed: subtask.completed,
    dueDate: subtask.due_date,
    dueTime: subtask.due_time,
    createdAt: subtask.created_at.toISOString(),
    updatedAt: subtask.updated_at.toISOString(),
  };
}

export function createTaskSubtasksController(
  service: TaskSubtasksService = taskSubtasksService,
  parentTasksService: TasksService = tasksService,
) {
  async function verifyParentTask(
    projectId: string,
    taskId: string,
    reply: FastifyReply,
  ) {
    const task = await parentTasksService.getTask(taskId);

    if (!task || task.project_id !== projectId) {
      reply.code(404).send({ message: 'Task not found' });
      return false;
    }

    return true;
  }

  return {
    getSubtasks: async (
      request: FastifyRequest<{
        Params: TaskSubtaskCollectionParams;
      }>,
      reply: FastifyReply,
    ) => {
      if (
        !(await verifyParentTask(
          request.params.projectId,
          request.params.taskId,
          reply,
        ))
      ) {
        return;
      }

      const subtasks = await service.getSubtasks(
        request.params.taskId,
      );

      return reply.code(200).send(subtasks.map(formatSubtask));
    },

    getSubtask: async (
      request: FastifyRequest<{
        Params: TaskSubtaskParams;
      }>,
      reply: FastifyReply,
    ) => {
      const { projectId, taskId, id } = request.params;

      if (!(await verifyParentTask(projectId, taskId, reply))) {
        return;
      }

      const subtask = await service.getSubtask(id);

      if (!subtask || subtask.task_id !== taskId) {
        return reply.code(404).send({
          message: 'Task subtask not found',
        });
      }

      return reply.code(200).send(formatSubtask(subtask));
    },

    createSubtask: async (
      request: FastifyRequest<{
        Params: TaskSubtaskCollectionParams;
        Body: TaskSubtaskCreate;
      }>,
      reply: FastifyReply,
    ) => {
      const { projectId, taskId } = request.params;

      if (!(await verifyParentTask(projectId, taskId, reply))) {
        return;
      }

      const subtask = await service.createSubtask(
        taskId,
        request.body,
      );

      return reply.code(201).send(formatSubtask(subtask));
    },

    updateSubtask: async (
      request: FastifyRequest<{
        Params: TaskSubtaskParams;
        Body: TaskSubtaskUpdate;
      }>,
      reply: FastifyReply,
    ) => {
      const { projectId, taskId, id } = request.params;

      if (!(await verifyParentTask(projectId, taskId, reply))) {
        return;
      }

      const existing = await service.getSubtask(id);

      if (!existing || existing.task_id !== taskId) {
        return reply.code(404).send({
          message: 'Task subtask not found',
        });
      }

      const updated = await service.updateSubtask(id, request.body);

      if (!updated) {
        return reply.code(404).send({
          message: 'Task subtask not found',
        });
      }

      return reply.code(200).send(formatSubtask(updated));
    },

    deleteSubtask: async (
      request: FastifyRequest<{
        Params: TaskSubtaskParams;
      }>,
      reply: FastifyReply,
    ) => {
      const { projectId, taskId, id } = request.params;

      if (!(await verifyParentTask(projectId, taskId, reply))) {
        return;
      }

      const existing = await service.getSubtask(id);

      if (!existing || existing.task_id !== taskId) {
        return reply.code(404).send({
          message: 'Task subtask not found',
        });
      }

      const deleted = await service.deleteSubtask(id);

      if (!deleted) {
        return reply.code(404).send({
          message: 'Task subtask not found',
        });
      }

      return reply.code(204).send();
    },
  };
}