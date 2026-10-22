import { twMerge } from 'tailwind-merge';

/** Allow callers to override a component's defaults with Tailwind classes. */
export function cn(...classes: (string | false | undefined)[]): string {
  return twMerge(classes.filter(Boolean).join(' '));
}
