import { seedWorkspace } from '../../src/data/seed';
import type { Workspace } from '../../src/data/types';

export const GRAPH_NOW = new Date('2026-10-22T00:00:00Z');
const id = (index: number) =>
  `00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}`;

export function graphFixture(taskCount = 9, subtasksPerTask = 5): Workspace {
  const seed = seedWorkspace(GRAPH_NOW);
  const titles = [
    'Review dashboard wireframes',
    'Refine navigation',
    'Build task editor',
    'Verify database queries',
    'Resolve auth edge cases',
    'Publish API documentation',
    'Plan next milestone',
    'Send progress report',
    'Prepare project showcase',
  ];
  const projects = [
    'Interface system',
    'Task tracker API',
    'Bootcamp portfolio',
  ].map((name, index) => ({ id: id(index + 1), name, description: '' }));
  const tasks = Array.from({ length: taskCount }, (_, index) => ({
    ...seed.tasks[0]!,
    id: id(100 + index),
    projectId: projects[Math.floor(index / 3) % 3]!.id,
    title: titles[index] ?? `Task ${String(index).padStart(3, '0')}`,
    dueDate: index % 4 === 2 ? '2026-10-20' : '2026-10-23',
    dueTime: index % 4 === 0 ? '' : '11:00',
    status: (['In progress', 'Complete', 'To do'] as const)[index % 3]!,
    completedAt: index % 3 === 1 ? GRAPH_NOW.toISOString() : null,
  }));
  const subtasks = tasks.flatMap((task, index) =>
    Array.from({ length: subtasksPerTask }, (_, subIndex) => ({
      ...seed.subtasks[0]!,
      id: id(10000 + index * subtasksPerTask + subIndex),
      taskId: task.id,
      title:
        index === 0
          ? ([
              'Audit desktop layout',
              'Review empty states',
              'Review mobile layout',
              'Check contrast',
              'Review navigation',
            ][subIndex] ?? `Step ${subIndex}`)
          : `Step ${subIndex + 1} for ${task.title}`,
      dueDate: '',
      dueTime: '',
      completed: subIndex % 3 === 0,
    })),
  );
  return { ...seed, projects, tasks, subtasks };
}
