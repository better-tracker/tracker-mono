import { expect, test } from '@playwright/test';

test('@api loads projects from the backend', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Password', { exact: true }).fill('demo-password');

    await page.getByRole('button', { name: 'SIGN IN' }).click();

    await expect(
        page.getByRole('heading', { name: 'TODAY.' }),
    ).toBeVisible();

    await page.goto('/projects');

    await expect(
        page.getByRole('heading', { name: 'PROJECTS.' }),
    ).toBeVisible();
});

test('@api creates a project that survives a page reload', async ({ page }) => {
    const projectName = `Playwright Project ${Date.now()}`;

    await page.goto('/login');

    await page.getByLabel('Password', { exact: true }).fill('demo-password');
    await page.getByRole('button', { name: 'SIGN IN' }).click();

    await expect(
        page.getByRole('heading', { name: 'TODAY.' }),
    ).toBeVisible();

    await page.goto('/projects');

    await page.getByRole('button', { name: '+ NEW PROJECT' }).click();

    const dialog = page.getByRole('dialog');

    await dialog.getByLabel('Project name', { exact: false }).fill(projectName);
    await dialog.getByLabel('Project description').fill('API persistence test');

    await dialog.getByRole('button', { name: 'CREATE PROJECT' }).click();

    await expect(dialog).not.toBeVisible();

    await expect(
        page.getByRole('link', { name: projectName }),
    ).toBeVisible();

    await page.reload();

    await expect(
        page.getByRole('link', { name: projectName }),
    ).toBeVisible();
});

test('@api edits and deletes a project with persistence', async ({ page }) => {
    const originalName = `Edit Test ${Date.now()}`;
    const updatedName = `${originalName} Updated`;

    await page.goto('/login');
    await page.getByLabel('Password', { exact: true }).fill('demo-password');
    await page.getByRole('button', { name: 'SIGN IN' }).click();

    await expect(
        page.getByRole('heading', { name: 'TODAY.' }),
    ).toBeVisible();

    await page.goto('/projects');
    await page.getByRole('button', { name: '+ NEW PROJECT' }).click();

    let dialog = page.getByRole('dialog');

    await dialog.getByLabel('Project name').fill(originalName);
    await dialog.getByRole('button', { name: 'CREATE PROJECT' }).click();

    await page.getByRole('link', { name: originalName }).click();

    await page.getByRole('button', { name: 'EDIT PROJECT' }).click();

    dialog = page.getByRole('dialog');

    await dialog.getByLabel('Project name').fill(updatedName);
    await dialog.getByRole('button', { name: 'SAVE PROJECT' }).click();

    await page.reload();

    await expect(
        page.getByRole('heading', {
            name: `${updatedName.toUpperCase()}.`,
            exact: true,
        }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'DELETE PROJECT' }).click();

    dialog = page.getByRole('dialog');

    await dialog.getByRole('button', { name: 'Confirm deletion' }).click();

    await expect(dialog).not.toBeVisible();

    await expect(
        page.getByRole('link', { name: updatedName }),
    ).toHaveCount(0);

    await page.goto('/projects');
    await page.reload();

    await expect(
        page.getByRole('link', { name: updatedName }),
    ).toHaveCount(0);
});

test('@api creates, edits and deletes a server-backed subtask', async ({ page }) => {
    const projectName = `Subtask Test ${Date.now()}`;
    const subtaskName = `Original Subtask ${Date.now()}`;
    const updatedName = `${subtaskName} Updated`;

    // Sign in.
    await page.goto('/login');
    await page.getByLabel('Password', { exact: true }).fill('demo-password');
    await page.getByRole('button', { name: 'SIGN IN' }).click();

    await expect(page.getByRole('heading', { name: 'TODAY.' })).toBeVisible();

    // Create a project for this test.
    await page.goto('/projects');
    await page.getByRole('button', { name: '+ NEW PROJECT' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Project name').fill(projectName);
    await dialog.getByRole('button', { name: 'CREATE PROJECT' }).click();

    await expect(dialog).not.toBeVisible();
    await page.getByRole('link', { name: projectName }).click();

    // Work only within the server-backed subtasks section.
    const section = page.getByRole('region', {
        name: 'Server-saved project subtasks',
    });

    // Create a subtask.
    await section.getByRole('textbox', { name: 'New subtask' }).fill(subtaskName);
    await section.getByRole('button', { name: 'Add Subtask' }).click();

    await expect(
        section.getByRole('checkbox', { name: subtaskName }),
    ).toBeVisible();

    // Verify creation survives reload.
    await page.reload();

    await expect(
        section.getByRole('checkbox', { name: subtaskName }),
    ).toBeVisible();

    // Mark the subtask complete and verify it persists.
    await section.getByRole('checkbox', { name: subtaskName }).click();

    await expect(
        section.getByRole('checkbox', { name: subtaskName }),
    ).toBeChecked();

    await page.reload();

    await expect(
        section.getByRole('checkbox', { name: subtaskName }),
    ).toBeChecked();

    // Edit the subtask.
    const subtask = section.getByRole('listitem').filter({
        has: page.getByRole('checkbox', { name: subtaskName, exact: true }),
    });

    await subtask.getByRole('button', { name: 'Edit' }).click();
    await section.getByRole('textbox', { name: 'Edit subtask' }).fill(updatedName);
    await section.getByRole('button', { name: 'Save Subtask' }).click();

    await expect(
        section.getByRole('checkbox', { name: updatedName }),
    ).toBeVisible();

    // Verify edit survives reload.
    await page.reload();

    await expect(
        section.getByRole('checkbox', { name: updatedName }),
    ).toBeVisible();

    // Delete the subtask.
    const updatedSubtask = section.getByRole('listitem').filter({
        has: page.getByRole('checkbox', { name: updatedName, exact: true }),
    });

    // Accept the browser's deletion confirmation.
    page.once('dialog', async (dialog) => {
        await dialog.accept();
    });

    await updatedSubtask.getByRole('button', { name: 'Delete' }).click();

    await expect(
        section.getByRole('checkbox', { name: updatedName }),
    ).toHaveCount(0);

    // Verify deletion survives reload.
    await page.reload();

    await expect(
        section.getByRole('checkbox', { name: updatedName }),
    ).toHaveCount(0);
});

test('@api preserves project input after a failed request', async ({ page }) => {
    const projectName = `Recovery Test ${Date.now()}`;

    // Sign in.
    await page.goto('/login');
    await page.getByLabel('Password', { exact: true }).fill('demo-password');
    await page.getByRole('button', { name: 'SIGN IN' }).click();

    await expect(page.getByRole('heading', { name: 'TODAY.' })).toBeVisible();

    await page.goto('/projects');
    await page.getByRole('button', { name: '+ NEW PROJECT' }).click();

    const dialog = page.getByRole('dialog');

    await dialog.getByLabel('Project name').fill(projectName);
    await dialog.getByLabel('Project description').fill('Keep this description');

    // Simulate a network failure for project creation.
    await page.route('**/v1/projects', async (route) => {
        if (route.request().method() === 'POST') {
            await route.abort('failed');
        } else {
            await route.continue();
        }
    });

    await dialog.getByRole('button', { name: 'CREATE PROJECT' }).click();

    // Confirm an error appears and the user's input is preserved.
    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(dialog.getByLabel('Project name')).toHaveValue(projectName);
    await expect(dialog.getByLabel('Project description')).toHaveValue(
        'Keep this description',
    );

    // Restore the network and retry.
    await page.unroute('**/v1/projects');

    await dialog.getByRole('button', { name: 'CREATE PROJECT' }).click();

    await expect(dialog).not.toBeVisible();

    // Confirm the retry successfully created the project.
    await expect(
        page.getByRole('link', { name: projectName }),
    ).toBeVisible();

    await page.reload();

    await expect(
        page.getByRole('link', { name: projectName }),
    ).toBeVisible();
});