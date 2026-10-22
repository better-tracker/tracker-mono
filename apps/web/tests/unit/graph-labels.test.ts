import { describe, expect, it, vi } from 'vitest';
import {
  applyLabelVisibility,
  placeLabels,
} from '../../src/features/graph/labels';

describe('projected graph labels', () => {
  it('prioritizes focus and selection, then breaks overlaps deterministically', () => {
    const rect = { x: 20, y: 20, width: 100, height: 30 };
    expect([
      ...placeLabels([
        { ...rect, id: 'z', priority: 0 },
        { ...rect, id: 'a', priority: 1 },
      ]),
    ]).toEqual(['z']);
    expect([
      ...placeLabels([
        { ...rect, id: 'z', priority: 2 },
        { ...rect, id: 'a', priority: 2 },
      ]),
    ]).toEqual(['a']);
  });
  it('removes pointer/tab access at half opacity and transfers focus without scrolling', () => {
    const container = document.createElement('div');
    container.tabIndex = 0;
    const label = document.createElement('button');
    container.append(label);
    document.body.append(container);
    applyLabelVisibility(label, 1, true, container);
    label.focus();
    const focus = vi.spyOn(container, 'focus');
    applyLabelVisibility(label, 0.5, true, container);
    expect(label.tabIndex).toBe(-1);
    expect(label.style.pointerEvents).toBe('none');
    expect(label.style.visibility).toBe('visible');
    expect(label).toHaveAttribute('aria-hidden', 'false');
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(container).toHaveFocus();
    applyLabelVisibility(label, 0.01, true, container);
    expect(label.style.visibility).toBe('hidden');
    expect(label).toHaveAttribute('aria-hidden', 'true');
    applyLabelVisibility(label, 1, false, container);
    expect(label.tabIndex).toBe(-1);
    expect(label.style.pointerEvents).toBe('none');
    applyLabelVisibility(label, 0.51, true, container);
    expect(label.tabIndex).toBe(0);
    expect(label.style.pointerEvents).toBe('auto');
    container.remove();
  });
});
