import { expect, test, type Page } from '@playwright/test';
import { graphFixture, GRAPH_NOW } from '../fixtures/graph';

async function openGraph(
  page: Page,
  workspace = graphFixture(),
  query = '',
) {
  await page.clock.setFixedTime(GRAPH_NOW);
  await page.addInitScript((value) => {
    localStorage.setItem('project-tracker.session.v1', 'demo');
    localStorage.setItem('project-tracker.workspace.v1', JSON.stringify(value));
  }, workspace);
  await page.goto(`/graph${query}`);
  await expect(
    page.getByRole('heading', { name: 'graph.' }),
  ).toBeVisible();
}

const graph = (page: Page) =>
  page.getByRole('region', { name: 'Interactive work graph' });
const inspector = (page: Page) =>
  page.getByRole('complementary', { name: 'Selected task' });

async function readyGraph(page: Page) {
  await expect(graph(page)).toHaveAttribute('data-label-opacity', '1.000');
  await expect(
    page.locator('.graph-node-label[data-interactive="true"]').first(),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function wheel(page: Page, delta: number) {
  const box = await graph(page).boundingBox();
  await page.mouse.move(box!.x + 8, box!.y + 8);
  for (let tick = 0; tick < Math.ceil(Math.abs(delta) / 100); tick++)
    await page.mouse.wheel(0, Math.sign(delta) * 100);
  // Wheel delivery is asynchronous; let the final input reach the demand loop
  // before sampling the camera or starting a different gesture.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
      }),
  );
}

async function drag(
  page: Page,
  button: 'left' | 'right',
  dx: number,
  dy: number,
) {
  const box = await graph(page).boundingBox();
  await page.mouse.move(box!.x + 15, box!.y + 15);
  await page.mouse.down({ button });
  await page.mouse.move(box!.x + 15 + dx, box!.y + 15 + dy, { steps: 12 });
  await page.mouse.up({ button });
}

test('graph near/far detail, camera controls, selection and review captures', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  const workspace = graphFixture();
  await openGraph(page, workspace);
  await readyGraph(page);
  const visibleTitles = page.locator(
    '.graph-node-label[data-kind="task"][data-interactive="true"]',
  );
  const title = visibleTitles.first();
  const titleName = (await title.getAttribute('aria-label'))!.replace(
    'Select ',
    '',
  );
  await title.focus();
  await page.keyboard.press('Enter');
  await expect(inspector(page).getByRole('heading', { level: 2 })).toHaveText(
    titleName,
  );
  const labelRects = await page
    .locator('.graph-node-label[data-interactive="true"]')
    .evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      }),
    );
  for (const [index, rect] of labelRects.entries()) {
    for (const other of labelRects.slice(index + 1))
      expect(
        rect.left < other.right &&
          rect.right > other.left &&
          rect.top < other.bottom &&
          rect.bottom > other.top,
      ).toBe(false);
  }
  const nodeLabel = await visibleTitles.first().boundingBox();
  await page.mouse.move(
    nodeLabel!.x - 11,
    nodeLabel!.y + nodeLabel!.height / 2,
  );
  await expect(page.getByRole('tooltip')).toHaveText(titleName);
  await page.mouse.click(
    nodeLabel!.x - 11,
    nodeLabel!.y + nodeLabel!.height / 2,
  );
  await expect(inspector(page).getByRole('heading', { level: 2 })).toHaveText(
    titleName,
  );
  const openingCamera = await graph(page).getAttribute('data-camera');
  const openingTarget = await graph(page).getAttribute('data-target');
  const openingDistance = Number(
    await graph(page).getAttribute('data-distance'),
  );
  // Select the same deterministic task for both captures, through the shared list.
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await page
    .getByRole('button', { name: 'Review dashboard wireframes', exact: true })
    .click();
  await page.getByRole('button', { name: 'Graph', exact: true }).click();
  await readyGraph(page);
  await expect(graph(page)).toHaveAttribute('data-camera', openingCamera!);
  await expect(inspector(page).getByRole('heading', { level: 2 })).toHaveText(
    'Review dashboard wireframes',
  );
  await page.screenshot({
    path: 'test-results/graph-review/desktop-near.png',
    fullPage: true,
  });

  // A focused title leaves the tab order midway through the fade.
  await page
    .locator('.graph-node-label[data-kind="task"][data-interactive="true"]')
    .first()
    .focus();
  await wheel(page, 500);
  await expect
    .poll(async () =>
      Number(await graph(page).getAttribute('data-label-opacity')),
    )
    .toBeGreaterThan(0.01);
  await expect
    .poll(async () =>
      Number(await graph(page).getAttribute('data-label-opacity')),
    )
    .toBeLessThan(0.5);
  await expect(graph(page)).toBeFocused();
  await wheel(page, 500);
  await expect(graph(page)).toHaveAttribute('data-label-opacity', '0.000');
  expect(await page.locator('.graph-node-label[tabindex="0"]').count()).toBe(
    0,
  );
  expect(
    await page.locator('.graph-node-label[aria-hidden="false"]').count(),
  ).toBe(0);
  await page.screenshot({
    path: 'test-results/graph-review/desktop-far.png',
    fullPage: true,
  });
  const farCamera = await graph(page).getAttribute('data-camera');
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await page
    .getByRole('button', { name: 'Review dashboard wireframes', exact: true })
    .focus();
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Graph', exact: true }).click();
  await expect(graph(page)).toHaveAttribute('data-camera', farCamera!);
  await wheel(page, -500);
  await expect
    .poll(async () =>
      Number(await graph(page).getAttribute('data-label-opacity')),
    )
    .toBeGreaterThan(0.01);
  await expect
    .poll(async () =>
      Number(await graph(page).getAttribute('data-label-opacity')),
    )
    .toBeLessThan(0.99);
  await wheel(page, 500);
  await expect(graph(page)).toHaveAttribute('data-label-opacity', '0.000');
  const farDistance = Number(await graph(page).getAttribute('data-distance'));
  await drag(page, 'left', 140, 45);
  await expect
    .poll(async () => Number(await graph(page).getAttribute('data-distance')))
    .toBeCloseTo(farDistance, 1);
  await drag(page, 'right', 60, 20);
  await expect(graph(page)).not.toHaveAttribute('data-target', openingTarget!);
  await expect(graph(page)).toHaveAttribute('data-label-opacity', '0.000');
  // Dragging the graph never changes task selection.
  await expect(inspector(page).getByRole('heading', { level: 2 })).toHaveText(
    'Review dashboard wireframes',
  );
  await page.getByRole('button', { name: 'Automatic orbit' }).click();
  await expect(
    page.getByRole('button', { name: 'Automatic orbit' }),
  ).toHaveAttribute('aria-pressed', 'true');
  const orbitStart = await graph(page).getAttribute('data-camera');
  await expect(graph(page)).not.toHaveAttribute('data-camera', orbitStart!);
  await page.getByRole('button', { name: 'Reset View ↺' }).click();
  await expect(
    page.getByRole('button', { name: 'Automatic orbit' }),
  ).toHaveAttribute('aria-pressed', 'false');
  await expect(graph(page)).toHaveAttribute('data-label-opacity', '1.000');
  await expect
    .poll(async () => Number(await graph(page).getAttribute('data-distance')))
    .toBeCloseTo(openingDistance, 1);
  for (const [attribute, initial] of [
    ['data-target', openingTarget],
    ['data-camera', openingCamera],
  ]) {
    await expect
      .poll(async () => {
        const current = (await graph(page).getAttribute(attribute!))!
          .split(',')
          .map(Number);
        const expected = initial!.split(',').map(Number);
        return Math.hypot(
          ...current.map((value, index) => value - expected[index]!),
        );
      })
      .toBeLessThan(0.001);
  }
  expect(errors).toEqual([]);
});

test('graph filters, keyboard list access, subtask emphasis and task links', async ({
  page,
}) => {
  const workspace = graphFixture();
  await openGraph(page, workspace);
  await readyGraph(page);
  const camera = await graph(page).getAttribute('data-camera');
  await page
    .getByRole('combobox', { name: 'Filter project' })
    .selectOption(workspace.projects[0]!.id);
  await page.getByRole('searchbox').fill('BUILD TASK');
  await page
    .getByRole('combobox', { name: 'Filter status' })
    .selectOption('Overdue');
  await expect(graph(page)).toHaveAttribute('data-camera', camera!);
  await expect(page.getByRole('link', { name: '+ New Task' })).toHaveAttribute(
    'href',
    `/tasks/new?project=${workspace.projects[0]!.id}`,
  );
  await expect(
    inspector(page).getByRole('link', { name: 'Open Task →' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'List', exact: true }).click();
  const list = page.getByRole('list', { name: 'Graph task results' });
  await expect(list.locator(':scope > li')).toHaveCount(1);
  await list
    .getByRole('button', { name: 'Build task editor', exact: true })
    .focus();
  await page.keyboard.press('Enter');
  await expect(inspector(page).getByRole('heading', { level: 2 })).toHaveText(
    'Build task editor',
  );
  await list
    .getByRole('button', { name: /Step 1 for Build task editor/ })
    .click();
  await expect(inspector(page).getByText('Selected subtask')).toBeVisible();
  await list
    .getByRole('button', { name: 'Build task editor', exact: true })
    .click();
  await expect(inspector(page).getByText('Selected subtask')).toHaveCount(0);
  await page.getByRole('searchbox').fill('not found');
  await expect(page.getByText('No tasks match these filters.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(
    inspector(page).getByRole('link', { name: 'Open Task →' }),
  ).toHaveCount(0);
  await list
    .getByRole('button', { name: 'Review dashboard wireframes', exact: true })
    .click();
  await inspector(page).getByRole('link', { name: 'Open Task →' }).click();
  await expect(page).toHaveURL(`/tasks/${workspace.tasks[0]!.id}`);
});

test('graph renderer context loss falls back once and keeps selection and controls', async ({
  page,
}) => {
  await openGraph(page);
  await readyGraph(page);
  const title = await inspector(page)
    .getByRole('heading', { level: 2 })
    .textContent();
  await page
    .locator('.graph-canvas canvas')
    .evaluate((canvas) =>
      canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })),
    );
  await expect(page.getByText(/3D view is unavailable/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Graph', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('list', { name: 'Graph task results' }),
  ).toBeVisible();
  await expect(inspector(page).getByRole('heading', { level: 2 })).toHaveText(
    title!,
  );
  await expect(
    inspector(page).getByRole('link', { name: 'Open Task →' }),
  ).toBeVisible();
  await page.getByRole('searchbox').fill('dashboard');
  await expect(
    page
      .getByRole('list', { name: 'Graph task results' })
      .locator(':scope > li'),
  ).toHaveCount(1);
});

test('graph initialization failure provides an accessible list', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).includes('webgl')) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await openGraph(page);
  await expect(page.getByText(/3D view is unavailable/)).toBeVisible();
  await expect(
    page.getByRole('list', { name: 'Graph task results' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: '+ New Task' })).toBeVisible();
});

for (const width of [390, 375]) {
  test(`graph mobile stacked layout, reduced motion and list access at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openGraph(page);
    await readyGraph(page);
    await expect(
      page.getByRole('button', { name: 'Automatic orbit' }),
    ).toBeDisabled();
    await expect(
      page.getByText('Automatic orbit is off for reduced motion.'),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const graphBox = await graph(page).boundingBox();
    const inspectorBox = await inspector(page).boundingBox();
    expect(graphBox!.height).toBeGreaterThanOrEqual(360);
    expect(inspectorBox!.y).toBeGreaterThan(graphBox!.y + graphBox!.height);
    await expect(
      page
        .getByRole('navigation', { name: 'Mobile navigation' })
        .getByRole('link', { name: 'Graph' }),
    ).toBeAttached();
    if (width === 390)
      await page.screenshot({
        path: 'test-results/graph-review/mobile.png',
        fullPage: true,
      });
    await page.getByRole('button', { name: 'List', exact: true }).click();
    await page
      .getByRole('list', { name: 'Graph task results' })
      .getByRole('button', { name: 'Review dashboard wireframes', exact: true })
      .click();
    await expect(inspector(page).getByRole('heading', { level: 2 })).toHaveText(
      'Review dashboard wireframes',
    );
  });
}

test('graph dense fixture retains all 250 tasks and 1000 subtasks through list and filters', async ({
  page,
}) => {
  await openGraph(page, graphFixture(250, 4));
  await readyGraph(page);
  await expect(page.getByText('1254 nodes · 1253 connections')).toBeVisible();
  await page.getByRole('button', { name: 'List', exact: true }).click();
  const list = page.getByRole('list', { name: 'Graph task results' });
  await expect(list.locator(':scope > li')).toHaveCount(250);
  await expect(list.locator(':scope > li > ul > li')).toHaveCount(1000);
  await page.getByRole('searchbox').fill('Task 249');
  await expect(list.locator(':scope > li')).toHaveCount(1);
  await list.getByRole('button', { name: 'Task 249', exact: true }).click();
  await expect(inspector(page).getByRole('heading', { level: 2 })).toHaveText(
    'Task 249',
  );
  await expect(inspector(page).getByText('2 / 4 done')).toBeVisible();
});

test('graph single task, long titles, zero subtasks and empty workspace', async ({
  page,
}) => {
  const workspace = graphFixture(1, 0);
  workspace.tasks[0]!.title =
    'A long task title that remains readable and navigable on smaller screens '
      .repeat(4)
      .slice(0, 255);
  await openGraph(page, workspace);
  await readyGraph(page);
  await expect(inspector(page).getByText('0 / 0 done')).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(1280);
});

test('graph empty workspace offers task creation', async ({ page }) => {
  await openGraph(page, graphFixture(0, 0));
  await expect(page.getByText('No tasks yet.')).toBeVisible();
  await expect(
    inspector(page).getByRole('link', { name: 'Open Task →' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: '+ New Task' }).last(),
  ).toHaveAttribute('href', '/tasks/new');
});

test.describe('graph touch interaction', () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  test('one finger orbits and two fingers pan and pinch within the graph', async ({
    page,
  }) => {
    await openGraph(page);
    await readyGraph(page);
    await graph(page).scrollIntoViewIfNeeded();
    const openingCamera = await graph(page).getAttribute('data-camera');
    const openingTarget = await graph(page).getAttribute('data-target');
    const openingDistance = Number(
      await graph(page).getAttribute('data-distance'),
    );
    const box = (await graph(page).boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    const session = await page.context().newCDPSession(page);
    const touch = (
      type: 'touchStart' | 'touchMove' | 'touchEnd',
      points: { x: number; y: number; id: number }[],
    ) =>
      session.send('Input.dispatchTouchEvent', { type, touchPoints: points });
    await touch('touchStart', [{ x, y, id: 0 }]);
    for (let step = 1; step <= 8; step++)
      await touch('touchMove', [{ x: x + step * 8, y: y + step * 3, id: 0 }]);
    await touch('touchEnd', []);
    await expect(graph(page)).not.toHaveAttribute(
      'data-camera',
      openingCamera!,
    );
    await expect
      .poll(async () => Number(await graph(page).getAttribute('data-distance')))
      .toBeCloseTo(openingDistance, 1);
    await touch('touchStart', [
      { x: x - 25, y, id: 0 },
      { x: x + 25, y, id: 1 },
    ]);
    for (let step = 1; step <= 5; step++)
      await touch('touchMove', [
        { x: x - 25 + step * 4, y: y + step * 4, id: 0 },
        { x: x + 25 + step * 4, y: y + step * 4, id: 1 },
      ]);
    await touch('touchEnd', []);
    await expect(graph(page)).not.toHaveAttribute(
      'data-target',
      openingTarget!,
    );
    await expect
      .poll(async () => Number(await graph(page).getAttribute('data-distance')))
      .toBeCloseTo(openingDistance, 1);
    await touch('touchStart', [
      { x: x - 25, y, id: 0 },
      { x: x + 25, y, id: 1 },
    ]);
    for (let step = 1; step <= 5; step++)
      await touch('touchMove', [
        { x: x - 25 - step * 10, y, id: 0 },
        { x: x + 25 + step * 10, y, id: 1 },
      ]);
    await touch('touchEnd', []);
    await expect
      .poll(async () => Number(await graph(page).getAttribute('data-distance')))
      .toBeLessThan(openingDistance * 0.8);
    await session.detach();
    const scroll = await page.evaluate(() => window.scrollY);
    await page.mouse.move(5, 80);
    await page.mouse.wheel(0, 250);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(scroll);
  });
});

test('graph route and 3D code stay unloaded on unrelated routes', async ({
  page,
}) => {
  const assets: string[] = [];
  page.on('request', (request) => assets.push(request.url()));
  const workspace = graphFixture();
  await page.addInitScript((value) => {
    localStorage.setItem('project-tracker.session.v1', 'demo');
    localStorage.setItem('project-tracker.workspace.v1', JSON.stringify(value));
  }, workspace);
  await page.goto('/tasks');
  await expect(page.getByRole('heading', { name: 'TASKS.' })).toBeVisible();
  expect(assets.some((url) => /\/assets\/Graph/.test(url))).toBe(false);
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Graph' })
    .click();
  await readyGraph(page);
  expect(assets.some((url) => /\/assets\/GraphCanvas/.test(url))).toBe(true);
});
