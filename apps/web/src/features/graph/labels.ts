export interface LabelRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  priority: number;
}

export function placeLabels(candidates: LabelRect[]) {
  const placed: LabelRect[] = [];
  const visible = new Set<string>();
  for (const candidate of [...candidates].sort(
    (a, b) => a.priority - b.priority || a.id.localeCompare(b.id),
  )) {
    if (
      placed.some(
        (other) =>
          candidate.x < other.x + other.width + 8 &&
          candidate.x + candidate.width + 8 > other.x &&
          candidate.y < other.y + other.height + 6 &&
          candidate.y + candidate.height + 6 > other.y,
      )
    )
      continue;
    placed.push(candidate);
    visible.add(candidate.id);
  }
  return visible;
}

export function applyLabelVisibility(
  element: HTMLElement,
  opacity: number,
  placed: boolean,
  container: HTMLElement,
) {
  const visible = placed && opacity > 0.01;
  const interactive = placed && opacity > 0.5;
  if (!interactive && element.contains(document.activeElement))
    container.focus({ preventScroll: true });
  element.style.opacity = String(opacity);
  element.style.visibility = visible ? 'visible' : 'hidden';
  element.style.pointerEvents = interactive ? 'auto' : 'none';
  element.setAttribute('aria-hidden', String(!visible));
  element.tabIndex = interactive && element.tagName === 'BUTTON' ? 0 : -1;
  element.dataset.interactive = String(interactive);
}
