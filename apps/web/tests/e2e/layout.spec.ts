import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const referencePath = new URL(
  '../../../../ui-designs/2bf45c88-5a63-495e-9e27-0d6ef14d74f7.svg',
  import.meta.url,
);
const screens = [
  {
    name: 'login',
    desktop: [80, 330, 1600, 1040],
    mobile: [80, 1860, 430, 1020],
  },
  {
    name: 'today',
    desktop: [1820, 330, 1600, 1160],
    mobile: [1820, 1860, 430, 1860],
  },
  {
    name: 'task',
    desktop: [3560, 330, 1600, 1300],
    mobile: [3560, 1860, 430, 1670],
  },
  {
    name: 'subtask',
    desktop: [5300, 330, 1600, 1170],
    mobile: [5300, 1860, 430, 1470],
  },
  {
    name: 'profile',
    desktop: [7040, 330, 1600, 1240],
    mobile: [7040, 1860, 430, 1670],
  },
];

test('renders the local Figma board into individual reference screenshots', async ({
  page,
}, testInfo) => {
  const svg = await readFile(referencePath, 'utf8');
  for (const screen of screens) {
    for (const format of ['desktop', 'mobile'] as const) {
      const [x, y, width, height] = screen[format] as [
        number,
        number,
        number,
        number,
      ];
      await page.setViewportSize({ width, height });
      const cropped = svg.replace(
        /<svg\b[^>]*>/,
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}">`,
      );
      await page.setContent(
        `<html><body style="margin:0;overflow:hidden">${cropped}</body></html>`,
      );
      const path = testInfo.outputPath(
        `reference-${screen.name}-${format}.png`,
      );
      await page.screenshot({ path });
      await testInfo.attach(`reference-${screen.name}-${format}`, {
        path,
        contentType: 'image/png',
      });
    }
  }
});

for (const width of [375, 430, 900, 1600]) {
  test(`all five reference screens remain usable at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width >= 900 ? 1300 : 950 });
    await page.clock.install({ time: new Date('2026-10-05T22:00:00Z') });
    await page.goto('/login');
    await page.getByLabel('Password', { exact: true }).fill('demo-password');
    const screenshot = async (name: string) => {
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
      await page.locator('body').click({ position: { x: 5, y: 5 } });
      const path = testInfo.outputPath(`${name}-${width}.png`);
      await page.screenshot({ path, fullPage: true });
      await testInfo.attach(`${name}-${width}`, {
        path,
        contentType: 'image/png',
      });
    };
    await screenshot('login');
    await page.getByRole('button', { name: 'SIGN IN' }).click();
    await expect(page.getByRole('heading', { name: 'TODAY.' })).toBeVisible();
    await screenshot('today');
    const taskId = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('project-tracker.workspace.v1')!)
          .tasks[0].id as string,
    );
    await page.goto('/tasks/new');
    await page
      .getByLabel('Task title', { exact: false })
      .fill('Review dashboard wireframes');
    await page
      .getByLabel('Description', { exact: true })
      .fill('Review layout, hierarchy and accessibility across devices.');
    await page.getByLabel('Due date').fill('2026-10-06');
    await page.getByLabel('Due time').fill('11:00');
    for (const [index, title] of [
      'Audit desktop layout',
      'Review empty states',
    ].entries()) {
      await page.getByRole('button', { name: '+ ADD SUBTASK' }).click();
      await page
        .getByLabel(`Draft subtask ${index + 1}`, { exact: true })
        .fill(title);
    }
    await screenshot('task');
    await page.goto(`/tasks/${taskId}/subtasks/new`);
    await page
      .getByLabel('Subtask title', { exact: false })
      .fill('Check mobile spacing');
    await page
      .getByLabel('Notes', { exact: true })
      .fill('Check spacing and tap targets on narrow screens.');
    await page.getByLabel('Due date').fill('2026-10-06');
    await page.getByLabel('Due time').fill('10:30');
    await screenshot('subtask');
    await page.goto('/profile');
    await expect(
      page.getByRole('heading', {
        name: width < 900 ? 'PROFILE.' : 'YOUR PROFILE.',
      }),
    ).toBeVisible();
    await screenshot('profile');
    const controls = await page
      .locator(
        'input:not([type="checkbox"]):visible, select:visible, button:visible:not(.text-button):not(.avatar-edit)',
      )
      .evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().height),
      );
    expect(controls.every((height) => height >= 44)).toBe(true);
    if (width < 900)
      await expect(
        page.getByRole('navigation', { name: 'Mobile navigation' }),
      ).toBeVisible();
    else
      await expect(
        page.getByRole('navigation', { name: 'Main navigation' }),
      ).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveCount(1);
  });
}
