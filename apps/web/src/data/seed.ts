import { addDays, localClock } from './dates';
import type { DemoTask, Workspace } from './types';

export function seedWorkspace(now: Date): Workspace {
  const today = localClock(now, 'Australia/Melbourne').date;
  const projectIds = [
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
  ];
  const task = (
    title: string,
    project: number,
    days: number,
    dueTime: string,
    status: DemoTask['status'] = 'To do',
  ): DemoTask => ({
    id: crypto.randomUUID(),
    title,
    projectId: projectIds[project]!,
    description: '',
    assignee: 'Ben Morgan',
    dueDate: addDays(today, days),
    dueTime,
    priority: 'High',
    status,
    completedAt: status === 'Complete' ? now.toISOString() : null,
  });
  const tasks = [
    task('Review dashboard wireframes', 0, 0, '11:00', 'In progress'),
    task('Send weekly progress report', 1, 0, '14:30'),
    task('Finalize onboarding copy', 2, 0, '16:00'),
    task('Publish API documentation', 0, -1, '17:00'),
    task('Resolve authentication edge cases', 0, -2, '17:00'),
    task('Map the first user journey', 0, 0, '09:00', 'Complete'),
  ];
  tasks[0]!.description =
    'Review layout, hierarchy and accessibility across devices.';
  return {
    version: 1,
    projects: [
      'Interface system',
      'Bootcamp portfolio',
      'Application redesign',
    ].map((name, index) => ({
      id: projectIds[index]!,
      name,
      description:
        index === 0 ? 'Design / dashboard' : 'Make room for meaningful work.',
    })),
    tasks,
    subtasks: ['Audit desktop layout', 'Review empty states'].map(
      (title, index) => ({
        id: crypto.randomUUID(),
        taskId: tasks[0]!.id,
        title,
        notes: '',
        assignee: 'Ben Morgan',
        priority: 'High',
        dueDate: today,
        dueTime: '10:30',
        completed: index === 0,
      }),
    ),
    profile: {
      firstName: 'Ben',
      lastName: 'Morgan',
      email: 'ben@example.com',
      bio: 'Building useful things, one small task at a time.',
      avatar: null,
      timezone: 'Australia/Melbourne',
      weekStartsOn: 'Monday',
      assignmentEmails: true,
      dailySummary: true,
    },
  };
}
