import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

test('account explanations, dialog keyboard focus, corrupt-storage recovery and reset work', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('dialog')).toContainText('browser demo');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await login(page);
  await page.goto('/projects');
  const create = page.getByRole('button', { name: '+ NEW PROJECT' });
  await create.click();
  await expect(page.getByLabel('Project name', { exact: false })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(create).toBeFocused();
  await page.evaluate(() =>
    localStorage.setItem('project-tracker.workspace.v1', '{corrupt'),
  );
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'A SMALL SETBACK.' }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('unreadable');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem('project-tracker.workspace.v1'),
    ),
  ).toBe('{corrupt');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('heading', { name: 'PROJECTS.' })).toBeVisible();
  await page.goto('/profile');
  await page.getByLabel('First name', { exact: false }).fill('Before reset');
  await page.getByRole('button', { name: 'SAVE CHANGES' }).click();
  await page.getByRole('button', { name: 'RESET DEMO' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Reset demo' })
    .click();
  await page.goto('/profile');
  await expect(page.getByLabel('First name', { exact: false })).toHaveValue(
    'Ben',
  );
});

async function login(page: Page, remember = true) {
  await page.goto('/login');
  await page.getByLabel('Password', { exact: true }).fill('demo-password');
  await page.getByLabel('Keep me signed in').setChecked(remember);
  await page.getByRole('button', { name: 'SIGN IN' }).click();
  await expect(page.getByRole('heading', { name: 'TODAY.' })).toBeVisible();
}

test('creates a project and task with subtasks, persists completion, edits and cascades deletion', async ({
  page,
}) => {
  await login(page);
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Projects' })
    .click();
  await page.getByRole('button', { name: '+ NEW PROJECT' }).click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByLabel('Project name', { exact: false })
    .fill('Browser test project');
  await dialog.getByLabel('Project description').fill('A persistent workflow');
  await dialog.getByRole('button', { name: 'CREATE PROJECT' }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('link', { name: 'Browser test project' }).click();
  await page.getByRole('link', { name: '+ NEW TASK' }).first().click();
  await page
    .getByLabel('Task title', { exact: false })
    .fill('Browser test task');
  await page.getByRole('button', { name: '+ ADD SUBTASK' }).click();
  await page
    .getByLabel('Draft subtask 1', { exact: true })
    .fill('First browser step');
  await page.getByRole('button', { name: 'CREATE TASK' }).click();
  await page
    .getByRole('link', { name: 'Browser test task', exact: true })
    .click();
  await page.getByRole('checkbox', { name: 'First browser step' }).check();
  await expect(page.getByLabel('Task status')).toHaveValue('To do');
  await page.reload();
  await expect(
    page.getByRole('checkbox', { name: 'First browser step' }),
  ).toBeChecked();
  await page.getByRole('link', { name: '+ ADD SUBTASK' }).click();
  await page
    .getByLabel('Subtask title', { exact: false })
    .fill('Second browser step');
  await page.getByRole('button', { name: 'CREATE SUBTASK' }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Second browser step' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'EDIT TASK' }).click();
  await page
    .getByLabel('Task title', { exact: false })
    .fill('Edited browser task');
  await page.getByRole('button', { name: 'SAVE TASK' }).click();
  await page.getByLabel('Task status').selectOption('Complete');
  await page.reload();
  await expect(page.getByLabel('Task status')).toHaveValue('Complete');
  await page.getByRole('link', { name: 'Browser test project' }).click();
  await page.getByRole('button', { name: 'DELETE PROJECT' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirm deletion' })
    .click();
  await expect(page.getByRole('heading', { name: 'PROJECTS.' })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Tasks', exact: true })
    .click();
  await expect(
    page.getByRole('link', { name: 'Edited browser task', exact: true }),
  ).toHaveCount(0);
});

test('rejects a subtask deadline equal to its parent, allows correction, editing and deletion', async ({
  page,
}) => {
  await login(page);
  await page
    .getByRole('link', { name: 'Review dashboard wireframes', exact: true })
    .first()
    .click();
  await page.getByRole('link', { name: '+ ADD SUBTASK' }).click();
  await page
    .getByLabel('Subtask title', { exact: false })
    .fill('Check deadline behaviour');
  const parentDate = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('project-tracker.workspace.v1')!).tasks[0]
        .dueDate as string,
  );
  await page.getByLabel('Due date').fill(parentDate);
  await page.getByLabel('Due time').fill('11:00');
  await page.getByRole('button', { name: 'CREATE SUBTASK' }).click();
  await expect(page.getByRole('alert')).toContainText('before the parent');
  await expect(page.getByLabel('Subtask title', { exact: false })).toHaveValue(
    'Check deadline behaviour',
  );
  await page.getByLabel('Due time').fill('10:00');
  await page.getByRole('button', { name: 'CREATE SUBTASK' }).click();
  const row = page
    .locator('.subtask-row')
    .filter({ hasText: 'Check deadline behaviour' });
  await row.getByRole('link', { name: 'Edit' }).click();
  await page
    .getByLabel('Subtask title', { exact: false })
    .fill('Edited deadline step');
  await page.getByRole('button', { name: 'SAVE SUBTASK' }).click();
  await page
    .locator('.subtask-row')
    .filter({ hasText: 'Edited deadline step' })
    .getByRole('button', { name: 'Delete' })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirm deletion' })
    .click();
  await expect(
    page.getByRole('checkbox', { name: 'Edited deadline step' }),
  ).toHaveCount(0);
});

test('saves profile, supports avatar and preferences, remembers session and signs out', async ({
  page,
  browser,
}) => {
  await login(page);
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Profile' })
    .click();
  await page.getByLabel('First name', { exact: false }).fill('Alex');
  await page.getByLabel('Bio', { exact: true }).fill('Saved profile');
  await page.getByLabel('Timezone').selectOption('UTC');
  await page.getByLabel('Send a daily deadline summary').uncheck();
  await page.getByLabel('Choose avatar').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: await page.locator('.avatar').screenshot(),
  });
  await expect(page.getByRole('img', { name: 'Your avatar' })).toBeVisible();
  await page.getByRole('button', { name: 'SAVE CHANGES' }).click();
  await expect(page.getByRole('status')).toContainText('saved');
  await page.reload();
  await expect(page.getByLabel('First name', { exact: false })).toHaveValue(
    'Alex',
  );
  await expect(
    page.getByLabel('Send a daily deadline summary'),
  ).not.toBeChecked();
  await expect(page.getByRole('img', { name: 'Your avatar' })).toBeVisible();
  const stored = await page.context().storageState();
  const secondContext = await browser.newContext({ storageState: stored });
  const second = await secondContext.newPage();
  await second.goto('http://127.0.0.1:3000/profile');
  await expect(
    second.getByRole('heading', { name: 'YOUR PROFILE.' }),
  ).toBeVisible();
  await secondContext.close();
  await page.getByRole('button', { name: 'SIGN OUT' }).click();
  await expect(page.getByRole('button', { name: 'SIGN IN' })).toBeVisible();
  await page.goto('/tasks');
  await expect(page.getByRole('button', { name: 'SIGN IN' })).toBeVisible();
});

test('unremembered sessions do not transfer to a fresh browser context; links and missing routes work', async ({
  page,
  browser,
}) => {
  await login(page, false);
  const secondContext = await browser.newContext({
    storageState: await page.context().storageState(),
  });
  const second = await secondContext.newPage();
  await second.goto('http://127.0.0.1:3000/');
  await expect(second.getByRole('button', { name: 'SIGN IN' })).toBeVisible();
  await secondContext.close();
  await page.goto('/tasks');
  await page.getByLabel('Search tasks').fill('no matching record');
  await expect(page.getByText('No tasks match these filters.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page
    .getByRole('link', { name: 'Review dashboard wireframes', exact: true })
    .click();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'TASKS.' })).toBeVisible();
  await page.goForward();
  await expect(page.getByLabel('Task status')).toBeVisible();
  await page.goto('/missing-page');
  await expect(page.getByRole('heading', { name: 'NOT HERE.' })).toBeVisible();
  await page.getByRole('link', { name: 'Return to Today' }).click();
  await expect(page.getByRole('heading', { name: 'TODAY.' })).toBeVisible();
});
