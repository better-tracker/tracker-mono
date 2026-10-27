import { expect, test } from '@playwright/test';
import type { ProjectResponse, TaskResponse } from '@project-tracker/contracts';

test('@api graph uses server tasks and task-subtasks with filters, inspector and existing routes', async ({
  page,
  request,
}) => {
  const api = 'http://127.0.0.1:3001/v1/projects';
  const response = await request.post(api, {
    data: { name: `Graph browser check ${Date.now()}`, description: '' },
  });
  expect(response.ok()).toBe(true);
  const project = (await response.json()) as ProjectResponse;
  const taskInput = {
    title: 'Graph API task',
    description: '',
    assignee: 'Browser reviewer',
    priority: 'High',
    status: 'In progress',
    dueDate: '2020-01-01',
    dueTime: '',
    completedAt: null,
  };
  const tasks: TaskResponse[] = [];
  try {
    for (const title of ['Graph API task', 'Other task']) {
      const taskResponse = await request.post(`${api}/${project.id}/tasks`, {
        data: { ...taskInput, title },
      });
      expect(taskResponse.ok()).toBe(true);
      tasks.push((await taskResponse.json()) as TaskResponse);
    }
    const task = tasks[0]!;
    for (const [index, title] of [
      'First server step',
      'Second server step',
    ].entries()) {
      const subtask = await request.post(
        `${api}/${project.id}/tasks/${task.id}/subtasks`,
        {
          data: {
            title,
            notes: '',
            assignee: '',
            priority: 'Low',
            completed: index === 0,
            dueDate: '',
            dueTime: '',
          },
        },
      );
      expect(subtask.ok()).toBe(true);
    }
    await page.addInitScript(() =>
      localStorage.setItem('project-tracker.session.v1', 'demo'),
    );
    await page.goto(`/graph?project=${project.id}&q=graph&status=Overdue`);
    await expect(
      page.getByRole('heading', { name: 'graph.' }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Interactive work graph' }),
    ).toHaveAttribute('data-label-opacity', '1.000');
    const inspector = page.getByRole('complementary', {
      name: 'Selected task',
    });
    await expect(inspector.getByRole('heading', { level: 2 })).toHaveText(
      'Graph API task',
    );
    await expect(inspector.getByText('1 / 2 done')).toBeVisible();
    await expect(inspector.getByText('Browser reviewer')).toBeVisible();
    await expect(inspector.getByText('Overdue', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'List', exact: true }).click();
    const list = page.getByRole('list', { name: 'Graph task results' });
    await expect(list.locator(':scope > li')).toHaveCount(1);
    await list.getByRole('button', { name: /Second server step/ }).click();
    await expect(inspector.getByText('Selected subtask')).toBeVisible();
    await page
      .getByRole('combobox', { name: 'Filter status' })
      .selectOption('In progress');
    await expect(list.locator(':scope > li')).toHaveCount(1);
    await inspector.getByRole('link', { name: 'Open Task →' }).click();
    await expect(page).toHaveURL(`/tasks/${task.id}`);
    await expect(
      page.getByRole('checkbox', { name: 'First server step' }),
    ).toBeChecked();
    await page.goto(`/graph?project=${project.id}`);
    await page.getByRole('link', { name: '+ New Task' }).click();
    await expect(page).toHaveURL(`/tasks/new?project=${project.id}`);
    await expect(page.getByLabel('Project', { exact: false })).toHaveValue(
      project.id,
    );
  } finally {
    for (const task of tasks)
      await request.delete(`${api}/${project.id}/tasks/${task.id}`);
    await request.delete(`${api}/${project.id}`);
  }
});
